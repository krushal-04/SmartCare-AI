const mongoose = require("mongoose");

const doctorScheduleSchema = new mongoose.Schema(
    {
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
            required: true,
            unique: true,
        },

        workingDays: [
            {
                type: String,
                enum: [
                    "Sunday",
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                ],
            },
        ],

        startTime: {
            type: String,
            required: true,
        },

        endTime: {
            type: String,
            required: true,
        },

        slotDuration: {
            type: Number,
            default: 30,
            min: 5,
        },

        leaveDates: [
            {
                type: String,
            },
        ],

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "DoctorSchedule",
    doctorScheduleSchema
);