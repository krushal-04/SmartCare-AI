const mongoose = require("mongoose");

const cancellationPolicySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            default: "SmartCare Healthcare Cancellation & Refund Policy",
        },
        tiers: [
            {
                hoursBeforeAppointment: {
                    type: Number,
                    required: true,
                },
                refundPercentage: {
                    type: Number,
                    required: true,
                    min: 0,
                    max: 100,
                },
                description: {
                    type: String,
                    default: "",
                },
            },
        ],
        hospitalOrDoctorCancelRefundPercentage: {
            type: Number,
            default: 100,
            min: 0,
            max: 100,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("CancellationPolicy", cancellationPolicySchema);

