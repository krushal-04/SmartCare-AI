const EmergencyRequest = require("../models/EmergencyRequest");
const Hospital = require("../models/Hospital");
const Notification = require("../models/Notification");
const Ambulance = require("../models/Ambulance");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const emailService = require("../services/emailService");

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Patient: Submit emergency request
exports.requestEmergency = async (req, res) => {
    try {
        const {
            hospitalId,
            latitude,
            longitude,
            address,
            description,
            contactNumber,
        } = req.body;

        if (!description?.trim() || !contactNumber?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Emergency description and contact number are required.",
            });
        }

        let cleanPhone = contactNumber.trim().replace(/\D/g, "");
        if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) {
            cleanPhone = cleanPhone.slice(2);
        } else if (cleanPhone.length === 11 && cleanPhone.startsWith("0")) {
            cleanPhone = cleanPhone.slice(1);
        }

        if (cleanPhone.length !== 10) {
            return res.status(400).json({
                success: false,
                message: "A valid 10-digit contact mobile number is required.",
            });
        }
        if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
            return res.status(400).json({
                success: false,
                message: "Contact number must be a valid 10-digit mobile number starting with 6, 7, 8, or 9.",
            });
        }

        let selectedHospital = null;

        if (hospitalId) {
            selectedHospital = await Hospital.findOne({
                _id: hospitalId,
                emergencyAvailable: true,
            });
        }

        if (!selectedHospital && latitude != null && longitude != null) {
            const hospitals = await Hospital.find({
                emergencyAvailable: true,
                latitude: { $ne: null },
                longitude: { $ne: null },
            });

            let nearest = null;
            let shortestDistance = Number.POSITIVE_INFINITY;

            for (const hospital of hospitals) {
                const distance = calculateDistance(
                    Number(latitude),
                    Number(longitude),
                    Number(hospital.latitude),
                    Number(hospital.longitude)
                );

                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearest = hospital;
                }
            }

            selectedHospital = nearest;
        }

        // Fallback: any emergency hospital
        if (!selectedHospital) {
            selectedHospital = await Hospital.findOne({ emergencyAvailable: true });
        }

        if (!selectedHospital) {
            return res.status(404).json({
                success: false,
                message: "No emergency-enabled hospital is currently active in the system.",
            });
        }

        const request = await EmergencyRequest.create({
            patientId: req.user._id,
            hospitalId: selectedHospital._id,
            latitude: latitude != null ? Number(latitude) : undefined,
            longitude: longitude != null ? Number(longitude) : undefined,
            address: address?.trim() || "",
            description: description.trim(),
            contactNumber: cleanPhone,
            status: "Requested",
        });

        // In-app Notification for patient
        await Notification.create({
            userId: req.user._id,
            title: "Emergency Request Submitted",
            message: `Your emergency request has been sent to ${selectedHospital.hospitalName}. Help is being mobilized.`,
            type: "Emergency",
            relatedId: request._id,
        });

        // In-app Notification for hospital
        if (selectedHospital.userId) {
            await Notification.create({
                userId: selectedHospital.userId,
                title: "URGENT: Emergency Request Received",
                message: `Patient ${req.user.fullName || "User"} requested immediate emergency care: "${description.trim().slice(0, 80)}"`,
                type: "Emergency",
                relatedId: request._id,
            });
        }

        // In-app Notification for Admins
        try {
            const admins = await User.find({ role: "admin" }).select("_id");
            for (const admin of admins) {
                await Notification.create({
                    userId: admin._id,
                    title: "URGENT: Emergency Request Created",
                    message: `Patient ${req.user.fullName || "User"} requested emergency care at ${selectedHospital.hospitalName}: "${description.trim().slice(0, 60)}"`,
                    type: "Emergency",
                    relatedId: request._id,
                });
            }
        } catch (adminNotifErr) {
            console.error("Admin emergency notification error:", adminNotifErr.message);
        }

        // Send Email Alert to hospital
        emailService.sendEmergencyAlertEmail(request, selectedHospital, req.user).catch((e) =>
            console.error("Emergency alert email error:", e.message)
        );

        await request.populate(
            "hospitalId",
            "hospitalName city address hospitalPhone latitude longitude"
        );

        res.status(201).json({
            success: true,
            message: "Emergency request submitted successfully.",
            request,
        });
    } catch (error) {
        console.error("requestEmergency:", error);
        res.status(500).json({
            success: false,
            message: "Unable to submit emergency request.",
        });
    }
};

