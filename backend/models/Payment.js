const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        hospitalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hospital",
            required: true,
            index: true,
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
            required: true,
            index: true,
        },
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
            required: true,
            index: true,
        },
        gateway: {
            type: String,
            enum: ["Razorpay", "Stripe"],
            default: "Razorpay",
        },
        gatewayOrderId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        gatewayPaymentId: {
            type: String,
            index: true,
            sparse: true,
        },
        gatewaySignature: {
            type: String,
            default: "",
        },
        gatewayRefundId: {
            type: String,
            index: true,
            sparse: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: "INR",
        },
        paymentStatus: {
            type: String,
            enum: [
                "Created",
                "Pending",
                "Paid",
                "Failed",
                "PartiallyRefunded",
                "Refunded",
            ],
            default: "Created",
            index: true,
        },
        refundStatus: {
            type: String,
            enum: [
                "NotRequested",
                "Requested",
                "Processing",
                "Completed",
                "Failed",
                "NotApplicable",
            ],
            default: "NotRequested",
            index: true,
        },
        paymentMethod: {
            type: String,
            default: "online",
        },
        transactionReference: {
            type: String,
            sparse: true,
            index: true,
        },
        paidAt: {
            type: Date,
        },
        refundAmount: {
            type: Number,
            default: 0,
        },
        refundedAt: {
            type: Date,
        },
        cancellationReason: {
            type: String,
            default: "",
        },
        failureReason: {
            type: String,
            default: "",
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ patientId: 1, paymentStatus: 1 });
paymentSchema.index({ doctorId: 1, paymentStatus: 1 });
paymentSchema.index({ hospitalId: 1, paymentStatus: 1 });

module.exports = mongoose.model("Payment", paymentSchema);

