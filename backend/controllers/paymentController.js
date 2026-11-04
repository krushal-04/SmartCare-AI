const Payment = require("../models/Payment");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");
const Department = require("../models/Department");
const DoctorSchedule = require("../models/DoctorSchedule");
const CancellationPolicy = require("../models/CancellationPolicy");
const Notification = require("../models/Notification");
const AuditLog = require("../models/AuditLog");
const User = require("../models/User");
const paymentService = require("../services/paymentService");
const emailService = require("../services/emailService");

const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

const toMinutes = (time) => {
    const [hours, minutes] = String(time).split(":").map(Number);
    return hours * 60 + minutes;
};

const getDateRange = (dateString) => {
    const [y, m, d] = String(dateString).split("-").map(Number);
    const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    const end = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
    return { start, end };
};

const parseAppointmentDate = (dateString) => {
    const [y, m, d] = String(dateString).split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
};

const getTodayString = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

/**
 * 1. Create Razorpay Order & Pending Appointment / Payment Record
 * POST /api/payment/create-order
 * Patient Only
 */
exports.createOrder = async (req, res) => {
    try {
        const {
            hospitalId,
            doctorId,
            departmentId,
            appointmentDate,
            appointmentTime,
            reason,
        } = req.body;

        if (
            !hospitalId ||
            !doctorId ||
            !departmentId ||
            !appointmentDate ||
            !appointmentTime
        ) {
            return res.status(400).json({
                success: false,
                message: "Hospital, doctor, department, date, and time are required.",
            });
        }

        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!datePattern.test(appointmentDate)) {
            return res.status(400).json({
                success: false,
                message: "Appointment date must be in YYYY-MM-DD format.",
            });
        }

        const todayString = getTodayString();
        if (appointmentDate < todayString) {
            return res.status(400).json({
                success: false,
                message: "Appointment date cannot be in the past.",
            });
        }

        const [hospital, doctor, department] = await Promise.all([
            Hospital.findById(hospitalId),
            Doctor.findById(doctorId),
            Department.findById(departmentId),
        ]);

        if (!hospital) {
            return res.status(404).json({ success: false, message: "Hospital not found." });
        }
        if (!doctor) {
            return res.status(404).json({ success: false, message: "Doctor not found." });
        }
        if (!department) {
            return res.status(404).json({ success: false, message: "Department not found." });
        }

        // Validate doctor schedule
        let schedule = await DoctorSchedule.findOne({
            doctorId,
            isActive: true,
        }).lean();

        if (!schedule) {
            schedule = await DoctorSchedule.findOneAndUpdate(
                { doctorId },
                {
                    doctorId,
                    workingDays: [
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                    ],
                    startTime: "09:00",
                    endTime: "17:00",
                    slotDuration: 30,
                    leaveDates: [],
                    isActive: true,
                },
                { upsert: true, returnDocument: "after" }
            ).lean();
        }

        const [y, m, d] = appointmentDate.split("-").map(Number);
        const dayOfWeekIndex = new Date(y, m - 1, d).getDay();
        const selectedDay = dayNames[dayOfWeekIndex];

        if (!schedule.workingDays.includes(selectedDay)) {
            return res.status(400).json({
                success: false,
                message: `Doctor is not scheduled to consult on ${selectedDay}.`,
            });
        }

        const isDateOnLeave = (schedule.leaveDates || []).some((ld) => {
            const formattedLd = String(ld).split("T")[0].trim();
            const formattedAppt = String(appointmentDate).split("T")[0].trim();
            return formattedLd === formattedAppt;
        });

        if (isDateOnLeave) {
            return res.status(400).json({
                success: false,
                message: "Doctor is marked on leave on this date.",
            });
        }

        const requestedMinutes = toMinutes(appointmentTime);
        const startMinutes = toMinutes(schedule.startTime);
        const endMinutes = toMinutes(schedule.endTime);

        if (
            requestedMinutes < startMinutes ||
            requestedMinutes + schedule.slotDuration > endMinutes ||
            (requestedMinutes - startMinutes) % schedule.slotDuration !== 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Selected time is not a valid appointment slot for this doctor.",
            });
        }

        // Slot conflict check (excluding Cancelled or Rejected)
        const { start, end } = getDateRange(appointmentDate);
        const existing = await Appointment.findOne({
            doctorId,
            appointmentDate: { $gte: start, $lte: end },
            appointmentTime,
            status: { $nin: ["Cancelled", "Rejected"] },
            // If someone abandoned an unpaid order older than 15 mins, allow rebooking
            $or: [
                { paymentStatus: "Paid" },
                { status: "Confirmed" },
                { createdAt: { $gt: new Date(Date.now() - 15 * 60 * 1000) } },
            ],
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "This appointment slot is already reserved or booked. Please pick another slot.",
            });
        }

        const fee = Number(doctor.consultationFee) || 0;

        // If consultation fee is 0, no payment required
        if (fee <= 0) {
            const freeAppointment = await Appointment.create({
                patientId: req.user._id,
                hospitalId,
                doctorId,
                departmentId,
                appointmentDate: parseAppointmentDate(appointmentDate),
                appointmentTime,
                reason: reason?.trim() || "",
                status: "Confirmed",
                bookingStatus: "Confirmed",
                paymentStatus: "NotRequired",
                paymentRequired: false,
                consultationFee: 0,
            });

            await freeAppointment.populate([
                { path: "hospitalId", select: "hospitalName city hospitalEmail" },
                { path: "doctorId", select: "doctorName specialization consultationFee" },
                { path: "departmentId", select: "name" },
            ]);

            // Notify patient & hospital
            await Notification.create({
                userId: req.user._id,
                title: "Appointment Confirmed",
                message: `Your appointment with Dr. ${doctor.doctorName} on ${appointmentDate} at ${appointmentTime} is confirmed (Free Consultation).`,
                type: "Appointment",
            });

            await emailService.sendAppointmentCreatedEmail(
                freeAppointment,
                req.user,
                doctor,
                hospital
            );

            return res.status(201).json({
                success: true,
                paymentRequired: false,
                message: "Free consultation appointment confirmed successfully.",
                appointment: freeAppointment,
            });
        }

        // Create Razorpay Order
        const receipt = `apt_${Date.now()}_${String(req.user._id).slice(-4)}`;
        const razorpayOrder = await paymentService.createRazorpayOrder({
            amountInRupees: fee,
            receipt,
            notes: {
                patientId: req.user._id.toString(),
                doctorId: doctor._id.toString(),
                hospitalId: hospital._id.toString(),
                appointmentDate,
                appointmentTime,
            },
        });

        // Create Pending Appointment
        const appointment = await Appointment.create({
            patientId: req.user._id,
            hospitalId,
            doctorId,
            departmentId,
            appointmentDate: parseAppointmentDate(appointmentDate),
            appointmentTime,
            reason: reason?.trim() || "",
            status: "Pending",
            bookingStatus: "PendingPayment",
            paymentStatus: "Pending",
            paymentRequired: true,
            consultationFee: fee,
        });

        // Create Pending Payment Record
        const payment = await Payment.create({
            patientId: req.user._id,
            hospitalId,
            doctorId,
            appointmentId: appointment._id,
            gateway: "Razorpay",
            gatewayOrderId: razorpayOrder.id,
            amount: fee,
            currency: "INR",
            paymentStatus: "Pending",
            refundStatus: "NotRequested",
            transactionReference: razorpayOrder.id,
            metadata: {
                receipt: razorpayOrder.receipt,
                created_at: razorpayOrder.created_at,
            },
        });

        appointment.paymentId = payment._id;
        await appointment.save();

        res.status(200).json({
            success: true,
            paymentRequired: true,
            keyId: process.env.RAZORPAY_KEY_ID,
            order: razorpayOrder,
            appointmentId: appointment._id,
            paymentId: payment._id,
            amount: fee,
            currency: "INR",
            doctor: {
                name: doctor.doctorName,
                specialization: doctor.specialization,
                consultationFee: fee,
            },
            hospital: {
                name: hospital.hospitalName,
                city: hospital.city,
            },
        });
    } catch (error) {
        console.error("createOrder error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to initiate payment order.",
        });
    }
};

