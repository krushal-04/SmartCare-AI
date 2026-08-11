const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
    {
        hospitalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hospital",
            required: true
        },

        departmentName: {
            type: String,
            required: true
        },

        description: {
            type: String
        },

        departmentImage: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Department", departmentSchema);