// Patient: Get own emergency requests
exports.getMyEmergencyRequests = async (req, res) => {
    try {
        const requests = await EmergencyRequest.find({
            patientId: req.user._id,
        })
            .sort({ createdAt: -1 })
            .populate("hospitalId", "hospitalName city address hospitalPhone")
            .populate("ambulanceId", "ambulanceNumber vehicleType driverName driverPhone status")
            .lean();

        res.status(200).json({
            success: true,
            requests,
        });
    } catch (error) {
        console.error("getMyEmergencyRequests:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load emergency requests.",
        });
    }
};

// Patient: Cancel emergency
exports.cancelEmergency = async (req, res) => {
    try {
        const request = await EmergencyRequest.findOne({
            _id: req.params.id,
            patientId: req.user._id,
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Emergency request not found.",
            });
        }

        if (!["Requested", "Assigned"].includes(request.status)) {
            return res.status(400).json({
                success: false,
                message: "This emergency request is already dispatched or completed and cannot be cancelled now.",
            });
        }

        request.status = "Cancelled";
        await request.save();

        // Release ambulance if one was assigned
        if (request.ambulanceId) {
            await Ambulance.findByIdAndUpdate(request.ambulanceId, {
                status: "Available",
                availability: true,
                assignedEmergencyId: null,
            });
        }

        res.status(200).json({
            success: true,
            message: "Emergency request cancelled.",
        });
    } catch (error) {
        console.error("cancelEmergency:", error);
        res.status(500).json({
            success: false,
            message: "Unable to cancel emergency request.",
        });
    }
};

// Hospital: View incoming emergencies
exports.getHospitalEmergencies = async (req, res) => {
    try {
        let hospital = await Hospital.findOne({ userId: req.user._id });
        if (!hospital) {
            hospital = await Hospital.findOne({ hospitalEmail: req.user.email });
        }
        if (!hospital) {
            return res.status(200).json({
                success: true,
                emergencies: [],
            });
        }

        const emergencies = await EmergencyRequest.find({ hospitalId: hospital._id })
            .populate("patientId", "fullName email phone")
            .populate("ambulanceId", "ambulanceNumber vehicleType driverName driverPhone status")
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            emergencies,
        });
    } catch (error) {
        console.error("getHospitalEmergencies:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load hospital emergencies.",
        });
    }
};

