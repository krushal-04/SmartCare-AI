const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        message: {
            type: String,
            required: true,
            trim: true,
        },

        type: {
            type: String,
            enum: [
                "Appointment",
                "Emergency",
                "Report",
                "System",
                "AI",
                "Review",
                "Hospital",
                "Admin",
                "Payment",
                "Refund",
            ],
            default: "System",
        },

        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
        },

        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

notificationSchema.pre("validate", function () {
    const validEnums = [
        "Appointment",
        "Emergency",
        "Report",
        "System",
        "AI",
        "Review",
        "Hospital",
        "Admin",
        "Payment",
        "Refund",
    ];
    if (this.type) {
        const found = validEnums.find(
            (v) => v.toLowerCase() === String(this.type).trim().toLowerCase()
        );
        this.type = found || "System";
    } else {
        this.type = "System";
    }
});

notificationSchema.index({
    userId: 1,
    isRead: 1,
    createdAt: -1,
});

module.exports = mongoose.model(
    "Notification",
    notificationSchema
);