/**
 * 2. Verify Payment Signature & Confirm Appointment
 * POST /api/payment/verify-payment
 * Patient Only
 */
exports.verifyPayment = async (req, res) => {
    try {
        const {
            appointmentId,
            paymentId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        if (
            !appointmentId ||
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Missing payment verification parameters.",
            });
        }

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ success: false, message: "Appointment record not found." });
        }

        let paymentRecord = null;
        if (paymentId) {
            paymentRecord = await Payment.findById(paymentId);
        } else {
            paymentRecord = await Payment.findOne({ gatewayOrderId: razorpay_order_id });
        }

        if (!paymentRecord) {
            return res.status(404).json({ success: false, message: "Payment record not found." });
        }

        // Idempotency check: if already confirmed and paid, return success immediately
        if (paymentRecord.paymentStatus === "Paid" && appointment.paymentStatus === "Paid") {
            const populatedAppt = await Appointment.findById(appointment._id)
                .populate("hospitalId", "hospitalName city hospitalEmail phone")
                .populate("doctorId", "doctorName specialization consultationFee userId")
                .populate("departmentId", "name");

            return res.status(200).json({
                success: true,
                message: "Payment successfully verified and appointment confirmed.",
                appointment: populatedAppt,
                payment: paymentRecord,
            });
        }

        // Verify HMAC-SHA256 Signature
        const isValidSignature = paymentService.verifyPaymentSignature({
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            signature: razorpay_signature,
        });

        if (!isValidSignature) {
            paymentRecord.paymentStatus = "Failed";
            paymentRecord.failureReason = "Cryptographic signature verification failed";
            await paymentRecord.save();

            appointment.paymentStatus = "Failed";
            await appointment.save();

            return res.status(400).json({
                success: false,
                message: "Payment signature verification failed. Untrusted transaction response.",
            });
        }

        // Fetch payment details directly from Razorpay
        let paymentMethod = "online";
        let rzpPaymentDetails = null;
        try {
            rzpPaymentDetails = await paymentService.fetchRazorpayPayment(razorpay_payment_id);
            paymentMethod = rzpPaymentDetails.method || "online";
        } catch (fetchErr) {
            console.warn("Could not fetch payment from Razorpay API:", fetchErr.message);
        }

        // Update Payment record
        paymentRecord.gatewayPaymentId = razorpay_payment_id;
        paymentRecord.gatewaySignature = razorpay_signature;
        paymentRecord.paymentStatus = "Paid";
        paymentRecord.paymentMethod = paymentMethod;
        paymentRecord.transactionReference = razorpay_payment_id;
        paymentRecord.paidAt = new Date();
        if (rzpPaymentDetails) {
            paymentRecord.metadata = { ...paymentRecord.metadata, razorpay: rzpPaymentDetails };
        }
        await paymentRecord.save();

        // Update Appointment record
        appointment.paymentStatus = "Paid";
        appointment.status = "Confirmed";
        appointment.bookingStatus = "Confirmed";
        appointment.paymentId = paymentRecord._id;
        await appointment.save();

        const [populatedAppt, patientUser, doctorObj, hospitalObj] = await Promise.all([
            Appointment.findById(appointment._id)
                .populate("hospitalId", "hospitalName city hospitalEmail phone")
                .populate("doctorId", "doctorName specialization consultationFee userId")
                .populate("departmentId", "name"),
            User.findById(appointment.patientId).select("fullName email phone"),
            Doctor.findById(appointment.doctorId),
            Hospital.findById(appointment.hospitalId),
        ]);

        // Create Notifications (safely non-blocking)
        Notification.create({
            userId: appointment.patientId,
            title: "Payment Successful & Appointment Confirmed",
            message: `Your payment of ₹${paymentRecord.amount} for appointment with Dr. ${doctorObj?.doctorName || "your specialist"} was successful. Status: Confirmed.`,
            type: "Payment",
        }).catch((e) => console.warn("Patient notification err:", e.message));

        // Hospital notification
        if (hospitalObj?.userId) {
            Notification.create({
                userId: hospitalObj.userId,
                title: "New Paid Appointment",
                message: `Patient ${patientUser?.fullName || "Patient"} booked Dr. ${doctorObj?.doctorName} on ${appointment.appointmentDate.toISOString().split("T")[0]} at ${appointment.appointmentTime}. Fee: ₹${paymentRecord.amount}.`,
                type: "Appointment",
            }).catch((e) => console.warn("Hospital notification err:", e.message));
        }

        // Doctor notification if doctor has userId
        if (doctorObj?.userId) {
            Notification.create({
                userId: doctorObj.userId,
                title: "New Confirmed Appointment",
                message: `Patient ${patientUser?.fullName || "Patient"} booked consultation for ${appointment.appointmentTime}. Fee paid: ₹${paymentRecord.amount}.`,
                type: "Appointment",
            }).catch((e) => console.warn("Doctor notification err:", e.message));
        }

        // Audit Log
        AuditLog.create({
            userId: req.user._id,
            userName: req.user.fullName || "User",
            userRole: req.user.role || "patient",
            action: "PAYMENT_CAPTURED",
            targetType: "Appointment",
            targetId: appointment._id,
            details: `Patient ${patientUser?.fullName || "Patient"} paid ₹${paymentRecord.amount} for Appointment #${appointment._id} via Razorpay (${razorpay_payment_id}).`,
        }).catch((e) => console.warn("AuditLog err:", e.message));

        // Send Payment Success and Confirmation Email
        emailService
            .sendPaymentSuccessEmail({
                payment: paymentRecord,
                appointment: populatedAppt,
                patient: patientUser,
                doctor: doctorObj,
                hospital: hospitalObj,
            })
            .catch((err) => console.error("sendPaymentSuccessEmail error:", err.message));

        res.status(200).json({
            success: true,
            message: "Payment successfully verified and appointment confirmed.",
            appointment: populatedAppt,
            payment: paymentRecord,
        });
    } catch (error) {
        console.error("verifyPayment error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to verify payment.",
        });
    }
};