// Hospital / Admin: Update emergency status & assign ambulance
exports.updateHospitalEmergencyStatus = async (req, res) => {
    try {
        const { status, ambulanceId, hospitalNotes } = req.body;

        const emergency = await EmergencyRequest.findById(req.params.id)
            .populate("patientId", "fullName email phone")
            .populate("hospitalId", "hospitalName userId");

        if (!emergency) {
            return res.status(404).json({
                success: false,
                message: "Emergency request not found.",
            });
        }

        // Ownership check: If caller is a hospital, verify it owns this emergency
        if (req.user.role === "hospital") {
            let hospital = await Hospital.findOne({ userId: req.user._id });
            if (!hospital) {
                hospital = await Hospital.findOne({ hospitalEmail: req.user.email });
            }
            if (!hospital || String(emergency.hospitalId._id) !== String(hospital._id)) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized: This emergency is not assigned to your hospital.",
                });
            }
        }

        const validStatuses = ["Requested", "Assigned", "On The Way", "Arrived", "Completed", "Cancelled"];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Valid options are: ${validStatuses.join(", ")}`,
            });
        }

        const oldStatus = emergency.status;
        if (status) emergency.status = status;
        if (hospitalNotes !== undefined) emergency.hospitalNotes = hospitalNotes.trim();

        let assignedAmbulance = null;

        // Assigning ambulance
        if (ambulanceId) {
            const ambulance = await Ambulance.findById(ambulanceId);
            if (!ambulance) {
                return res.status(404).json({
                    success: false,
                    message: "Selected ambulance not found.",
                });
            }

            emergency.ambulanceId = ambulance._id;
            if (status === "Requested" || !status) {
                emergency.status = "Assigned";
            }

            ambulance.status = emergency.status === "On The Way" ? "Busy" : "Assigned";
            ambulance.availability = false;
            ambulance.assignedEmergencyId = emergency._id;
            await ambulance.save();
            assignedAmbulance = ambulance;
        } else if (emergency.ambulanceId) {
            // Existing ambulance status transition
            const amb = await Ambulance.findById(emergency.ambulanceId);
            if (amb) {
                if (emergency.status === "On The Way" || emergency.status === "Arrived") {
                    amb.status = "Busy";
                    amb.availability = false;
                    await amb.save();
                } else if (emergency.status === "Completed" || emergency.status === "Cancelled") {
                    amb.status = "Available";
                    amb.availability = true;
                    amb.assignedEmergencyId = null;
                    await amb.save();
                }
                assignedAmbulance = amb;
            }
        }

        await emergency.save();
        await emergency.populate("ambulanceId", "ambulanceNumber vehicleType driverName driverPhone status");

        // Notify patient of status change
        if (emergency.patientId?._id) {
            await Notification.create({
                userId: emergency.patientId._id,
                title: `Emergency Update: ${emergency.status}`,
                message: `Your emergency status is now: ${emergency.status}.${
                    assignedAmbulance
                        ? ` Ambulance ${assignedAmbulance.ambulanceNumber} (${assignedAmbulance.driverName}, ${assignedAmbulance.driverPhone}) has been assigned.`
                        : ""
                }`,
                type: "Emergency",
                relatedId: emergency._id,
            });

            // Send Email update to patient
            emailService.sendEmergencyStatusEmail(emergency, emergency.patientId, emergency.status, assignedAmbulance).catch(() => {});
        }

        // Audit Log
        await AuditLog.create({
            userId: req.user._id,
            userName: req.user.fullName,
            userRole: req.user.role,
            action: "Emergency Status Updated",
            details: `Emergency ${emergency._id} status changed from ${oldStatus} to ${emergency.status}`,
            targetId: emergency._id,
            targetType: "Emergency",
        }).catch(() => {});

        res.status(200).json({
            success: true,
            message: `Emergency status updated to ${emergency.status}.`,
            emergency,
        });
    } catch (error) {
        console.error("updateHospitalEmergencyStatus error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update emergency status.",
        });
    }
};

// Admin: Get all emergency requests
exports.getAllEmergencies = async (req, res) => {
    try {
        const query = {};
        if (req.query.status) query.status = req.query.status;
        if (req.query.hospitalId) query.hospitalId = req.query.hospitalId;

        const emergencies = await EmergencyRequest.find(query)
            .populate("patientId", "fullName email phone")
            .populate("hospitalId", "hospitalName city hospitalPhone")
            .populate("ambulanceId", "ambulanceNumber vehicleType driverName driverPhone status")
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            emergencies,
        });
    } catch (error) {
        console.error("getAllEmergencies error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load emergency list.",
        });
    }
};

// Admin: Reassign hospital or ambulance, override status
exports.adminUpdateEmergency = async (req, res) => {
    try {
        const { hospitalId, ambulanceId, status, hospitalNotes } = req.body;

        const emergency = await EmergencyRequest.findById(req.params.id)
            .populate("patientId", "fullName email phone");

        if (!emergency) {
            return res.status(404).json({
                success: false,
                message: "Emergency request not found.",
            });
        }

        if (hospitalId) emergency.hospitalId = hospitalId;
        if (status) emergency.status = status;
        if (hospitalNotes !== undefined) emergency.hospitalNotes = hospitalNotes.trim();

        if (ambulanceId) {
            const amb = await Ambulance.findById(ambulanceId);
            if (amb) {
                emergency.ambulanceId = amb._id;
                amb.status = emergency.status === "On The Way" ? "Busy" : "Assigned";
                amb.availability = false;
                amb.assignedEmergencyId = emergency._id;
                await amb.save();
            }
        }

        await emergency.save();
        await emergency.populate("hospitalId", "hospitalName city");
        await emergency.populate("ambulanceId", "ambulanceNumber driverName driverPhone");

        // Audit Log
        await AuditLog.create({
            userId: req.user._id,
            userName: req.user.fullName,
            userRole: "admin",
            action: "Admin Emergency Reassigned",
            details: `Admin updated emergency ${emergency._id}`,
            targetId: emergency._id,
            targetType: "Emergency",
        }).catch(() => {});

        res.status(200).json({
            success: true,
            message: "Emergency request updated successfully.",
            emergency,
        });
    } catch (error) {
        console.error("adminUpdateEmergency error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update emergency.",
        });
    }
};