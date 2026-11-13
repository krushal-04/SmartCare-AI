const Ambulance = require("../models/Ambulance");
const Hospital = require("../models/Hospital");
const EmergencyRequest = require("../models/EmergencyRequest");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

// Get all ambulances (Public / Hospital / Admin)
// Query params: status, availability, hospitalId, search, capability, verificationStatus
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

        if (req.query.verificationStatus) {
            query.verificationStatus = req.query.verificationStatus;
        }

        if (req.query.capability) {
            query.capability = req.query.capability;
        }

        if (req.query.search) {
            const s = new RegExp(req.query.search, "i");
            query.$or = [
                { ambulanceNumber: s },
                { vehicleRegNumber: s },
                { driverName: s },
                { driverPhone: s },
            ];
        }

        const ambulances = await Ambulance.find(query)
            .populate("hospitalId", "hospitalName city hospitalPhone")
            .populate("driverId", "fullName phone dutyStatus currentLocation")
            .populate("assignedEmergencyId", "description status contactNumber address emergencyCategory")
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
            .populate("driverId", "fullName phone dutyStatus currentLocation")
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
            vehicleRegNumber,
            vehicleType,
            capability,
            driverName,
            driverPhone,
            driverId,
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
            let hospital = await Hospital.findOne({ userId: req.user._id });
            if (!hospital) hospital = await Hospital.findOne({ hospitalEmail: req.user.email });
            if (!hospital) {
                return res.status(404).json({
                    success: false,
                    message: "Hospital profile not found.",
                });
            }
            assignedHospitalId = hospital._id;
        }

        // Capability parsing: ensure array
        let caps = ["BASIC"];
        if (Array.isArray(capability) && capability.length > 0) {
            caps = capability;
        } else if (typeof capability === "string" && capability) {
            caps = [capability];
        }

        const verificationStatus = req.user.role === "admin" ? "VERIFIED" : "PENDING";

        const ambulance = await Ambulance.create({
            ambulanceNumber: cleanNumber,
            vehicleRegNumber: vehicleRegNumber?.trim().toUpperCase() || cleanNumber,
            vehicleType: vehicleType || "Basic Life Support (BLS)",
            capability: caps,
            driverName: driverName.trim(),
            driverPhone: driverPhone.trim(),
            driverId: driverId || undefined,
            hospitalId: assignedHospitalId || undefined,
            status: status || "Available",
            availabilityStatus: status ? (status === "Available" ? "AVAILABLE" : status.toUpperCase()) : "AVAILABLE",
            verificationStatus,
            availability: status ? status === "Available" : true,
            currentLocation: {
                latitude: latitude ? Number(latitude) : undefined,
                longitude: longitude ? Number(longitude) : undefined,
                address: address?.trim() || "",
                updatedAt: new Date(),
            },
        });

        // Link driver if specified
        if (driverId) {
            await User.findByIdAndUpdate(driverId, {
                $set: {
                    assignedAmbulanceId: ambulance._id,
                    hospitalId: assignedHospitalId,
                    role: "driver",
                },
            });
        }

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
            vehicleRegNumber,
            vehicleType,
            capability,
            driverName,
            driverPhone,
            driverId,
            hospitalId,
            status,
            availability,
            verificationStatus,
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

        if (vehicleRegNumber) ambulance.vehicleRegNumber = vehicleRegNumber.trim().toUpperCase();
        if (vehicleType) ambulance.vehicleType = vehicleType;
        if (capability) {
            ambulance.capability = Array.isArray(capability) ? capability : [capability];
        }
        if (driverName) ambulance.driverName = driverName.trim();
        if (driverPhone) ambulance.driverPhone = driverPhone.trim();
        if (driverId !== undefined) {
            ambulance.driverId = driverId || null;
            if (driverId) {
                await User.findByIdAndUpdate(driverId, {
                    $set: { assignedAmbulanceId: ambulance._id, role: "driver" },
                });
            }
        }
        if (hospitalId !== undefined) ambulance.hospitalId = hospitalId || null;

        if (verificationStatus && req.user.role === "admin") {
            ambulance.verificationStatus = verificationStatus;
        }

        const isBeingMarkedAvailable = status === "Available" || availability === true;
        if (isBeingMarkedAvailable && ambulance.assignedEmergencyId) {
            const linkedEmergency = await EmergencyRequest.findById(ambulance.assignedEmergencyId)
                .select("status")
                .lean();
            const activeStatuses = ["Requested", "Assigned", "On The Way", "Arrived", "DISPATCHED", "EN_ROUTE_TO_PATIENT", "ARRIVED_AT_PATIENT", "PATIENT_ONBOARD", "EN_ROUTE_TO_HOSPITAL"];

            if (linkedEmergency && activeStatuses.includes(linkedEmergency.status)) {
                return res.status(409).json({
                    success: false,
                    message: "This ambulance is assigned to an active emergency and cannot be marked available.",
                });
            }
            ambulance.assignedEmergencyId = null;
        }

        if (status) {
            ambulance.status = status;
            ambulance.availabilityStatus = status === "Available" ? "AVAILABLE" : status.toUpperCase();
            ambulance.availability = status === "Available";
        } else if (availability !== undefined) {
            ambulance.availability = Boolean(availability);
            if (!ambulance.availability && ambulance.status === "Available") {
                ambulance.status = "Offline";
                ambulance.availabilityStatus = "OFFLINE";
            } else if (ambulance.availability && ambulance.status === "Offline") {
                ambulance.status = "Available";
                ambulance.availabilityStatus = "AVAILABLE";
            }
        }

        if (latitude !== undefined || longitude !== undefined || address !== undefined) {
            ambulance.currentLocation = {
                latitude: latitude !== undefined ? Number(latitude) : ambulance.currentLocation?.latitude,
                longitude: longitude !== undefined ? Number(longitude) : ambulance.currentLocation?.longitude,
                address: address !== undefined ? address.trim() : ambulance.currentLocation?.address,
                updatedAt: new Date(),
            };
        }

        await ambulance.save();

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

// Admin: Verify / Suspend ambulance
const verifyAmbulance = async (req, res) => {
    try {
        const { verificationStatus } = req.body;
        const validStatuses = ["PENDING", "VERIFIED", "SUSPENDED"];
        const status = validStatuses.includes(verificationStatus) ? verificationStatus : "VERIFIED";

        const ambulance = await Ambulance.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    verificationStatus: status,
                    availabilityStatus: status === "VERIFIED" ? "AVAILABLE" : "OFFLINE",
                },
            },
            { new: true }
        ).populate("hospitalId", "hospitalName");

        if (!ambulance) {
            return res.status(404).json({ success: false, message: "Ambulance not found." });
        }

        await AuditLog.create({
            userId: req.user._id,
            userName: req.user.fullName,
            userRole: "admin",
            action: "Ambulance Verified",
            details: `Ambulance ${ambulance.ambulanceNumber} verification status set to ${status}`,
            targetId: ambulance._id,
            targetType: "Ambulance",
        }).catch(() => {});

        res.status(200).json({
            success: true,
            message: `Ambulance verification status updated to ${status}.`,
            ambulance,
        });
    } catch (error) {
        console.error("verifyAmbulance error:", error);
        res.status(500).json({ success: false, message: "Failed to verify ambulance." });
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
    verifyAmbulance,
    deleteAmbulance,
};