/**
 * 3. Handle Payment Failure / Cancellation by User
 * POST /api/payment/handle-failure
 */
exports.handleFailure = async (req, res) => {
    try {
        const { appointmentId, paymentId, error } = req.body;

        if (paymentId) {
            await Payment.findByIdAndUpdate(paymentId, {
                paymentStatus: "Failed",
                failureReason: error?.description || error?.message || "Payment cancelled or failed at checkout",
            });
        }

        if (appointmentId) {
            await Appointment.findByIdAndUpdate(appointmentId, {
                paymentStatus: "Failed",
            });
        }

        res.status(200).json({
            success: true,
            message: "Payment failure recorded.",
        });
    } catch (err) {
        console.error("handleFailure error:", err);
        res.status(500).json({ success: false, message: "Error recording payment failure." });
    }
};

/**
 * 4. Get Refund Preview / Eligibility
 * GET /api/payment/refund-preview/:appointmentId
 */
exports.getRefundPreview = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const appointment = await Appointment.findById(appointmentId)
            .populate("doctorId", "doctorName consultationFee")
            .populate("hospitalId", "hospitalName");

        if (!appointment) {
            return res.status(404).json({ success: false, message: "Appointment not found." });
        }

        const refundDetails = await paymentService.calculateRefundDetails(
            appointment,
            req.user.role
        );

        res.status(200).json({
            success: true,
            appointmentId: appointment._id,
            consultationFee: appointment.consultationFee,
            paymentStatus: appointment.paymentStatus,
            refundDetails,
        });
    } catch (error) {
        console.error("getRefundPreview error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Unable to calculate refund preview.",
        });
    }
};

