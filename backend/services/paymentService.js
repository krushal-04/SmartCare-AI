const Razorpay = require("razorpay");
const crypto = require("crypto");
const CancellationPolicy = require("../models/CancellationPolicy");

let razorpayInstance = null;

const getRazorpayInstance = () => {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
        throw new Error(
            "Razorpay API credentials missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables."
        );
    }

    if (!razorpayInstance) {
        razorpayInstance = new Razorpay({
            key_id,
            key_secret,
        });
    }

    return razorpayInstance;
};

/**
 * Creates an order on Razorpay servers
 * @param {Object} params
 * @param {number} params.amountInRupees - Amount in INR
 * @param {string} params.receipt - Unique internal receipt string
 * @param {Object} params.notes - Metadata dictionary
 */
const createRazorpayOrder = async ({ amountInRupees, receipt, notes = {} }) => {
    const razorpay = getRazorpayInstance();
    const amountInPaise = Math.round(Number(amountInRupees) * 100);

    if (isNaN(amountInPaise) || amountInPaise <= 0) {
        throw new Error("Invalid payment amount. Amount must be greater than zero.");
    }

    const options = {
        amount: amountInPaise,
        currency: "INR",
        receipt: String(receipt || `rcpt_${Date.now()}`).slice(0, 40),
        notes,
    };

    const order = await razorpay.orders.create(options);
    return order;
};

/**
 * Verifies Razorpay payment signature
 */
const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) throw new Error("RAZORPAY_KEY_SECRET is not configured.");

    const expectedSignature = crypto
        .createHmac("sha256", key_secret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

    return expectedSignature === signature;
};

/**
 * Fetches transaction details directly from Razorpay
 */
const fetchRazorpayPayment = async (paymentId) => {
    const razorpay = getRazorpayInstance();
    return await razorpay.payments.fetch(paymentId);
};

/**
 * Initiates a refund through Razorpay
 * @param {Object} params
 * @param {string} params.paymentId - Gateway payment ID (e.g. pay_xxx)
 * @param {number} params.amountInRupees - Refund amount in INR
 * @param {string} params.receipt - Unique refund receipt identifier
 * @param {Object} params.notes - Refund reason and appointment metadata
 */
const initiateRazorpayRefund = async ({
    paymentId,
    amountInRupees,
    receipt,
    notes = {},
}) => {
    const razorpay = getRazorpayInstance();
    const amountInPaise = Math.round(Number(amountInRupees) * 100);

    const options = {
        amount: amountInPaise,
        speed: "normal",
        notes,
    };

    if (receipt) {
        options.receipt = String(receipt).slice(0, 40);
    }

    const refund = await razorpay.payments.refund(paymentId, options);
    return refund;
};

/**
 * Verifies Razorpay Webhook signature
 */
const verifyWebhookSignature = (rawBody, signature) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return false;

    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

    return expectedSignature === signature;
};

/**
 * Calculates refund eligibility and amount according to the CancellationPolicy
 */
const calculateRefundDetails = async (appointment, cancelledBy = "patient") => {
    // 1. If hospital or doctor cancels, always 100% refund
    if (["hospital", "doctor", "admin"].includes(cancelledBy)) {
        return {
            refundPercentage: 100,
            refundAmount: appointment.consultationFee,
            nonRefundableAmount: 0,
            policyDescription:
                "100% full refund because cancellation was initiated by the healthcare facility or doctor.",
            tierApplied: "Hospital/Doctor/Admin Cancellation",
            eligibleForAutoRefund: true,
        };
    }

    // 2. Load active cancellation policy or use standard tiers
    let policy = await CancellationPolicy.findOne({ isActive: true }).lean();
    if (!policy) {
        policy = {
            tiers: [
                {
                    hoursBeforeAppointment: 24,
                    refundPercentage: 100,
                    description: "Full 100% refund if cancelled 24+ hours before appointment",
                },
                {
                    hoursBeforeAppointment: 12,
                    refundPercentage: 50,
                    description: "50% refund if cancelled between 12 and 24 hours before appointment",
                },
                {
                    hoursBeforeAppointment: 0,
                    refundPercentage: 0,
                    description:
                        "No automatic refund within 12 hours of appointment; hospital review required.",
                },
            ],
            hospitalOrDoctorCancelRefundPercentage: 100,
        };
    }

    // 3. Compute hours until appointment
    const apptDate = new Date(appointment.appointmentDate);
    if (appointment.appointmentTime && appointment.appointmentTime.includes(":")) {
        const [hours, mins] = appointment.appointmentTime.split(":").map(Number);
        apptDate.setHours(hours || 0, mins || 0, 0, 0);
    }

    const now = new Date();
    const diffMs = apptDate.getTime() - now.getTime();
    const hoursRemaining = diffMs / (1000 * 60 * 60);

    // Sort policy tiers descending by hoursBeforeAppointment
    const sortedTiers = [...(policy.tiers || [])].sort(
        (a, b) => b.hoursBeforeAppointment - a.hoursBeforeAppointment
    );

    let matchedTier = sortedTiers[sortedTiers.length - 1]; // default to lowest tier

    for (const tier of sortedTiers) {
        if (hoursRemaining >= tier.hoursBeforeAppointment) {
            matchedTier = tier;
            break;
        }
    }

    const fee = Number(appointment.consultationFee) || 0;
    const percentage = matchedTier ? matchedTier.refundPercentage : 0;
    const refundAmount = Math.round(((fee * percentage) / 100) * 100) / 100;
    const nonRefundableAmount = Math.max(0, fee - refundAmount);

    return {
        refundPercentage: percentage,
        refundAmount,
        nonRefundableAmount,
        policyDescription:
            matchedTier?.description ||
            `${percentage}% refund for cancellations with ${hoursRemaining.toFixed(1)} hours notice.`,
        hoursRemaining: Math.max(0, Math.round(hoursRemaining * 10) / 10),
        tierApplied: `${percentage}% Tier (>= ${matchedTier?.hoursBeforeAppointment || 0}h)`,
        eligibleForAutoRefund: refundAmount > 0,
    };
};

module.exports = {
    getRazorpayInstance,
    createRazorpayOrder,
    verifyPaymentSignature,
    fetchRazorpayPayment,
    initiateRazorpayRefund,
    verifyWebhookSignature,
    calculateRefundDetails,
};

