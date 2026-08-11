const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");

const addDoctor = async (req, res) => {
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

        const doctor = await Doctor.create({
            hospitalId: hospital._id,
            departmentId: req.body.departmentId,
            doctorName: req.body.doctorName,
            email: req.body.email,
            phone: req.body.phone,
            qualification: req.body.qualification,
            specialization: req.body.specialization,
            experience: req.body.experience,
            consultationFee: req.body.consultationFee,
            gender: req.body.gender,
            languages: req.body.languages,
            doctorImage: req.body.doctorImage
        });

        res.status(201).json({
            success: true,
            message: "Doctor Added Successfully",
            doctor
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const getDoctors = async (req, res) => {
    try {

        const doctors = await Doctor.find()
            .populate("hospitalId", "hospitalName city")
            .populate("departmentId", "departmentName");

        res.status(200).json({
            success: true,
            doctors
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const getHospitalDoctors = async (req, res) => {
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

        const doctors = await Doctor.find({
            hospitalId: hospital._id
        }).populate("departmentId", "departmentName");

        res.status(200).json({
            success: true,
            doctors
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const getDoctorById = async (req, res) => {
    try {

        const doctor = await Doctor.findById(req.params.id)
            .populate("hospitalId", "hospitalName city")
            .populate("departmentId", "departmentName");

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        res.status(200).json({
            success: true,
            doctor
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const updateDoctor = async (req, res) => {
    try {

        const doctor = await Doctor.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Doctor Updated Successfully",
            doctor
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const deleteDoctor = async (req, res) => {
    try {

        const doctor = await Doctor.findByIdAndDelete(req.params.id);

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Doctor Deleted Successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

module.exports = {
    addDoctor,
    getDoctors,
    getHospitalDoctors,
    getDoctorById,
    updateDoctor,
    deleteDoctor
};