/**
 * 5. Cancel Appointment & Process Automatic Refund
 * POST /api/payment/cancel-and-refund/:appointmentId
 * Patient, Hospital, Doctor, or Admin
 */
exports.cancelAndRefund = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { reason } = req.body;

        const appointment = await Appointment.findById(appointmentId)
            .populate("doctorId", "doctorName specialization consultationFee userId")
            .populate("hospitalId", "hospitalName hospitalEmail userId")
            .populate("patientId", "fullName email phone");

        if (!appointment) {
            return res.status(404).json({ success: false, message: "Appointment not found." });
        }

        // Ownership / Authorization verification
        const userRole = req.user.role;
        const userIdStr = req.user._id.toString();

        if (userRole === "patient" && appointment.patientId?._id?.toString() !== userIdStr) {
            return res.status(403).json({
                success: false,
                message: "You can only cancel your own appointments.",
            });
        }

        if (
            userRole === "hospital" &&
            appointment.hospitalId?._id?.toString() !== userIdStr &&
            appointment.hospitalId?.userId?.toString() !== userIdStr
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only cancel appointments under your hospital.",
            });
        }

        if (appointment.status === "Cancelled") {
            return res.status(400).json({
                success: false,
                message: "This appointment is already cancelled.",
            });
        }

        if (appointment.status === "Completed") {
            return res.status(400).json({
                success: false,
                message: "Completed appointments cannot be cancelled or refunded.",
            });
        }

        // If not paid, simply cancel without gateway refund
        if (appointment.paymentStatus !== "Paid") {
            appointment.status = "Cancelled";
            appointment.bookingStatus = "Cancelled";
            appointment.cancellationReason = reason || "Cancelled before payment";
            appointment.cancelledAt = new Date();
            appointment.cancelledBy = userRole;
            appointment.refundStatus = "NotApplicable";
            await appointment.save();

            return res.status(200).json({
                success: true,
                message: "Unpaid appointment cancelled successfully.",
                appointment,
            });
        }

        // Fetch payment record
        let paymentRecord = null;
        if (appointment.paymentId) {
            paymentRecord = await Payment.findById(appointment.paymentId);
        } else {
            paymentRecord = await Payment.findOne({
                appointmentId: appointment._id,
                paymentStatus: "Paid",
            });
        }

        if (!paymentRecord || !paymentRecord.gatewayPaymentId) {
            // No gateway transaction ID to refund
            appointment.status = "Cancelled";
            appointment.bookingStatus = "Cancelled";
            appointment.cancellationReason = reason || "Cancelled";
            appointment.cancelledAt = new Date();
            appointment.cancelledBy = userRole;
            appointment.refundStatus = "Processing";
            await appointment.save();

            return res.status(200).json({
                success: true,
                message: "Appointment cancelled. Offline refund processing queued.",
                appointment,
            });
        }

        // Calculate refund according to tier policy
        const refundDetails = await paymentService.calculateRefundDetails(
            appointment,
            userRole
        );

        let razorpayRefund = null;
        let refundStatus = "NotApplicable";
        let refundAmount = 0;

        if (refundDetails.refundAmount > 0) {
            refundAmount = refundDetails.refundAmount;
            try {
                // Call real Razorpay Refund API
                razorpayRefund = await paymentService.initiateRazorpayRefund({
                    paymentId: paymentRecord.gatewayPaymentId,
                    amountInRupees: refundAmount,
                    receipt: `ref_${String(appointment._id).slice(-8)}_${Date.now()}`,
                    notes: {
                        appointmentId: appointment._id.toString(),
                        cancellationReason: reason || "User Cancellation",
                        policyTier: refundDetails.tierApplied,
                        cancelledBy: userRole,
                    },
                });

                refundStatus = razorpayRefund.status === "processed" ? "Completed" : "Processing";
            } catch (refundErr) {
                console.error("Razorpay Refund API error:", refundErr);
                refundStatus = "Processing"; // Kept in processing for retry / gateway processing
            }
        }

        // Update Payment record
        paymentRecord.refundStatus = refundStatus;
        paymentRecord.refundAmount = refundAmount;
        paymentRecord.refundedAt = new Date();
        paymentRecord.cancellationReason = reason || "Appointment cancelled";
        paymentRecord.paymentStatus =
            refundAmount >= paymentRecord.amount ? "Refunded" : refundAmount > 0 ? "PartiallyRefunded" : "Paid";

        if (razorpayRefund?.id) {
            paymentRecord.gatewayRefundId = razorpayRefund.id;
        }
        await paymentRecord.save();

        // Update Appointment record
        appointment.status = "Cancelled";
        appointment.bookingStatus = "Cancelled";
        appointment.cancellationReason = reason || "Appointment cancelled";
        appointment.cancelledAt = new Date();
        appointment.cancelledBy = userRole;
        appointment.refundStatus = refundStatus;
        appointment.refundAmount = refundAmount;
        if (razorpayRefund?.id) {
            appointment.gatewayRefundId = razorpayRefund.id;
        }
        await appointment.save();

        // Audit Log
        AuditLog.create({
            userId: req.user._id,
            userName: req.user.fullName || "User",
            userRole: userRole,
            action: "APPOINTMENT_CANCELLED_REFUND",
            targetType: "Appointment",
            targetId: appointment._id,
            details: `Appointment #${appointment._id} cancelled by ${userRole}. Refund of ₹${refundAmount} (${refundDetails.refundPercentage}%) initiated via Razorpay (${razorpayRefund?.id || "queued"}).`,
        }).catch((e) => console.warn("AuditLog err:", e.message));

        // In-app notifications (safely non-blocking)
        Notification.create({
            userId: appointment.patientId?._id || appointment.patientId,
            title: "Appointment Cancelled & Refund Initiated",
            message: `Your appointment with Dr. ${appointment.doctorId?.doctorName || "your doctor"} was cancelled. Refund of ₹${refundAmount} has been initiated to your original payment method.`,
            type: "Refund",
        }).catch((e) => console.warn("Notification err:", e.message));

        // Email to patient
        if (refundAmount > 0) {
            emailService
                .sendRefundInitiatedEmail({
                    payment: paymentRecord,
                    appointment,
                    patient: appointment.patientId,
                    refundAmount,
                    policyDescription: refundDetails.policyDescription,
                })
                .catch((e) => console.error("Refund email error:", e.message));
        }

        res.status(200).json({
            success: true,
            message:
                refundAmount > 0
                    ? `Appointment cancelled successfully. A refund of ₹${refundAmount} (${refundDetails.refundPercentage}%) has been initiated.`
                    : "Appointment cancelled. Per cancellation policy, no refund is applicable within this cancellation window.",
            appointment,
            payment: paymentRecord,
            refundDetails,
            gatewayRefund: razorpayRefund,
        });
    } catch (error) {
        console.error("cancelAndRefund error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to cancel appointment and process refund.",
        });
    }
};

