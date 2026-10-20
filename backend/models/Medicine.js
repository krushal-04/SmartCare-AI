const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
    {
        medicineName: {
            type: String,
            required: true,
            trim: true,
        },
        genericName: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            enum: [
                "Antibiotic",
                "Analgesic",
                "Antipyretic",
                "Cardiovascular",
                "Antidiabetic",
                "Antihistamine",
                "Respiratory",
                "Gastrointestinal",
                "Neurological",
                "Dermatological",
                "Other",
            ],
            default: "Other",
        },
        manufacturer: {
            type: String,
            required: true,
            trim: true,
        },
        dosageForm: {
            type: String,
            enum: [
                "Tablet",
                "Capsule",
                "Syrup",
                "Injection",
                "Ointment",
                "Drops",
                "Inhaler",
                "Other",
            ],
            default: "Tablet",
        },
        strength: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        generalInfo: {
            type: String,
            trim: true,
        },
        usageInfo: {
            type: String,
            trim: true,
        },
        precautions: {
            type: String,
            trim: true,
        },
        sideEffects: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ["Active", "Discontinued"],
            default: "Active",
        },
    },
    {
        timestamps: true,
    }
);

medicineSchema.index({ medicineName: "text", genericName: "text", category: 1 });

module.exports = mongoose.model("Medicine", medicineSchema);
