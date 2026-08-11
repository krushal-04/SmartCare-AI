const Hospital = require("../models/Hospital");

const addHospital = async (req, res) => {
    try {
        const hospitalExists = await Hospital.findOne({
            userId: req.user._id
        });

        if (hospitalExists) {
            return res.status(400).json({
                success: false,
                message: "Hospital profile already exists"
            });
        }

        const hospital = await Hospital.create({
            userId: req.user._id,
            hospitalName: req.body.hospitalName,
            hospitalEmail: req.user.email,
            hospitalPhone: req.user.phone,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            pincode: req.body.pincode,
            description: req.body.description,
            facilities: req.body.facilities,
            hospitalImages: req.body.hospitalImages,
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            emergencyAvailable: req.body.emergencyAvailable
        });

        res.status(201).json({
            success: true,
            message: "Hospital Added Successfully",
            hospital
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getHospitals = async (req, res) => {
    try {
        const hospitals = await Hospital.find().populate(
            "userId",
            "fullName email phone role"
        );

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

const getHospitalById = async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.params.id).populate(
            "userId",
            "fullName email phone role"
        );

        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: "Hospital not found"
            });
        }

        res.status(200).json({
            success: true,
            hospital
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getMyHospital = async (req, res) => {
    try {
        const hospital = await Hospital.findOne({
            userId: req.user._id
        });

        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: "Hospital profile not found"
            });
        }

        res.status(200).json({
            success: true,
            hospital
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const updateHospital = async (req, res) => {
    try {
        const hospital = await Hospital.findOneAndUpdate(
            { userId: req.user._id },
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: "Hospital profile not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Hospital Updated Successfully",
            hospital
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    addHospital,
    getHospitals,
    getHospitalById,
    getMyHospital,
    updateHospital
};