/**
 * 6. Get Patient Payment History
 * GET /api/payment/patient-history
 * Patient Only
 */
exports.getPatientPaymentHistory = async (req, res) => {
    try {
        const payments = await Payment.find({ patientId: req.user._id })
            .populate("doctorId", "doctorName specialization qualification consultationFee")
            .populate("hospitalId", "hospitalName city address")
            .populate("appointmentId", "appointmentDate appointmentTime status bookingStatus reason")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            payments,
            count: payments.length,
        });
    } catch (error) {
        console.error("getPatientPaymentHistory error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to retrieve patient payment history.",
        });
    }
};

/**
 * 7. Get Doctor Payment Summary & Collections
 * GET /api/payment/doctor-summary
 * Doctor, Hospital, or Admin
 */
exports.getDoctorPaymentSummary = async (req, res) => {
    try {
        let doctorId = req.query.doctorId;

        // If logged in as doctor, find doctor profile linked to user
        if (req.user.role === "doctor") {
            const doc = await Doctor.findOne({
                $or: [{ userId: req.user._id }, { email: req.user.email }],
            });
            if (doc) {
                doctorId = doc._id;
            } else {
                return res.status(404).json({
                    success: false,
                    message: "Doctor profile linked to this user account not found.",
                });
            }
        }

        if (!doctorId) {
            return res.status(400).json({
                success: false,
                message: "doctorId parameter is required.",
            });
        }

        const payments = await Payment.find({ doctorId })
            .populate("patientId", "fullName email phone")
            .populate("appointmentId", "appointmentDate appointmentTime status bookingStatus")
            .sort({ createdAt: -1 });

        let totalPaidAppointments = 0;
        let totalConsultationFeeCollected = 0;
        let totalRefundedAmount = 0;
        let pendingCount = 0;

        payments.forEach((p) => {
            if (p.paymentStatus === "Paid") {
                totalPaidAppointments += 1;
                totalConsultationFeeCollected += p.amount;
            } else if (p.paymentStatus === "Refunded" || p.paymentStatus === "PartiallyRefunded") {
                totalConsultationFeeCollected += p.amount;
                totalRefundedAmount += p.refundAmount || 0;
            } else if (p.paymentStatus === "Pending") {
                pendingCount += 1;
            }
        });

        res.status(200).json({
            success: true,
            summary: {
                totalPaidAppointments,
                totalConsultationFeeCollected,
                totalRefundedAmount,
                netEarnings: totalConsultationFeeCollected - totalRefundedAmount,
                pendingCount,
                totalTransactions: payments.length,
            },
            payments,
        });
    } catch (error) {
        console.error("getDoctorPaymentSummary error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to retrieve doctor payment summary.",
        });
    }
};

