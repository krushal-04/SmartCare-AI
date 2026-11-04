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
                "Pending",
                "PendingPayment",
                "Confirmed",
                "Completed",
                "Cancelled",
                "Rejected",
            ],
            default: "Pending",
            index: true,
        },

        // HOSPITAL APPROVAL & REJECTION AUDIT
        approvedAt: {
            type: Date,
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        rejectionReason: {
            type: String,
            trim: true,
            default: "",
        },
        rejectedAt: {
            type: Date,
        },
        rejectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
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

appointmentSchema.pre("validate", function () {
    if (this.status) {
        const s = String(this.status).trim().toLowerCase();
        if (s === "pending") this.status = "Pending";
        else if (s === "confirmed") this.status = "Confirmed";
        else if (s === "completed") this.status = "Completed";
        else if (s === "cancelled") this.status = "Cancelled";
        else if (s === "rejected") this.status = "Rejected";
    }
    if (this.bookingStatus) {
        const b = String(this.bookingStatus).trim().toLowerCase();
        if (b === "pending" || b === "pendingpayment") this.bookingStatus = "Pending";
        else if (b === "confirmed") this.bookingStatus = "Confirmed";
        else if (b === "completed") this.bookingStatus = "Completed";
        else if (b === "cancelled") this.bookingStatus = "Cancelled";
        else if (b === "rejected") this.bookingStatus = "Rejected";
    }
    if (this.paymentStatus) {
        const p = String(this.paymentStatus).trim().toLowerCase();
        if (p === "pending") this.paymentStatus = "Pending";
        else if (p === "paid") this.paymentStatus = "Paid";
        else if (p === "failed") this.paymentStatus = "Failed";
        else if (p === "refunded") this.paymentStatus = "Refunded";
        else if (p === "partiallyrefunded") this.paymentStatus = "PartiallyRefunded";
        else if (p === "refund initiated" || p === "refund_initiated") this.paymentStatus = "Refund Initiated";
        else if (p === "notrequired" || p === "free") this.paymentStatus = "NotRequired";
        else if (p === "notapplicable") this.paymentStatus = "NotApplicable";
    }
});

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
