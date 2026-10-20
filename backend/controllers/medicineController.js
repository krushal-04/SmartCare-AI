const Medicine = require("../models/Medicine");
const AuditLog = require("../models/AuditLog");

// Get all medicines (Public / Admin)
// Query params: category, search, status
const getMedicines = async (req, res) => {
    try {
        const query = {};

        if (req.query.category) {
            query.category = req.query.category;
        }

        if (req.query.status) {
            query.status = req.query.status;
        }

        if (req.query.search) {
            const s = new RegExp(req.query.search, "i");
            query.$or = [
                { medicineName: s },
                { genericName: s },
                { manufacturer: s },
                { category: s },
            ];
        }

        const medicines = await Medicine.find(query).sort({ medicineName: 1 }).lean();

        res.status(200).json({
            success: true,
            medicines,
        });
    } catch (error) {
        console.error("getMedicines error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch medicines.",
        });
    }
};

// Get single medicine by ID
const getMedicineById = async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id).lean();
        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: "Medicine not found.",
            });
        }

        res.status(200).json({
            success: true,
            medicine,
        });
    } catch (error) {
        console.error("getMedicineById error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch medicine.",
        });
    }
};

// Create new medicine (Admin only)
const createMedicine = async (req, res) => {
    try {
        const {
            medicineName,
            genericName,
            category,
            manufacturer,
            dosageForm,
            strength,
            description,
            generalInfo,
            usageInfo,
            precautions,
            sideEffects,
            status,
        } = req.body;

        if (!medicineName?.trim() || !genericName?.trim() || !manufacturer?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Medicine name, generic name, and manufacturer are required.",
            });
        }

        const medicine = await Medicine.create({
            medicineName: medicineName.trim(),
            genericName: genericName.trim(),
            category: category || "Other",
            manufacturer: manufacturer.trim(),
            dosageForm: dosageForm || "Tablet",
            strength: strength?.trim() || "",
            description: description?.trim() || "",
            generalInfo: generalInfo?.trim() || "",
            usageInfo: usageInfo?.trim() || "",
            precautions: precautions?.trim() || "",
            sideEffects: sideEffects?.trim() || "",
            status: status || "Active",
        });

        // Audit Log
        await AuditLog.create({
            userId: req.user._id,
            userName: req.user.fullName,
            userRole: "admin",
            action: "Medicine Created",
            details: `Created medicine ${medicine.medicineName} (${medicine.genericName})`,
            targetId: medicine._id,
            targetType: "Medicine",
        }).catch(() => {});

        res.status(201).json({
            success: true,
            message: "Medicine added successfully.",
            medicine,
        });
    } catch (error) {
        console.error("createMedicine error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create medicine.",
        });
    }
};

// Update medicine (Admin only)
const updateMedicine = async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);
        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: "Medicine not found.",
            });
        }

        const {
            medicineName,
            genericName,
            category,
            manufacturer,
            dosageForm,
            strength,
            description,
            generalInfo,
            usageInfo,
            precautions,
            sideEffects,
            status,
        } = req.body;

        if (medicineName) medicine.medicineName = medicineName.trim();
        if (genericName) medicine.genericName = genericName.trim();
        if (category) medicine.category = category;
        if (manufacturer) medicine.manufacturer = manufacturer.trim();
        if (dosageForm) medicine.dosageForm = dosageForm;
        if (strength !== undefined) medicine.strength = strength.trim();
        if (description !== undefined) medicine.description = description.trim();
        if (generalInfo !== undefined) medicine.generalInfo = generalInfo.trim();
        if (usageInfo !== undefined) medicine.usageInfo = usageInfo.trim();
        if (precautions !== undefined) medicine.precautions = precautions.trim();
        if (sideEffects !== undefined) medicine.sideEffects = sideEffects.trim();
        if (status) medicine.status = status;

        await medicine.save();

        // Audit Log
        await AuditLog.create({
            userId: req.user._id,
            userName: req.user.fullName,
            userRole: "admin",
            action: "Medicine Updated",
            details: `Updated medicine ${medicine.medicineName}`,
            targetId: medicine._id,
            targetType: "Medicine",
        }).catch(() => {});

        res.status(200).json({
            success: true,
            message: "Medicine updated successfully.",
            medicine,
        });
    } catch (error) {
        console.error("updateMedicine error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update medicine.",
        });
    }
};

// Delete medicine (Admin only)
const deleteMedicine = async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);
        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: "Medicine not found.",
            });
        }

        await medicine.deleteOne();

        // Audit Log
        await AuditLog.create({
            userId: req.user._id,
            userName: req.user.fullName,
            userRole: "admin",
            action: "Medicine Deleted",
            details: `Deleted medicine ${medicine.medicineName}`,
            targetId: req.params.id,
            targetType: "Medicine",
        }).catch(() => {});

        res.status(200).json({
            success: true,
            message: "Medicine deleted successfully.",
        });
    } catch (error) {
        console.error("deleteMedicine error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete medicine.",
        });
    }
};

module.exports = {
    getMedicines,
    getMedicineById,
    createMedicine,
    updateMedicine,
    deleteMedicine,
};
