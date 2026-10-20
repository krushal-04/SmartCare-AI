const Ambulance = require("../models/Ambulance");
const Hospital = require("../models/Hospital");
const EmergencyRequest = require("../models/EmergencyRequest");
const AuditLog = require("../models/AuditLog");

// Get all ambulances (Public / Hospital / Admin)
// Query params: status, availability, hospitalId, search
const getAmbulances = async (req, res) => {
    try {
        const query = {};

        if (req.query.status) {
            query.status = req.query.status;
        }

        if (req.query.availability !== undefined) {
            query.availability = req.query.availability === "true";
        }

        if (req.query.hospitalId) {
            query.hospitalId = req.query.hospitalId;
        }

        if (req.query.search) {
            const s = new RegExp(req.query.search, "i");
            query.$or = [
                { ambulanceNumber: s },
                { driverName: s },
                { driverPhone: s },
            ];
        }

        const ambulances = await Ambulance.find(query)
            .populate("hospitalId", "hospitalName city hospitalPhone")
            .populate("assignedEmergencyId", "description status contactNumber address")
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            ambulances,
        });
    } catch (error) {
        console.error("getAmbulances error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch ambulances.",
        });
    }
};

// Get single ambulance by ID
const getAmbulanceById = async (req, res) => {
    try {
        const ambulance = await Ambulance.findById(req.params.id)
            .populate("hospitalId", "hospitalName city address hospitalPhone")
            .populate("assignedEmergencyId")
            .lean();

        if (!ambulance) {
            return res.status(404).json({
                success: false,
                message: "Ambulance not found.",
            });
        }

        res.status(200).json({
            success: true,
            ambulance,
        });
    } catch (error) {
        console.error("getAmbulanceById error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch ambulance.",
        });
    }
};

// Create new ambulance (Admin or Hospital)
const createAmbulance = async (req, res) => {
    try {
        const {
            ambulanceNumber,
            vehicleType,
            driverName,
            driverPhone,
            hospitalId,
            status,
            latitude,
            longitude,
            address,
        } = req.body;

        if (!ambulanceNumber?.trim() || !driverName?.trim() || !driverPhone?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Ambulance number, driver name, and driver phone are required.",
            });
        }

        const cleanNumber = ambulanceNumber.trim().toUpperCase();

        const existing = await Ambulance.findOne({ ambulanceNumber: cleanNumber });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: "An ambulance with this registration number already exists.",
            });
        }

        let assignedHospitalId = hospitalId;
        if (req.user.role === "hospital") {
            const hospital = await Hospital.findOne({ userId: req.user._id });
            if (!hospital) {
                return res.status(404).json({
                    success: false,
                    message: "Hospital profile not found.",
                });
            }
            assignedHospitalId = hospital._id;
        }

        const ambulance = await Ambulance.create({
            ambulanceNumber: cleanNumber,
            vehicleType: vehicleType || "Basic Life Support (BLS)",
            driverName: driverName.trim(),
            driverPhone: driverPhone.trim(),
            hospitalId: assignedHospitalId || undefined,
            status: status || "Available",
            availability: status ? status === "Available" : true,
            currentLocation: {
                latitude: latitude ? Number(latitude) : undefined,
                longitude: longitude ? Number(longitude) : undefined,
                address: address?.trim() || "",
            },
        });

        // Audit Log
        await AuditLog.create({
            userId: req.user._id,
            userName: req.user.fullName,
            userRole: req.user.role,
            action: "Ambulance Created",
            details: `Created ambulance ${cleanNumber} (${driverName})`,
            targetId: ambulance._id,
            targetType: "Ambulance",
        }).catch(() => {});

        res.status(201).json({
            success: true,
            message: "Ambulance added successfully.",
            ambulance,
        });
    } catch (error) {
        console.error("createAmbulance error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create ambulance.",
        });
    }
};

// Update ambulance details or status
const updateAmbulance = async (req, res) => {
    try {
        const ambulance = await Ambulance.findById(req.params.id);
        if (!ambulance) {
            return res.status(404).json({
                success: false,
                message: "Ambulance not found.",
            });
        }

        const {
            ambulanceNumber,
            vehicleType,
            driverName,
            driverPhone,
            hospitalId,
            status,
            availability,
            latitude,
            longitude,
            address,
        } = req.body;

        if (ambulanceNumber) {
            const cleanNumber = ambulanceNumber.trim().toUpperCase();
            if (cleanNumber !== ambulance.ambulanceNumber) {
                const dup = await Ambulance.findOne({ ambulanceNumber: cleanNumber });
                if (dup) {
                    return res.status(409).json({
                        success: false,
                        message: "Another ambulance already has this vehicle number.",
                    });
                }
                ambulance.ambulanceNumber = cleanNumber;
            }
        }

        if (vehicleType) ambulance.vehicleType = vehicleType;
        if (driverName) ambulance.driverName = driverName.trim();
        if (driverPhone) ambulance.driverPhone = driverPhone.trim();
        if (hospitalId !== undefined) ambulance.hospitalId = hospitalId || null;

        if (status) {
            ambulance.status = status;
            ambulance.availability = status === "Available";
        } else if (availability !== undefined) {
            ambulance.availability = Boolean(availability);
            if (!ambulance.availability && ambulance.status === "Available") {
                ambulance.status = "Offline";
            } else if (ambulance.availability && ambulance.status === "Offline") {
                ambulance.status = "Available";
            }
        }

        if (latitude !== undefined || longitude !== undefined || address !== undefined) {
            ambulance.currentLocation = {
                latitude: latitude !== undefined ? Number(latitude) : ambulance.currentLocation?.latitude,
                longitude: longitude !== undefined ? Number(longitude) : ambulance.currentLocation?.longitude,
                address: address !== undefined ? address.trim() : ambulance.currentLocation?.address,
            };
        }

        await ambulance.save();

        // Audit Log
        await AuditLog.create({
            userId: req.user._id,
            userName: req.user.fullName,
            userRole: req.user.role,
            action: "Ambulance Updated",
            details: `Updated ambulance ${ambulance.ambulanceNumber}: status ${ambulance.status}`,
            targetId: ambulance._id,
            targetType: "Ambulance",
        }).catch(() => {});

        res.status(200).json({
            success: true,
            message: "Ambulance updated successfully.",
            ambulance,
        });
    } catch (error) {
        console.error("updateAmbulance error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update ambulance.",
        });
    }
};

// Delete ambulance (Admin only)
const deleteAmbulance = async (req, res) => {
    try {
        const ambulance = await Ambulance.findById(req.params.id);
        if (!ambulance) {
            return res.status(404).json({
                success: false,
                message: "Ambulance not found.",
            });
        }

        if (ambulance.status === "Assigned" || ambulance.status === "On The Way" || ambulance.status === "Busy") {
            return res.status(400).json({
                success: false,
                message: "Cannot delete an ambulance that is currently assigned or active on an emergency.",
            });
        }

        await ambulance.deleteOne();

        // Audit Log
        await AuditLog.create({
            userId: req.user._id,
            userName: req.user.fullName,
            userRole: req.user.role,
            action: "Ambulance Deleted",
            details: `Deleted ambulance ${ambulance.ambulanceNumber}`,
            targetId: req.params.id,
            targetType: "Ambulance",
        }).catch(() => {});

        res.status(200).json({
            success: true,
            message: "Ambulance deleted successfully.",
        });
    } catch (error) {
        console.error("deleteAmbulance error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete ambulance.",
        });
    }
};

module.exports = {
    getAmbulances,
    getAmbulanceById,
    createAmbulance,
    updateAmbulance,
    deleteAmbulance,
};
