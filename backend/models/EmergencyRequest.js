const mongoose = require("mongoose");

const emergencyRequestSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        emergencyCategory: {
            type: String,
            default: "Other Emergency",
            trim: true,
        },

        consciousness: {
            type: String,
            enum: ["conscious", "unconscious"],
            default: "conscious",
        },

        breathingStatus: {
            type: String,
            enum: ["normal", "difficulty", "not_breathing"],
            default: "normal",
        },

        patientCount: {
            type: Number,
            default: 1,
            min: 1,
        },

        hospitalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hospital",
        },

        recommendedHospitalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hospital",
        },

        assignedHospitalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hospital",
        },

        ambulanceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ambulance",
        },

        recommendedAmbulanceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ambulance",
        },

        assignedAmbulanceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ambulance",
        },

        assignedDriverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        latitude: {
            type: Number,
        },

        longitude: {
            type: Number,
        },

        address: {
            type: String,
            trim: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },

        contactNumber: {
            type: String,
            required: [true, "Contact number is required"],
            trim: true,
            match: [/^[6-9]\d{9}$/, "Contact number must be a valid 10-digit mobile number starting with 6, 7, 8, or 9"],
        },

        hospitalAcceptanceStatus: {
            type: String,
            enum: ["PENDING", "ACCEPTED", "REJECTED"],
            default: "PENDING",
        },

        hospitalRejectReason: {
            type: String,
            trim: true,
        },

        journeyStatus: {
            type: String,
            enum: [
                "DISPATCHED",
                "EN_ROUTE_TO_PATIENT",
                "ARRIVED_AT_PATIENT",
                "PATIENT_ONBOARD",
                "EN_ROUTE_TO_HOSPITAL",
                "HANDOVER_COMPLETE",
                "CLOSED",
                null,
            ],
            default: null,
        },

        status: {
            type: String,
            enum: [
                // Legacy
                "Requested",
                "Assigned",
                "On The Way",
                "Arrived",
                "Completed",
                "Cancelled",
                // New state machine
                "NEW",
                "HOSPITAL_RECOMMENDED",
                "HOSPITAL_PENDING",
                "HOSPITAL_ACCEPTED",
                "AMBULANCE_SELECTED",
                "DISPATCHED",
                "EN_ROUTE_TO_PATIENT",
                "ARRIVED_AT_PATIENT",
                "PATIENT_ONBOARD",
                "EN_ROUTE_TO_HOSPITAL",
                "HANDOVER_COMPLETE",
                "CLOSED",
                // Exception states
                "HOSPITAL_REJECTED",
                "NO_CAPABLE_HOSPITAL",
                "NO_AVAILABLE_AMBULANCE",
                "AMBULANCE_NOT_RESPONDING",
                "GPS_STALE",
                "MANUAL_ESCALATION",
                "FAILED",
            ],
            default: "Requested",
        },

        statusHistory: [
            {
                status: { type: String, required: true },
                changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                role: { type: String },
                changedAt: { type: Date, default: Date.now },
                note: { type: String, trim: true },
            },
        ],

        driverIssue: {
            reported: { type: Boolean, default: false },
            reason: { type: String, trim: true },
            reportedAt: { type: Date },
        },

        overrideInfo: {
            overriddenBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            reason: { type: String, trim: true },
            previousHospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
            previousAmbulanceId: { type: mongoose.Schema.Types.ObjectId, ref: "Ambulance" },
            timestamp: { type: Date },
        },

        hospitalNotes: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
    },
    {
        timestamps: true,
    }
);

emergencyRequestSchema.index({ patientId: 1, createdAt: -1 });
emergencyRequestSchema.index({ hospitalId: 1, status: 1 });
emergencyRequestSchema.index({ assignedHospitalId: 1, status: 1 });
emergencyRequestSchema.index({ assignedDriverId: 1, journeyStatus: 1 });
emergencyRequestSchema.index({ status: 1 });

module.exports = mongoose.model("EmergencyRequest", emergencyRequestSchema);
