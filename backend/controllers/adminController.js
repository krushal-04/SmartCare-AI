const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const getPendingHospitals = async (req, res) => {

    try {

        const hospitals = await User.find({
            role: "hospital",
            status: "Pending"
        }).select("-password");

        res.status(200).json({
            success: true,
            hospitals
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

const approveHospital = async (req, res) => {

    try {

        const hospital = await User.findOne({
            _id: req.params.id,
            role: "hospital"
        });

        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: "Hospital not found"
            });
        }

        hospital.isApproved = true;
        hospital.isVerified = true;
        hospital.status = "Approved";

        await hospital.save();

        await sendEmail(
            hospital.email,
            "SmartCare AI - Hospital Registration Approved",
            `Dear ${hospital.fullName},

Your SmartCare AI hospital registration has been approved.

You can now login to your SmartCare AI account.

Thank you,
SmartCare AI Team`
        );

        res.status(200).json({
            success: true,
            message: "Hospital approved and email sent successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

const rejectHospital = async (req, res) => {

    try {

        const hospital = await User.findOne({
            _id: req.params.id,
            role: "hospital"
        });

        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: "Hospital not found"
            });
        }

        hospital.isApproved = false;
        hospital.status = "Rejected";

        await hospital.save();

        await sendEmail(
            hospital.email,
            "SmartCare AI - Hospital Registration Rejected",
            `Dear ${hospital.fullName},

Your SmartCare AI hospital registration has been rejected by the administrator.

Please contact SmartCare AI support for more information.

Thank you,
SmartCare AI Team`
        );

        res.status(200).json({
            success: true,
            message: "Hospital rejected and email sent successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

const getAllHospitals = async (req, res) => {

    try {

        const hospitals = await User.find({
            role: "hospital"
        }).select("-password");

        res.status(200).json({
            success: true,
            hospitals
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

module.exports = {
    getPendingHospitals,
    approveHospital,
    rejectHospital,
    getAllHospitals
};