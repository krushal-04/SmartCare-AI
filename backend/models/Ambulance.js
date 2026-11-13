const mongoose = require("mongoose");

const ambulanceSchema = new mongoose.Schema(
    {
        ambulanceNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },
        vehicleRegNumber: {
            type: String,
            trim: true,
            uppercase: true,
        },
        vehicleType: {
            type: String,
            enum: [
                "Basic Life Support (BLS)",
                "Advanced Life Support (ALS)",
                "Patient Transport",
                "Neonatal Ambulance",
            ],
            default: "Basic Life Support (BLS)",
        },
        capability: {
            type: [String],
            enum: ["BASIC", "CARDIAC", "TRAUMA", "OXYGEN_SUPPORT"],
            default: ["BASIC"],
        },
        driverName: {
            type: String,
            required: true,
            trim: true,
        },
        driverPhone: {
            type: String,
            required: true,
            trim: true,
        },
        driverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        hospitalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hospital",
        },
        currentLocation: {
            latitude: { type: Number },
            longitude: { type: Number },
            accuracy: { type: Number },
            speed: { type: Number },
            heading: { type: Number },
            address: { type: String, trim: true },
            updatedAt: { type: Date, default: Date.now },
        },
        status: {
            type: String,
            enum: ["Available", "Assigned", "On The Way", "Busy", "Offline"],
            default: "Available",
        },
        availabilityStatus: {
            type: String,
            enum: [
                "AVAILABLE",
                "DISPATCHED",
                "EN_ROUTE_TO_PATIENT",
                "ARRIVED_AT_PATIENT",
                "PATIENT_ONBOARD",
                "EN_ROUTE_TO_HOSPITAL",
                "HANDOVER_COMPLETE",
                "OFF_DUTY",
                "MAINTENANCE",
                "ISSUE_REPORTED",
                "RESTRICTED",
            ],
            default: "AVAILABLE",
        },
        availability: {
            type: Boolean,
            default: true,
        },
        assignedEmergencyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "EmergencyRequest",
        },
        isRestricted: {
            type: Boolean,
            default: false,
        },
        restrictionReason: {
            type: String,
            trim: true,
        },
        restrictedAt: Date,
        restrictedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

ambulanceSchema.index({ hospitalId: 1, status: 1 });
ambulanceSchema.index({ hospitalId: 1, availabilityStatus: 1 });
ambulanceSchema.index({ status: 1, availability: 1 });

module.exports = mongoose.model("Ambulance", ambulanceSchema);
