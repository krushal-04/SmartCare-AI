const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
    {
        hospitalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hospital",
            required: true
        },

        departmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            required: true
        },

        doctorName: {
            type: String,
            required: true
        },

        email: {
            type: String,
            required: true
        },

        phone: {
            type: String,
            required: true
        },

        qualification: {
            type: String,
            required: true
        },

        specialization: {
            type: String,
            required: true
        },

        experience: {
            type: Number,
            default: 0
        },

        consultationFee: {
            type: Number,
            default: 0
        },

        gender: {
            type: String,
            enum: ["Male", "Female", "Other"]
        },

        languages: {
            type: [String],
            default: []
        },

        doctorImage: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Doctor", doctorSchema);