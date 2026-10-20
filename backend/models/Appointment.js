const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        hospitalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hospital",
            required: true,
        },

        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
            required: true,
        },

        departmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            required: true,
        },

        appointmentDate: {
            type: Date,
            required: true,
        },

        appointmentTime: {
            type: String,
            required: true,
        },

        reason: {
            type: String,
            trim: true,
            maxlength: 500,
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Confirmed",
                "Completed",
                "Cancelled",
                "Rejected",
            ],
            default: "Pending",
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
    },
    {
        timestamps: true,
    }
);

appointmentSchema.index({
    patientId: 1,
    appointmentDate: -1,
});

appointmentSchema.index({
    doctorId: 1,
    appointmentDate: 1,
    appointmentTime: 1,
});

module.exports = mongoose.model(
    "Appointment",
    appointmentSchema
);