const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        hospitalName: {
            type: String,
            required: true
        },

        hospitalEmail: {
            type: String,
            required: true
        },

        hospitalPhone: {
            type: String,
            required: true
        },

        address: {
            type: String,
            required: true
        },

        city: {
            type: String,
            required: true
        },

        state: {
            type: String,
            required: true
        },

        pincode: {
            type: String,
            required: true
        },

        description: {
            type: String
        },

        facilities: [
            {
                type: String
            }
        ],

        hospitalImages: [
            {
                type: String
            }
        ],

        latitude: {
            type: Number
        },

        longitude: {
            type: Number
        },

        emergencyAvailable: {
            type: Boolean,
            default: false
        },

        rating: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Hospital", hospitalSchema);