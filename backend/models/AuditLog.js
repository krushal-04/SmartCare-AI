const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        userName: {
            type: String,
            trim: true,
        },
        userRole: {
            type: String,
            trim: true,
        },
        action: {
            type: String,
            required: true,
            trim: true,
        },
        details: {
            type: String,
            trim: true,
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        targetType: {
            type: String,
            enum: ["Hospital", "User", "Ambulance", "Emergency", "Medicine", "Appointment", "Report", "Department", "Doctor", "System"],
            default: "System",
        },
        ipAddress: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
