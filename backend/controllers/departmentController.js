const Department = require("../models/Department");
const Hospital = require("../models/Hospital");
const Doctor = require("../models/Doctor");

// Add Department (Hospital or Admin)
const addDepartment = async (req, res) => {
    try {
        let hospitalId = req.body.hospitalId;

        if (req.user.role === "hospital") {
            const hospital = await Hospital.findOne({ userId: req.user._id });
            if (!hospital) {
                return res.status(404).json({
                    success: false,
                    message: "Hospital profile not found.",
                });
            }
            hospitalId = hospital._id;
        } else if (req.user.role === "admin") {
            if (!hospitalId) {
                return res.status(400).json({
                    success: false,
                    message: "Please specify hospitalId for the department.",
                });
            }
        }

        if (!req.body.departmentName?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Department name is required.",
            });
        }

        const departmentImage = req.file
            ? (req.file.path || req.file.secure_url)
            : (req.body.departmentImage?.trim() || "");

        const department = await Department.create({
            hospitalId,
            departmentName: req.body.departmentName.trim(),
            description: req.body.description?.trim() || "",
            departmentImage,
        });

        res.status(201).json({
            success: true,
            message: "Department added successfully.",
            department,
        });
    } catch (error) {
        console.error("addDepartment error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to add department.",
        });
    }
};

// Get all departments (Public/Admin, with optional hospitalId filter)
const getDepartments = async (req, res) => {
    try {
        const query = {};
        if (req.query.hospitalId) {
            query.hospitalId = req.query.hospitalId;
        }

        const departments = await Department.find(query)
            .populate("hospitalId", "hospitalName city state")
            .lean();

        // Attach doctor count to each department
        const deptWithCounts = await Promise.all(
            departments.map(async (dept) => {
                const doctorCount = await Doctor.countDocuments({ departmentId: dept._id });
                return { ...dept, doctorCount };
            })
        );

        res.status(200).json({
            success: true,
            departments: deptWithCounts,
        });
    } catch (error) {
        console.error("getDepartments error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch departments.",
        });
    }
};

// Get departments for the logged-in hospital
const getHospitalDepartments = async (req, res) => {
    try {
        const hospital = await Hospital.findOne({ userId: req.user._id });
        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: "Hospital profile not found.",
            });
        }

        const departments = await Department.find({ hospitalId: hospital._id }).lean();

        const deptWithCounts = await Promise.all(
            departments.map(async (dept) => {
                const doctorCount = await Doctor.countDocuments({ departmentId: dept._id });
                return { ...dept, doctorCount };
            })
        );

        res.status(200).json({
            success: true,
            departments: deptWithCounts,
        });
    } catch (error) {
        console.error("getHospitalDepartments error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch hospital departments.",
        });
    }
};

// Get department by ID
const getDepartmentById = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id)
            .populate("hospitalId", "hospitalName city state")
            .lean();

        if (!department) {
            return res.status(404).json({
                success: false,
                message: "Department not found.",
            });
        }

        const doctorCount = await Doctor.countDocuments({ departmentId: department._id });

        res.status(200).json({
            success: true,
            department: { ...department, doctorCount },
        });
    } catch (error) {
        console.error("getDepartmentById error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch department.",
        });
    }
};

// Update Department with strict ownership check
const updateDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: "Department not found.",
            });
        }

        // Security check: hospital can only edit its own department
        if (req.user.role === "hospital") {
            const hospital = await Hospital.findOne({ userId: req.user._id });
            if (!hospital || String(department.hospitalId) !== String(hospital._id)) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized: You can only edit departments belonging to your hospital.",
                });
            }
        }

        if (req.body.departmentName) department.departmentName = req.body.departmentName.trim();
        if (req.body.description !== undefined) department.description = req.body.description.trim();
        if (req.file) {
            department.departmentImage = req.file.path || req.file.secure_url;
        } else if (req.body.departmentImage !== undefined) {
            department.departmentImage = req.body.departmentImage.trim();
        }

        await department.save();

        res.status(200).json({
            success: true,
            message: "Department updated successfully.",
            department,
        });
    } catch (error) {
        console.error("updateDepartment error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update department.",
        });
    }
};

// Delete Department with strict ownership check
const deleteDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: "Department not found.",
            });
        }

        // Security check: hospital can only delete its own department
        if (req.user.role === "hospital") {
            const hospital = await Hospital.findOne({ userId: req.user._id });
            if (!hospital || String(department.hospitalId) !== String(hospital._id)) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized: You can only delete departments belonging to your hospital.",
                });
            }
        }

        const doctorsCount = await Doctor.countDocuments({ departmentId: department._id });
        if (doctorsCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete department: ${doctorsCount} doctor(s) are currently assigned to this department. Please reassign them first.`,
            });
        }

        await department.deleteOne();

        res.status(200).json({
            success: true,
            message: "Department deleted successfully.",
        });
    } catch (error) {
        console.error("deleteDepartment error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete department.",
        });
    }
};

module.exports = {
    addDepartment,
    getDepartments,
    getHospitalDepartments,
    getDepartmentById,
    updateDepartment,
    deleteDepartment,
};