/**
 * 8. Get Hospital Payment Summary
 * GET /api/payment/hospital-summary
 * Hospital or Admin
 */
exports.getHospitalPaymentSummary = async (req, res) => {
    try {
        let hospitalId = req.user.role === "hospital" ? req.user._id : req.query.hospitalId;

        // Also check if hospital user has a Hospital profile record
        if (req.user.role === "hospital") {
            const hospDoc = await Hospital.findOne({
                $or: [{ _id: req.user._id }, { userId: req.user._id }, { hospitalEmail: req.user.email }],
            });
            if (hospDoc) hospitalId = hospDoc._id;
        }

        if (!hospitalId) {
            return res.status(400).json({ success: false, message: "Hospital ID required." });
        }

        const payments = await Payment.find({ hospitalId })
            .populate("patientId", "fullName email phone")
            .populate("doctorId", "doctorName specialization")
            .populate("appointmentId", "appointmentDate appointmentTime status")
            .sort({ createdAt: -1 });

        let totalPaid = 0;
        let totalRevenue = 0;
        let totalRefunded = 0;
        let pendingCount = 0;

        payments.forEach((p) => {
            if (p.paymentStatus === "Paid") {
                totalPaid += 1;
                totalRevenue += p.amount;
            } else if (p.paymentStatus === "Refunded" || p.paymentStatus === "PartiallyRefunded") {
                totalRevenue += p.amount;
                totalRefunded += p.refundAmount || 0;
            } else if (p.paymentStatus === "Pending") {
                pendingCount += 1;
            }
        });

        res.status(200).json({
            success: true,
            summary: {
                totalPaid,
                totalRevenue,
                totalRefunded,
                netRevenue: totalRevenue - totalRefunded,
                pendingCount,
                totalTransactions: payments.length,
            },
            payments,
        });
    } catch (error) {
        console.error("getHospitalPaymentSummary error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to retrieve hospital payment summary.",
        });
    }
};

