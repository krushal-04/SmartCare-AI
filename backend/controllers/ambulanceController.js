const Ambulance = require("../models/Ambulance");
const Hospital = require("../models/Hospital");
const EmergencyRequest = require("../models/EmergencyRequest");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const bcrypt = require("bcrypt");

const getRequestHospital = async (user) => {
    let hospital = await Hospital.findOne({ userId: user._id });
    if (!hospital) hospital = await Hospital.findOne({ hospitalEmail: user.email });
    return hospital;
};

// Get ambulances. Hospital users can view only their own fleet; admins can monitor all fleets.
// Query params: status, availability, hospitalId, search, capability
const getAmbulances = async (req, res) => {
    try {
        if (!['admin', 'hospital'].includes(req.user?.role)) {
            return res.status(403).json({ success: false, message: "Fleet monitoring is available only to hospitals and administrators." });
        }
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

        if (req.user?.role === "hospital") {
            const hospital = await getRequestHospital(req.user);
            if (!hospital) {
                return res.status(404).json({ success: false, message: "Hospital profile not found." });
            }
            query.hospitalId = hospital._id;
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

        const isAdmin = req.user.role === "admin";
        const isAssignedDriver = req.user.role === "driver" && String(ambulance.driverId?._id || ambulance.driverId) === String(req.user._id);
        let isOwningHospital = false;
        if (req.user.role === "hospital") {
            const hospital = await getRequestHospital(req.user);
            isOwningHospital = Boolean(hospital && String(ambulance.hospitalId?._id || ambulance.hospitalId) === String(hospital._id));
        }
        if (!isAdmin && !isAssignedDriver && !isOwningHospital) {
            return res.status(403).json({ success: false, message: "You do not have access to this ambulance." });
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

// Create new ambulance (Hospital owned only)
const createAmbulance = async (req, res) => {
    try {
        if (req.user.role !== "hospital") {
            return res.status(403).json({ success: false, message: "Ambulances can only be registered by their hospital." });
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
            latitude,
            longitude,
            address,
        } = req.body;

        if (!ambulanceNumber?.trim() || !driverId) {
            return res.status(400).json({
                success: false,
                message: "Ambulance number and an assigned hospital driver are required.",
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

        const hospital = await getRequestHospital(req.user);
        if (!hospital) {
            return res.status(404).json({ success: false, message: "Hospital profile not found." });
        }
        const assignedHospitalId = hospital._id;
        const assignedDriver = await User.findOne({ _id: driverId, role: "driver", hospitalId: assignedHospitalId });
        if (!assignedDriver) {
            return res.status(400).json({ success: false, message: "Select a driver registered by this hospital." });
        }
        if (assignedDriver.assignedAmbulanceId) {
            return res.status(409).json({ success: false, message: "This driver is already linked to another ambulance." });
        }

        // Capability parsing: ensure array
        let caps = ["BASIC"];
        if (Array.isArray(capability) && capability.length > 0) {
            caps = capability;
        } else if (typeof capability === "string" && capability) {
            caps = [capability];
        }

        const ambulance = await Ambulance.create({
            ambulanceNumber: cleanNumber,
            vehicleRegNumber: vehicleRegNumber?.trim().toUpperCase() || cleanNumber,
            vehicleType: vehicleType || "Basic Life Support (BLS)",
            capability: caps,
            driverName: assignedDriver.fullName,
            driverPhone: assignedDriver.phone,
            driverId: assignedDriver._id,
            hospitalId: assignedHospitalId || undefined,
            status: "Offline",
            availabilityStatus: "OFF_DUTY",
            availability: false,
            currentLocation: {
                latitude: latitude ? Number(latitude) : undefined,
                longitude: longitude ? Number(longitude) : undefined,
                address: address?.trim() || "",
                updatedAt: new Date(),
            },
        });

        // Link driver if specified
        await User.findByIdAndUpdate(assignedDriver._id, {
            $set: { assignedAmbulanceId: ambulance._id, hospitalId: assignedHospitalId, role: "driver" },
        });

        // Audit Log
        await AuditLog.create({
            userId: req.user._id,
            userName: req.user.fullName,
            userRole: req.user.role,
            action: "Ambulance Created",
            details: `Created ambulance ${cleanNumber} (${assignedDriver.fullName})`,
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

// Update ambulance details or operational status. Hospitals may update only their own fleet.
const updateAmbulance = async (req, res) => {
    try {
        const ambulance = await Ambulance.findById(req.params.id);
        if (!ambulance) {
            return res.status(404).json({
                success: false,
                message: "Ambulance not found.",
            });
        }

        if (req.user.role !== "hospital") {
            return res.status(403).json({ success: false, message: "Only the owning hospital can update an ambulance." });
        }
        const ownerHospital = await getRequestHospital(req.user);
        if (!ownerHospital || String(ambulance.hospitalId) !== String(ownerHospital._id)) {
            return res.status(403).json({ success: false, message: "You can update only your hospital fleet." });
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
        if (driverId !== undefined) {
            if (!driverId) return res.status(400).json({ success: false, message: "An ambulance must remain linked to a hospital driver." });
            if (String(ambulance.driverId || "") !== String(driverId)) {
                const driver = await User.findOne({ _id: driverId, role: "driver", hospitalId: ownerHospital._id });
                if (!driver) return res.status(400).json({ success: false, message: "Select a driver registered by this hospital." });
                if (driver.assignedAmbulanceId) return res.status(409).json({ success: false, message: "This driver is already linked to another ambulance." });
                const formerDriverId = ambulance.driverId;
                ambulance.driverId = driverId;
                ambulance.driverName = driver.fullName;
                ambulance.driverPhone = driver.phone;
                await User.findByIdAndUpdate(driverId, {
                    $set: { assignedAmbulanceId: ambulance._id, role: "driver" },
                });
                if (formerDriverId) await User.findByIdAndUpdate(formerDriverId, { $unset: { assignedAmbulanceId: 1 } });
            }
        }
        // Fleet ownership is fixed to the hospital that registered the vehicle.
        if (req.body.status !== undefined || req.body.availability !== undefined) {
            return res.status(403).json({ success: false, message: "Duty availability is controlled by the assigned driver, not the hospital." });
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

// Delete ambulance (owning hospital only)
const deleteAmbulance = async (req, res) => {
    try {
        const ambulance = await Ambulance.findById(req.params.id);
        if (!ambulance) {
            return res.status(404).json({
                success: false,
                message: "Ambulance not found.",
            });
        }

        if (req.user.role !== "hospital") {
            return res.status(403).json({ success: false, message: "Only the owning hospital can remove an ambulance." });
        }
        const ownerHospital = await getRequestHospital(req.user);
        if (!ownerHospital || String(ambulance.hospitalId) !== String(ownerHospital._id)) {
            return res.status(403).json({ success: false, message: "You can remove only your hospital fleet." });
        }

        if (ambulance.status === "Assigned" || ambulance.status === "On The Way" || ambulance.status === "Busy") {
            return res.status(400).json({
                success: false,
                message: "Cannot delete an ambulance that is currently assigned or active on an emergency.",
            });
        }

        await ambulance.deleteOne();
        if (ambulance.driverId) await User.findByIdAndUpdate(ambulance.driverId, { $unset: { assignedAmbulanceId: 1 } });

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

// Hospital safety control: block a vehicle from duty and dispatch, or restore it.
const setAmbulanceRestriction = async (req, res) => {
    try {
        if (req.user.role !== "hospital") {
            return res.status(403).json({ success: false, message: "Only the owning hospital can restrict an ambulance." });
        }

        const { restricted, reason } = req.body;
        if (typeof restricted !== "boolean") {
            return res.status(400).json({ success: false, message: "Specify whether the ambulance should be restricted or restored." });
        }
        if (restricted && !reason?.trim()) {
            return res.status(400).json({ success: false, message: "A restriction reason is required." });
        }

        const hospital = await getRequestHospital(req.user);
        const ambulance = await Ambulance.findOne({ _id: req.params.id, hospitalId: hospital?._id });
        if (!ambulance) {
            return res.status(404).json({ success: false, message: "Ambulance not found in your hospital fleet." });
        }
        if (restricted && ambulance.assignedEmergencyId) {
            return res.status(409).json({ success: false, message: "This ambulance has an active emergency. Use the emergency issue workflow before restricting it." });
        }

        ambulance.isRestricted = restricted;
        ambulance.restrictionReason = restricted ? reason.trim() : undefined;
        ambulance.restrictedAt = restricted ? new Date() : undefined;
        ambulance.restrictedBy = restricted ? req.user._id : undefined;

        if (restricted) {
            ambulance.status = "Offline";
            ambulance.availabilityStatus = "RESTRICTED";
            ambulance.availability = false;
        } else {
            // Restoring does not make the vehicle available. The driver must start duty again.
            ambulance.status = "Offline";
            ambulance.availabilityStatus = "OFF_DUTY";
            ambulance.availability = false;
        }

        await ambulance.save();
        await AuditLog.create({
            userId: req.user._id,
            userName: req.user.fullName,
            userRole: req.user.role,
            action: restricted ? "Ambulance Restricted" : "Ambulance Restriction Removed",
            details: restricted ? `${ambulance.ambulanceNumber}: ${reason.trim()}` : `${ambulance.ambulanceNumber} restored to off-duty state.`,
            targetId: ambulance._id,
            targetType: "Ambulance",
        }).catch(() => {});

        res.status(200).json({
            success: true,
            message: restricted ? "Ambulance restricted. It cannot be dispatched until restored." : "Ambulance restored. The driver must start duty before it can be dispatched.",
            ambulance,
        });
    } catch (error) {
        console.error("setAmbulanceRestriction error:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to update ambulance restriction." });
    }
};

// Hospital-managed driver accounts. Admin never owns driver registration.
const getHospitalDrivers = async (req, res) => {
    try {
        if (req.user.role !== "hospital") return res.status(403).json({ success: false, message: "Hospital access required." });
        const hospital = await getRequestHospital(req.user);
        if (!hospital) return res.status(404).json({ success: false, message: "Hospital profile not found." });
        const drivers = await User.find({ role: "driver", hospitalId: hospital._id })
            .select("fullName email phone dutyStatus assignedAmbulanceId isActive")
            .populate("assignedAmbulanceId", "ambulanceNumber")
            .sort({ fullName: 1 })
            .lean();
        res.status(200).json({ success: true, drivers });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to load hospital drivers." });
    }
};

const createHospitalDriver = async (req, res) => {
    try {
        if (req.user.role !== "hospital") return res.status(403).json({ success: false, message: "Hospital access required." });
        const { fullName, email, phone, password } = req.body;
        if (!fullName?.trim() || !email?.trim() || !phone?.trim() || !password) {
            return res.status(400).json({ success: false, message: "Name, email, phone, and temporary password are required." });
        }
        const cleanPhone = phone.trim().replace(/\D/g, "");
        if (cleanPhone.length !== 10) {
            return res.status(400).json({ success: false, message: "Driver phone number must be exactly 10 digits." });
        }
        const hospital = await getRequestHospital(req.user);
        if (!hospital) return res.status(404).json({ success: false, message: "Hospital profile not found." });
        const existing = await User.findOne({ $or: [{ email: email.toLowerCase().trim() }, { phone: cleanPhone }] });
        if (existing) return res.status(409).json({ success: false, message: "A user already uses this email or phone number." });
        const driver = await User.create({
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            phone: cleanPhone,
            password: await bcrypt.hash(password, 10),
            role: "driver",
            hospitalId: hospital._id,
            dutyStatus: "OFF_DUTY",
            isApproved: true,
            status: "Approved",
        });
        res.status(201).json({ success: true, message: "Driver account created. Assign this driver to an ambulance.", driver: { _id: driver._id, fullName: driver.fullName, email: driver.email, phone: driver.phone, dutyStatus: driver.dutyStatus } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Failed to create driver account." });
    }
};

module.exports = {
    getAmbulances,
    getAmbulanceById,
    createAmbulance,
    updateAmbulance,
    deleteAmbulance,
    setAmbulanceRestriction,
    getHospitalDrivers,
    createHospitalDriver,
};
