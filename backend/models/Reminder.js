const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
    {
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
            required: true,
            index: true,
        },
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
            required: true,
            index: true,
        },
        hospitalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hospital",
            required: true,
            index: true,
        },
        reminderType: {
            type: String,
            enum: ["24_HOURS", "1_HOUR"],
            required: true,
        },
        scheduledAt: {
            type: Date,
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ["PENDING", "PROCESSING", "SENT", "FAILED", "CANCELLED"],
            default: "PENDING",
            index: true,
        },
        sentAt: {
            type: Date,
        },
        attempts: {
            type: Number,
            default: 0,
        },
        lastError: {
            type: String,
            default: "",
        },
        appointmentVersion: {
            type: Number,
            default: 1,
        },
        channels: {
            inApp: {
                type: Boolean,
                default: true,
            },
            email: {
                type: Boolean,
                default: true,
            },
            sms: {
                type: Boolean,
                default: false,
            },
        },
        channelResults: {
            inApp: {
                type: Boolean,
                default: false,
            },
            email: {
                type: Boolean,
                default: false,
            },
        },
        idempotencyKey: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

reminderSchema.index({ status: 1, scheduledAt: 1 });
reminderSchema.index({ patientId: 1, status: 1 });
reminderSchema.index({ appointmentId: 1, reminderType: 1 });

module.exports = mongoose.model("Reminder", reminderSchema);