/**
 * 9. Get Platform-wide Payment Overview
 * GET /api/payment/admin-overview
 * Admin Only
 */
exports.getAdminPaymentOverview = async (req, res) => {
    try {
        const payments = await Payment.find({})
            .populate("patientId", "fullName email phone")
            .populate("doctorId", "doctorName specialization")
            .populate("hospitalId", "hospitalName city")
            .populate("appointmentId", "appointmentDate appointmentTime status")
            .sort({ createdAt: -1 });

        let totalRevenue = 0;
        let totalRefunded = 0;
        let successfulCount = 0;
        let failedCount = 0;
        let refundedCount = 0;
        let pendingCount = 0;

        payments.forEach((p) => {
            if (p.paymentStatus === "Paid") {
                successfulCount += 1;
                totalRevenue += p.amount;
            } else if (p.paymentStatus === "Refunded" || p.paymentStatus === "PartiallyRefunded") {
                successfulCount += 1;
                refundedCount += 1;
                totalRevenue += p.amount;
                totalRefunded += p.refundAmount || 0;
            } else if (p.paymentStatus === "Failed") {
                failedCount += 1;
            } else if (p.paymentStatus === "Pending") {
                pendingCount += 1;
            }
        });

        res.status(200).json({
            success: true,
            metrics: {
                totalTransactions: payments.length,
                successfulCount,
                refundedCount,
                failedCount,
                pendingCount,
                totalRevenue,
                totalRefunded,
                netRevenue: totalRevenue - totalRefunded,
            },
            payments,
        });
    } catch (error) {
        console.error("getAdminPaymentOverview error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to retrieve admin payment overview.",
        });
    }
};

/**
 * 10. Razorpay Webhook Handler
 * POST /api/payment/webhook
 * Public endpoint verified by HMAC SHA256
 */
