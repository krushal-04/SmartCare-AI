const Department = require("../models/Department");
const Hospital = require("../models/Hospital");

const addDepartment = async (req, res) => {
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

        const department = await Department.create({
            hospitalId: hospital._id,
            departmentName: req.body.departmentName,
            description: req.body.description,
            departmentImage: req.body.departmentImage
        });

        res.status(201).json({
            success: true,
            message: "Department Added Successfully",
            department
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const getDepartments = async (req, res) => {
    try {

        const departments = await Department.find()
            .populate("hospitalId", "hospitalName city");

        res.status(200).json({
            success: true,
            departments
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const getHospitalDepartments = async (req, res) => {
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

        const departments = await Department.find({
            hospitalId: hospital._id
        });

        res.status(200).json({
            success: true,
            departments
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const getDepartmentById = async (req, res) => {
    try {

        const department = await Department.findById(req.params.id)
            .populate("hospitalId", "hospitalName city");

        if (!department) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        res.status(200).json({
            success: true,
            department
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const updateDepartment = async (req, res) => {
    try {

        const department = await Department.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!department) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Department Updated Successfully",
            department
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const deleteDepartment = async (req, res) => {
    try {

        const department = await Department.findByIdAndDelete(
            req.params.id
        );

        if (!department) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Department Deleted Successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

module.exports = {
    addDepartment,
    getDepartments,
    getHospitalDepartments,
    getDepartmentById,
    updateDepartment,
    deleteDepartment
};