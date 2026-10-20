const mongoose = require("mongoose");

const emergencyRequestSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        hospitalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hospital",
        },

        ambulanceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ambulance",
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

        status: {
            type: String,
            enum: [
                "Requested",
                "Assigned",
                "On The Way",
                "Arrived",
                "Completed",
                "Cancelled",
            ],
            default: "Requested",
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

emergencyRequestSchema.index({
    patientId: 1,
    createdAt: -1,
});

module.exports = mongoose.model(
    "EmergencyRequest",
    emergencyRequestSchema
);