exports.handleWebhook = async (req, res) => {
    try {
        const signature = req.headers["x-razorpay-signature"];
        const rawBody = req.rawBody || JSON.stringify(req.body);

        const isValid = paymentService.verifyWebhookSignature(rawBody, signature);
        if (!isValid) {
            console.warn("[Webhook] Invalid Razorpay webhook signature");
            return res.status(400).json({ status: "invalid_signature" });
        }

        const event = req.body.event;
        const payload = req.body.payload;

        console.log(`[Razorpay Webhook] Received event: ${event}`);

        if (event === "payment.captured") {
            const paymentEntity = payload.payment.entity;
            const orderId = paymentEntity.order_id;
            const paymentId = paymentEntity.id;

            const paymentRecord = await Payment.findOne({ gatewayOrderId: orderId });
            if (paymentRecord && paymentRecord.paymentStatus !== "Paid") {
                paymentRecord.paymentStatus = "Paid";
                paymentRecord.gatewayPaymentId = paymentId;
                paymentRecord.paymentMethod = paymentEntity.method || "online";
                paymentRecord.paidAt = new Date();
                paymentRecord.metadata = { ...paymentRecord.metadata, webhookCaptured: paymentEntity };
                await paymentRecord.save();

                await Appointment.findByIdAndUpdate(paymentRecord.appointmentId, {
                    paymentStatus: "Paid",
                    status: "Confirmed",
                    bookingStatus: "Confirmed",
                });
            }
        } else if (event === "payment.failed") {
            const paymentEntity = payload.payment.entity;
            const orderId = paymentEntity.order_id;

            const paymentRecord = await Payment.findOne({ gatewayOrderId: orderId });
            if (paymentRecord && paymentRecord.paymentStatus !== "Paid") {
                paymentRecord.paymentStatus = "Failed";
                paymentRecord.failureReason = paymentEntity.error_description || "Webhook reported failed payment";
                await paymentRecord.save();

                await Appointment.findByIdAndUpdate(paymentRecord.appointmentId, {
                    paymentStatus: "Failed",
                });
            }
        } else if (event === "refund.processed") {
            const refundEntity = payload.refund.entity;
            const paymentId = refundEntity.payment_id;

            const paymentRecord = await Payment.findOne({ gatewayPaymentId: paymentId });
            if (paymentRecord) {
                paymentRecord.refundStatus = "Completed";
                await paymentRecord.save();

                await Appointment.findByIdAndUpdate(paymentRecord.appointmentId, {
                    refundStatus: "Completed",
                });
            }
        }

        res.status(200).json({ status: "ok" });
    } catch (err) {
        console.error("Webhook processing error:", err);
        res.status(500).json({ status: "error", message: err.message });
    }
};

/**
 * 11. Get Cancellation Policy
 * GET /api/payment/policy
 */
exports.getCancellationPolicy = async (req, res) => {
    try {
        let policy = await CancellationPolicy.findOne({ isActive: true });
        if (!policy) {
            policy = await CancellationPolicy.create({
                name: "SmartCare Healthcare Cancellation & Refund Policy",
                tiers: [
                    {
                        hoursBeforeAppointment: 24,
                        refundPercentage: 100,
                        description: "100% full refund if cancelled 24+ hours before scheduled time",
                    },
                    {
                        hoursBeforeAppointment: 12,
                        refundPercentage: 50,
                        description: "50% refund if cancelled between 12 and 24 hours before scheduled time",
                    },
                    {
                        hoursBeforeAppointment: 0,
                        refundPercentage: 0,
                        description: "Non-refundable within 12 hours of appointment time",
                    },
                ],
                hospitalOrDoctorCancelRefundPercentage: 100,
                isActive: true,
            });
        }

        res.status(200).json({ success: true, policy });
    } catch (err) {
        console.error("getCancellationPolicy error:", err);
        res.status(500).json({ success: false, message: "Unable to retrieve cancellation policy." });
    }
};

/**
 * 12. Update Cancellation Policy
 * PUT /api/payment/policy
 * Admin Only
 */
exports.updateCancellationPolicy = async (req, res) => {
    try {
        const { tiers, hospitalOrDoctorCancelRefundPercentage, name } = req.body;

        let policy = await CancellationPolicy.findOne({ isActive: true });
        if (!policy) {
            policy = new CancellationPolicy();
        }

        if (name) policy.name = name;
        if (tiers && Array.isArray(tiers)) policy.tiers = tiers;
        if (typeof hospitalOrDoctorCancelRefundPercentage === "number") {
            policy.hospitalOrDoctorCancelRefundPercentage = hospitalOrDoctorCancelRefundPercentage;
        }
        policy.updatedBy = req.user._id;
        policy.isActive = true;

        await policy.save();

        res.status(200).json({
            success: true,
            message: "Cancellation & refund policy updated successfully.",
            policy,
        });
    } catch (err) {
        console.error("updateCancellationPolicy error:", err);
        res.status(500).json({ success: false, message: "Unable to update cancellation policy." });
    }
};

