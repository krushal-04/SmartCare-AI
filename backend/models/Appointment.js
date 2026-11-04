const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        hospitalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hospital",
            required: true,
        },

        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
            required: true,
        },

        departmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            required: true,
        },

        appointmentDate: {
            type: Date,
            required: true,
        },

        appointmentTime: {
            type: String,
            required: true,
        },

        reason: {
            type: String,
            trim: true,
            maxlength: 500,
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Confirmed",
                "Completed",
                "Cancelled",
                "Rejected",
            ],
            default: "Pending",
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 1000,
        },

        // PAYMENT INTEGRATION FIELDS
        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Payment",
        },

        paymentStatus: {
            type: String,
            enum: [
                "Pending",
                "Paid",
                "Failed",
                "PartiallyRefunded",
                "Refunded",
                "NotRequired",
            ],
            default: "Pending",
            index: true,
        },

        paymentRequired: {
            type: Boolean,
            default: true,
        },

        consultationFee: {
            type: Number,
            default: 0,
            min: 0,
        },

        bookingStatus: {
            type: String,
            enum: [
                "PendingPayment",
                "Confirmed",
                "Completed",
                "Cancelled",
                "Rejected",
            ],
            default: "PendingPayment",
            index: true,
        },

        // CANCELLATION & REFUND TRACKING
        cancellationReason: {
            type: String,
            trim: true,
            default: "",
        },

        cancelledAt: {
            type: Date,
        },

        cancelledBy: {
            type: String,
            enum: ["patient", "doctor", "hospital", "admin"],
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

        refundAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        gatewayRefundId: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

appointmentSchema.index({
    patientId: 1,
    appointmentDate: -1,
});

appointmentSchema.index({
    doctorId: 1,
    appointmentDate: 1,
    appointmentTime: 1,
});

appointmentSchema.index({
    hospitalId: 1,
    appointmentDate: 1,
});

appointmentSchema.index({
    paymentStatus: 1,
    createdAt: -1,
});

module.exports = mongoose.model(
    "Appointment",
    appointmentSchema
);
