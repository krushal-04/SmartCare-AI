const mongoose = require("mongoose");

const medicalReportSchema = new mongoose.Schema(
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

        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
        },

        reportType: {
            type: String,
            enum: [
                "Blood Test",
                "X-Ray",
                "MRI",
                "CT Scan",
                "Prescription",
                "Discharge Summary",
                "Other",
            ],
            default: "Other",
        },

        originalName: {
            type: String,
            required: true,
        },

        storedName: {
            type: String,
            required: true,
        },

        mimeType: {
            type: String,
            required: true,
        },

        size: {
            type: Number,
            default: 0,
        },

        filePath: {
            type: String,
            required: true,
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 1000,
        },

        uploadedBy: {
            type: String,
            enum: ["Patient", "Hospital"],
            default: "Patient",
        },
    },
    {
        timestamps: true,
    }
);

medicalReportSchema.index({
    patientId: 1,
    createdAt: -1,
});

module.exports = mongoose.model(
    "MedicalReport",
    medicalReportSchema
);