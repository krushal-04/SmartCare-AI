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
        hospitalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hospital",
        },
        currentLocation: {
            latitude: { type: Number },
            longitude: { type: Number },
            address: { type: String, trim: true },
        },
        status: {
            type: String,
            enum: ["Available", "Assigned", "On The Way", "Busy", "Offline"],
            default: "Available",
        },
        availability: {
            type: Boolean,
            default: true,
        },
        assignedEmergencyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "EmergencyRequest",
        },
    },
    {
        timestamps: true,
    }
);

ambulanceSchema.index({ hospitalId: 1, status: 1 });
ambulanceSchema.index({ status: 1, availability: 1 });

module.exports = mongoose.model("Ambulance", ambulanceSchema);
