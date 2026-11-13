const EmergencyRequest = require("../models/EmergencyRequest");
const Hospital = require("../models/Hospital");
const Notification = require("../models/Notification");
const Ambulance = require("../models/Ambulance");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const emailService = require("../services/emailService");
const {
    recommendHospital,
    matchAmbulanceForHospital,
    calculateDistance,
} = require("../services/emergencyMatchingService");
const {
    broadcastEmergencyEvent,
    emitToHospital,
    emitToDriver,
    emitToUser,
    emitToRole,
} = require("../services/socketService");

// Patient: Submit structured emergency request
exports.requestEmergency = async (req, res) => {
    try {
        const {
            emergencyCategory = "Other Emergency",
            consciousness = "conscious",
            breathingStatus = "normal",
            patientCount = 1,
            description,
            contactNumber,
            latitude,
            longitude,
            address,
            hospitalId,
        } = req.body;

        if (!contactNumber?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Emergency contact number is required.",
            });
        }
        const finalDescription = (description && description.trim()) || `${emergencyCategory} emergency reported.`;

        let cleanPhone = contactNumber.trim().replace(/\D/g, "");
        if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) {
            cleanPhone = cleanPhone.slice(2);
        } else if (cleanPhone.length === 11 && cleanPhone.startsWith("0")) {
            cleanPhone = cleanPhone.slice(1);
        }

        if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
            return res.status(400).json({
                success: false,
                message: "A valid 10-digit contact mobile number starting with 6, 7, 8, or 9 is required.",
            });
        }

        // Hospital Matching
        let selectedHospital = null;
        let matchResult = null;

        if (hospitalId) {
            selectedHospital = await Hospital.findById(hospitalId).lean();
        }

        if (!selectedHospital) {
            matchResult = await recommendHospital({
                emergencyCategory,
                latitude: latitude != null ? Number(latitude) : null,
                longitude: longitude != null ? Number(longitude) : null,
            });
            selectedHospital = matchResult.recommendedHospital;
        }

        const isCapable = Boolean(selectedHospital);
        const initialStatus = isCapable ? "Requested" : "NO_CAPABLE_HOSPITAL";

        const emergency = await EmergencyRequest.create({
            patientId: req.user._id,
            emergencyCategory,
            consciousness,
            breathingStatus,
            patientCount: Number(patientCount) || 1,
            hospitalId: selectedHospital?._id || undefined,
            recommendedHospitalId: selectedHospital?._id || undefined,
            assignedHospitalId: selectedHospital?._id || undefined,
            latitude: latitude != null ? Number(latitude) : undefined,
            longitude: longitude != null ? Number(longitude) : undefined,
            address: address?.trim() || "",
            description: finalDescription,
            contactNumber: cleanPhone,
            hospitalAcceptanceStatus: "PENDING",
            status: initialStatus,
            statusHistory: [
                {
                    status: initialStatus,
                    changedBy: req.user._id,
                    role: "patient",
                    changedAt: new Date(),
                    note: selectedHospital
                        ? `System matched to ${selectedHospital.hospitalName} based on ${emergencyCategory} requirements.`
                        : "No eligible emergency hospital found with open intake.",
                },
            ],
        });

        // Patient In-App Notification
        await Notification.create({
            userId: req.user._id,
            title: "Emergency Request Submitted",
            message: selectedHospital
                ? `Your ${emergencyCategory} emergency has been routed directly to ${selectedHospital.hospitalName}. Dispatch team notified.`
                : "Your emergency request was received. Platform operators have been alerted to find an available facility.",
            type: "Emergency",
            relatedId: emergency._id,
        }).catch(() => {});

        // Hospital In-App Notification
        if (selectedHospital?.userId) {
            await Notification.create({
                userId: selectedHospital.userId,
                title: `URGENT: Incoming ${emergencyCategory} Request`,
                message: `Patient ${req.user.fullName || "User"} requires immediate transfer: "${finalDescription.slice(0, 80)}"`,
                type: "Emergency",
                relatedId: emergency._id,
            }).catch(() => {});
        }

        // Notify Admins
        try {
            const admins = await User.find({ role: "admin" }).select("_id").lean();
            for (const admin of admins) {
                await Notification.create({
                    userId: admin._id,
                    title: `ALERT: New Emergency (${emergencyCategory})`,
                    message: `Patient ${req.user.fullName || "User"} requested emergency care routed to ${selectedHospital?.hospitalName || "Unassigned"}.`,
                    type: "Emergency",
                    relatedId: emergency._id,
                }).catch(() => {});
            }
        } catch (e) {
            // ignore
        }

        // Real-Time Socket.IO Broadcast
        const broadcastPayload = {
            emergencyId: emergency._id,
            emergencyCategory,
            consciousness,
            breathingStatus,
            patientCount: emergency.patientCount,
            description: emergency.description,
            contactNumber: cleanPhone,
            latitude: emergency.latitude,
            longitude: emergency.longitude,
            address: emergency.address,
            hospitalId: selectedHospital?._id,
            hospitalName: selectedHospital?.hospitalName,
            status: emergency.status,
            createdAt: emergency.createdAt,
            patient: {
                _id: req.user._id,
                fullName: req.user.fullName,
                phone: cleanPhone,
            },
        };

        if (selectedHospital?._id) {
            emitToHospital(selectedHospital._id, "emergency:created", broadcastPayload);
            emitToHospital(selectedHospital._id, "emergency:hospital-recommended", broadcastPayload);
        }

        emitToRole("admin", "emergency:created", broadcastPayload);

        // Send Email Alert to hospital asynchronously
        if (selectedHospital) {
            emailService.sendEmergencyAlertEmail(emergency, selectedHospital, req.user).catch(() => {});
        }

        await emergency.populate(
            "hospitalId",
            "hospitalName city address hospitalPhone latitude longitude emergencyCapabilities"
        );

        res.status(201).json({
            success: true,
            message: "Emergency request submitted and routed to recommended hospital.",
            request: emergency,
            emergency,
            recommendedHospital: selectedHospital,
        });
    } catch (error) {
        console.error("requestEmergency error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Unable to submit emergency request.",
        });
    }
};

// Patient / Shared: Get live emergency tracking status
exports.getEmergencyLiveStatus = async (req, res) => {
    try {
        const emergency = await EmergencyRequest.findById(req.params.id)
            .populate("patientId", "fullName phone email")
            .populate("hospitalId", "hospitalName city address hospitalPhone latitude longitude emergencyCapabilities")
            .populate("assignedHospitalId", "hospitalName city address hospitalPhone latitude longitude")
            .populate(
                "ambulanceId",
                "ambulanceNumber vehicleRegNumber vehicleType capability status availabilityStatus currentLocation driverName driverPhone"
            )
            .populate("assignedDriverId", "fullName phone dutyStatus currentLocation")
            .lean();

        if (!emergency) {
            return res.status(404).json({
                success: false,
                message: "Emergency request not found.",
            });
        }

        // Privacy check: If patient, verify ownership
        if (req.user.role === "patient" && String(emergency.patientId._id) !== String(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized to view this emergency.",
            });
        }

        // Compute distance if ambulance has live location
        let distanceToPatientKm = null;
        if (
            emergency.latitude != null &&
            emergency.longitude != null &&
            emergency.ambulanceId?.currentLocation?.latitude != null &&
            emergency.ambulanceId?.currentLocation?.longitude != null
        ) {
            distanceToPatientKm = calculateDistance(
                emergency.latitude,
                emergency.longitude,
                emergency.ambulanceId.currentLocation.latitude,
                emergency.ambulanceId.currentLocation.longitude
            );
        }

        res.status(200).json({
            success: true,
            emergency: {
                ...emergency,
                distanceToPatientKm,
            },
        });
    } catch (error) {
        console.error("getEmergencyLiveStatus error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load live emergency status.",
        });
    }
};

// Patient: Update location coordinates / pin
exports.updateEmergencyLocation = async (req, res) => {
    try {
        const { latitude, longitude, address } = req.body;
        const emergency = await EmergencyRequest.findOne({
            _id: req.params.id,
            patientId: req.user._id,
        });

        if (!emergency) {
            return res.status(404).json({ success: false, message: "Emergency request not found." });
        }

        if (latitude != null) emergency.latitude = Number(latitude);
        if (longitude != null) emergency.longitude = Number(longitude);
        if (address) emergency.address = address.trim();

        await emergency.save();

        broadcastEmergencyEvent(
            "emergency:location-updated",
            {
                emergencyId: emergency._id,
                latitude: emergency.latitude,
                longitude: emergency.longitude,
                address: emergency.address,
            },
            {
                emergencyId: emergency._id,
                hospitalId: emergency.hospitalId,
                driverId: emergency.assignedDriverId,
            }
        );

        res.status(200).json({
            success: true,
            message: "Emergency location updated.",
            location: {
                latitude: emergency.latitude,
                longitude: emergency.longitude,
                address: emergency.address,
            },
        });
    } catch (error) {
        console.error("updateEmergencyLocation error:", error);
        res.status(500).json({ success: false, message: "Failed to update location." });
    }
};

// Patient: Get own emergency requests
exports.getMyEmergencyRequests = async (req, res) => {
    try {
        const requests = await EmergencyRequest.find({
            patientId: req.user._id,
        })
            .sort({ createdAt: -1 })
            .populate("hospitalId", "hospitalName city address hospitalPhone latitude longitude")
            .populate(
                "ambulanceId",
                "ambulanceNumber vehicleType capability driverName driverPhone status availabilityStatus currentLocation"
            )
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

        if (!["Requested", "Assigned", "HOSPITAL_RECOMMENDED", "HOSPITAL_ACCEPTED"].includes(request.status)) {
            return res.status(400).json({
                success: false,
                message: "This emergency request is already dispatched or underway and cannot be cancelled directly.",
            });
        }

        request.status = "Cancelled";
        request.statusHistory.push({
            status: "Cancelled",
            changedBy: req.user._id,
            role: "patient",
            changedAt: new Date(),
            note: "Patient cancelled emergency request.",
        });
        await request.save();

        // Release ambulance if one was assigned
        if (request.ambulanceId) {
            await Ambulance.findByIdAndUpdate(request.ambulanceId, {
                status: "Available",
                availabilityStatus: "AVAILABLE",
                availability: true,
                assignedEmergencyId: null,
            });
        }

        broadcastEmergencyEvent(
            "emergency:cancelled",
            { emergencyId: request._id },
            {
                emergencyId: request._id,
                hospitalId: request.hospitalId,
                driverId: request.assignedDriverId,
            }
        );

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

// Hospital: Accept emergency request
exports.hospitalAcceptEmergency = async (req, res) => {
    try {
        const emergencyId = req.params.id;

        let hospital = await Hospital.findOne({ userId: req.user._id });
        if (!hospital) hospital = await Hospital.findOne({ hospitalEmail: req.user.email });

        if (!hospital && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Hospital profile not found." });
        }

        const emergency = await EmergencyRequest.findById(emergencyId)
            .populate("patientId", "fullName phone email");

        if (!emergency) {
            return res.status(404).json({ success: false, message: "Emergency request not found." });
        }

        emergency.hospitalAcceptanceStatus = "ACCEPTED";
        emergency.status = "HOSPITAL_ACCEPTED";
        emergency.statusHistory.push({
            status: "HOSPITAL_ACCEPTED",
            changedBy: req.user._id,
            role: "hospital",
            changedAt: new Date(),
            note: `Emergency transfer accepted by ${hospital?.hospitalName || "Hospital"}. Preparing ambulance dispatch.`,
        });

        await emergency.save();

        // Match available fleet for this emergency
        const fleetMatch = await matchAmbulanceForHospital(
            hospital?._id || emergency.hospitalId,
            emergency.emergencyCategory,
            emergency.latitude,
            emergency.longitude
        );

        // Notify patient
        if (emergency.patientId?._id) {
            await Notification.create({
                userId: emergency.patientId._id,
                title: "Emergency Request Accepted",
                message: `${hospital?.hospitalName || "Hospital"} has accepted your emergency request. An ambulance is being prepared for dispatch now.`,
                type: "Emergency",
                relatedId: emergency._id,
            }).catch(() => {});
        }

        // Broadcast Socket.IO
        broadcastEmergencyEvent(
            "emergency:hospital-accepted",
            {
                emergencyId: emergency._id,
                hospitalId: hospital?._id || emergency.hospitalId,
                hospitalName: hospital?.hospitalName,
                status: "HOSPITAL_ACCEPTED",
                timestamp: new Date(),
            },
            {
                emergencyId: emergency._id,
                hospitalId: hospital?._id || emergency.hospitalId,
                patientId: emergency.patientId?._id,
            }
        );

        res.status(200).json({
            success: true,
            message: "Emergency transfer accepted. Fleet selection ready.",
            emergency,
            recommendedAmbulance: fleetMatch.recommendedAmbulance,
            alternativeAmbulances: fleetMatch.alternativeAmbulances,
        });
    } catch (error) {
        console.error("hospitalAcceptEmergency error:", error);
        res.status(500).json({ success: false, message: "Failed to accept emergency request." });
    }
};

// Hospital: Reject emergency request (triggers admin escalation)
exports.hospitalRejectEmergency = async (req, res) => {
    try {
        const { reason } = req.body;
        const emergencyId = req.params.id;

        if (!reason?.trim()) {
            return res.status(400).json({ success: false, message: "Please provide a reason for redirecting/rejecting this emergency." });
        }

        let hospital = await Hospital.findOne({ userId: req.user._id });
        if (!hospital) hospital = await Hospital.findOne({ hospitalEmail: req.user.email });

        const emergency = await EmergencyRequest.findById(emergencyId)
            .populate("patientId", "fullName phone email");

        if (!emergency) {
            return res.status(404).json({ success: false, message: "Emergency request not found." });
        }

        emergency.hospitalAcceptanceStatus = "REJECTED";
        emergency.hospitalRejectReason = reason.trim();
        emergency.status = "HOSPITAL_REJECTED";
        emergency.statusHistory.push({
            status: "HOSPITAL_REJECTED",
            changedBy: req.user._id,
            role: "hospital",
            changedAt: new Date(),
            note: `Hospital rejected request: ${reason.trim()}. Escalated to admin.`,
        });

        await emergency.save();

        // Notify Admins immediately
        const admins = await User.find({ role: "admin" }).select("_id").lean();
        for (const admin of admins) {
            await Notification.create({
                userId: admin._id,
                title: "ALERT: Hospital Rejected Emergency Transfer",
                message: `${hospital?.hospitalName || "Hospital"} rejected emergency #${emergency._id.toString().slice(-6)}: "${reason.trim()}". Administrative override required.`,
                type: "Emergency",
                relatedId: emergency._id,
            }).catch(() => {});
        }

        // Broadcast Socket.IO
        broadcastEmergencyEvent(
            "emergency:hospital-rejected",
            {
                emergencyId: emergency._id,
                hospitalId: hospital?._id || emergency.hospitalId,
                hospitalName: hospital?.hospitalName,
                reason: reason.trim(),
                status: "HOSPITAL_REJECTED",
                timestamp: new Date(),
            },
            {
                emergencyId: emergency._id,
                hospitalId: hospital?._id || emergency.hospitalId,
                patientId: emergency.patientId?._id,
            }
        );

        res.status(200).json({
            success: true,
            message: "Emergency transfer rejected. System has escalated to platform administrators for reassignment.",
            emergency,
        });
    } catch (error) {
        console.error("hospitalRejectEmergency error:", error);
        res.status(500).json({ success: false, message: "Failed to reject emergency request." });
    }
};

// Hospital: Dispatch selected ambulance to emergency
exports.hospitalDispatchAmbulance = async (req, res) => {
    try {
        const { ambulanceId, overrideReason } = req.body;
        const emergencyId = req.params.id;

        if (!ambulanceId) {
            return res.status(400).json({ success: false, message: "Please select an ambulance to dispatch." });
        }

        let hospital = await Hospital.findOne({ userId: req.user._id });
        if (!hospital) hospital = await Hospital.findOne({ hospitalEmail: req.user.email });

        const emergency = await EmergencyRequest.findById(emergencyId)
            .populate("patientId", "fullName phone email");

        if (!emergency) {
            return res.status(404).json({ success: false, message: "Emergency request not found." });
        }

        // Atomic vehicle lock
        const claimedAmbulance = await Ambulance.findOneAndUpdate(
            {
                _id: ambulanceId,
                verificationStatus: { $ne: "SUSPENDED" },
                $or: [
                    { assignedEmergencyId: emergency._id },
                    { assignedEmergencyId: null, availability: true },
                    { assignedEmergencyId: { $exists: false }, availability: true },
                ],
            },
            {
                $set: {
                    status: "Busy",
                    availabilityStatus: "DISPATCHED",
                    availability: false,
                    assignedEmergencyId: emergency._id,
                },
            },
            { new: true }
        ).populate("driverId", "fullName phone dutyStatus");

        if (!claimedAmbulance) {
            return res.status(409).json({
                success: false,
                message: "This ambulance is no longer available or is already assigned to another active emergency.",
            });
        }

        // Release previous ambulance if reassigned
        if (emergency.ambulanceId && String(emergency.ambulanceId) !== String(claimedAmbulance._id)) {
            await Ambulance.updateOne(
                { _id: emergency.ambulanceId, assignedEmergencyId: emergency._id },
                {
                    $set: {
                        status: "Available",
                        availabilityStatus: "AVAILABLE",
                        availability: true,
                        assignedEmergencyId: null,
                    },
                }
            );
        }

        // Find driver
        let driverUser = claimedAmbulance.driverId;
        if (!driverUser) {
            driverUser = await User.findOne({
                assignedAmbulanceId: claimedAmbulance._id,
                role: "driver",
            });
        }

        emergency.ambulanceId = claimedAmbulance._id;
        emergency.assignedAmbulanceId = claimedAmbulance._id;
        emergency.assignedDriverId = driverUser?._id || undefined;
        emergency.status = "Assigned";
        emergency.journeyStatus = "DISPATCHED";

        const note = overrideReason?.trim()
            ? `Hospital dispatched ${claimedAmbulance.ambulanceNumber}. Override reason: ${overrideReason.trim()}`
            : `Hospital dispatched ${claimedAmbulance.ambulanceNumber} (Driver: ${claimedAmbulance.driverName}).`;

        emergency.statusHistory.push({
            status: "DISPATCHED",
            changedBy: req.user._id,
            role: "hospital",
            changedAt: new Date(),
            note,
        });

        await emergency.save();

        // 1. Direct Dispatch Order to Driver
        if (driverUser?._id) {
            await Notification.create({
                userId: driverUser._id,
                title: `🚨 DISPATCH ORDER: ${emergency.emergencyCategory}`,
                message: `Immediate response required! Destination: ${emergency.address || "Live GPS location"}. Patient: ${emergency.contactNumber}.`,
                type: "Emergency",
                relatedId: emergency._id,
            }).catch(() => {});

            emitToDriver(driverUser._id, "emergency:ambulance-dispatched", {
                emergencyId: emergency._id,
                emergencyCategory: emergency.emergencyCategory,
                patient: {
                    fullName: emergency.patientId?.fullName,
                    phone: emergency.contactNumber,
                },
                location: {
                    latitude: emergency.latitude,
                    longitude: emergency.longitude,
                    address: emergency.address,
                },
                ambulance: {
                    _id: claimedAmbulance._id,
                    ambulanceNumber: claimedAmbulance.ambulanceNumber,
                },
                timestamp: new Date(),
            });
        }

        // 2. Patient Notification
        if (emergency.patientId?._id) {
            await Notification.create({
                userId: emergency.patientId._id,
                title: "Ambulance Dispatched",
                message: `Ambulance ${claimedAmbulance.ambulanceNumber} has been dispatched! Driver: ${claimedAmbulance.driverName} (${claimedAmbulance.driverPhone}).`,
                type: "Emergency",
                relatedId: emergency._id,
            }).catch(() => {});
        }

        // 3. Broadcast Socket.IO
        broadcastEmergencyEvent(
            "emergency:ambulance-dispatched",
            {
                emergencyId: emergency._id,
                ambulanceId: claimedAmbulance._id,
                ambulanceNumber: claimedAmbulance.ambulanceNumber,
                driverName: claimedAmbulance.driverName,
                driverPhone: claimedAmbulance.driverPhone,
                driverId: driverUser?._id,
                journeyStatus: "DISPATCHED",
                status: "Assigned",
                timestamp: new Date(),
            },
            {
                emergencyId: emergency._id,
                hospitalId: hospital?._id || emergency.hospitalId,
                driverId: driverUser?._id,
                patientId: emergency.patientId?._id,
            }
        );

        // Audit Log
        await AuditLog.create({
            userId: req.user._id,
            userName: req.user.fullName,
            userRole: "hospital",
            action: "Ambulance Dispatched",
            details: `Dispatched ambulance ${claimedAmbulance.ambulanceNumber} for emergency ${emergency._id}`,
            targetId: emergency._id,
            targetType: "Emergency",
        }).catch(() => {});

        res.status(200).json({
            success: true,
            message: `Ambulance ${claimedAmbulance.ambulanceNumber} dispatched successfully. Driver notified.`,
            emergency,
            dispatchedAmbulance: claimedAmbulance,
        });
    } catch (error) {
        console.error("hospitalDispatchAmbulance error:", error);
        res.status(500).json({ success: false, message: "Failed to dispatch ambulance." });
    }
};

// Hospital: Emergency operations overview & active fleet
exports.getHospitalEmergencyOperations = async (req, res) => {
    try {
        let hospital = await Hospital.findOne({ userId: req.user._id });
        if (!hospital) hospital = await Hospital.findOne({ hospitalEmail: req.user.email });

        if (!hospital) {
            return res.status(200).json({
                success: true,
                hospital: null,
                capabilities: {},
                incomingCount: 0,
                activeCount: 0,
            });
        }

        const [incoming, active, fleet] = await Promise.all([
            EmergencyRequest.find({
                hospitalId: hospital._id,
                hospitalAcceptanceStatus: "PENDING",
                status: { $nin: ["Cancelled", "Completed", "HOSPITAL_REJECTED"] },
            })
                .populate("patientId", "fullName email phone")
                .sort({ createdAt: -1 })
                .lean(),

            EmergencyRequest.find({
                hospitalId: hospital._id,
                hospitalAcceptanceStatus: "ACCEPTED",
                status: { $in: ["Assigned", "On The Way", "Arrived", "HOSPITAL_ACCEPTED"] },
            })
                .populate("patientId", "fullName email phone")
                .populate("ambulanceId", "ambulanceNumber vehicleType driverName driverPhone status currentLocation")
                .populate("assignedDriverId", "fullName phone dutyStatus")
                .sort({ updatedAt: -1 })
                .lean(),

            Ambulance.find({ hospitalId: hospital._id })
                .populate("driverId", "fullName phone dutyStatus")
                .lean(),
        ]);

        res.status(200).json({
            success: true,
            hospital: {
                _id: hospital._id,
                hospitalName: hospital.hospitalName,
                emergencyAvailable: hospital.emergencyAvailable,
                capabilities: hospital.emergencyCapabilities || {},
            },
            incomingEmergencies: incoming,
            activeEmergencies: active,
            fleet,
        });
    } catch (error) {
        console.error("getHospitalEmergencyOperations error:", error);
        res.status(500).json({ success: false, message: "Failed to load emergency operations." });
    }
};

// Hospital: Update emergency capabilities toggles
exports.updateHospitalEmergencyCapabilities = async (req, res) => {
    try {
        const {
            emergencyOpen,
            cardiacCare,
            traumaCare,
            strokeSupport,
            breathingEmergencySupport,
            maternityEmergency,
            pediatricEmergency,
        } = req.body;

        let hospital = await Hospital.findOne({ userId: req.user._id });
        if (!hospital) hospital = await Hospital.findOne({ hospitalEmail: req.user.email });

        if (!hospital) {
            return res.status(404).json({ success: false, message: "Hospital profile not found." });
        }

        hospital.emergencyCapabilities = {
            emergencyOpen: emergencyOpen !== undefined ? Boolean(emergencyOpen) : hospital.emergencyCapabilities?.emergencyOpen ?? true,
            cardiacCare: cardiacCare !== undefined ? Boolean(cardiacCare) : hospital.emergencyCapabilities?.cardiacCare ?? false,
            traumaCare: traumaCare !== undefined ? Boolean(traumaCare) : hospital.emergencyCapabilities?.traumaCare ?? false,
            strokeSupport: strokeSupport !== undefined ? Boolean(strokeSupport) : hospital.emergencyCapabilities?.strokeSupport ?? false,
            breathingEmergencySupport: breathingEmergencySupport !== undefined ? Boolean(breathingEmergencySupport) : hospital.emergencyCapabilities?.breathingEmergencySupport ?? false,
            maternityEmergency: maternityEmergency !== undefined ? Boolean(maternityEmergency) : hospital.emergencyCapabilities?.maternityEmergency ?? false,
            pediatricEmergency: pediatricEmergency !== undefined ? Boolean(pediatricEmergency) : hospital.emergencyCapabilities?.pediatricEmergency ?? false,
            lastUpdatedAt: new Date(),
            updatedBy: req.user._id,
        };

        // Sync main emergencyAvailable boolean
        hospital.emergencyAvailable = hospital.emergencyCapabilities.emergencyOpen;

        await hospital.save();

        res.status(200).json({
            success: true,
            message: "Hospital emergency capabilities updated successfully.",
            capabilities: hospital.emergencyCapabilities,
            emergencyAvailable: hospital.emergencyAvailable,
        });
    } catch (error) {
        console.error("updateHospitalEmergencyCapabilities error:", error);
        res.status(500).json({ success: false, message: "Failed to update capabilities." });
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
            .populate("ambulanceId", "ambulanceNumber vehicleType capability driverName driverPhone status availabilityStatus currentLocation")
            .populate("assignedDriverId", "fullName phone dutyStatus")
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

// Hospital: Available ambulances matching an emergency
exports.getHospitalAvailableAmbulances = async (req, res) => {
    try {
        let hospital = await Hospital.findOne({ userId: req.user._id });
        if (!hospital) hospital = await Hospital.findOne({ hospitalEmail: req.user.email });

        if (!hospital) {
            return res.status(404).json({ success: false, message: "Hospital profile not found." });
        }

        const { emergencyId } = req.query;
        let emergency = null;
        if (emergencyId) {
            emergency = await EmergencyRequest.findById(emergencyId).lean();
        }

        const matchResult = await matchAmbulanceForHospital(
            hospital._id,
            emergency?.emergencyCategory || "Other Emergency",
            emergency?.latitude,
            emergency?.longitude
        );

        res.status(200).json({
            success: true,
            recommendedAmbulance: matchResult.recommendedAmbulance,
            alternativeAmbulances: matchResult.alternativeAmbulances,
            rule: matchResult.rule,
        });
    } catch (error) {
        console.error("getHospitalAvailableAmbulances error:", error);
        res.status(500).json({ success: false, message: "Failed to load available ambulances." });
    }
};

// Hospital / Admin: Update emergency status & assign ambulance (legacy fallback)
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

        const oldStatus = emergency.status;
        if (status) emergency.status = status;
        if (hospitalNotes !== undefined) emergency.hospitalNotes = hospitalNotes.trim();

        let assignedAmbulance = null;
        if (ambulanceId) {
            const claimed = await Ambulance.findOneAndUpdate(
                {
                    _id: ambulanceId,
                    $or: [
                        { assignedEmergencyId: emergency._id },
                        { assignedEmergencyId: null, availability: true },
                        { assignedEmergencyId: { $exists: false }, availability: true },
                    ],
                },
                {
                    $set: {
                        status: ["On The Way", "Arrived"].includes(emergency.status) ? "Busy" : "Assigned",
                        availability: false,
                        assignedEmergencyId: emergency._id,
                    },
                },
                { new: true }
            );

            if (claimed) {
                if (emergency.ambulanceId && String(emergency.ambulanceId) !== String(claimed._id)) {
                    await Ambulance.updateOne(
                        { _id: emergency.ambulanceId, assignedEmergencyId: emergency._id },
                        { $set: { status: "Available", availability: true, assignedEmergencyId: null } }
                    );
                }
                emergency.ambulanceId = claimed._id;
                assignedAmbulance = claimed;
            }
        }

        if (["Completed", "Cancelled"].includes(emergency.status) && emergency.ambulanceId) {
            await Ambulance.updateOne(
                { _id: emergency.ambulanceId, assignedEmergencyId: emergency._id },
                { $set: { status: "Available", availability: true, assignedEmergencyId: null } }
            );
        }

        await emergency.save();

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
            .populate("hospitalId", "hospitalName city hospitalPhone latitude longitude")
            .populate(
                "ambulanceId",
                "ambulanceNumber vehicleType capability driverName driverPhone status availabilityStatus currentLocation"
            )
            .populate("assignedDriverId", "fullName phone dutyStatus")
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

// Admin: Live emergency monitoring overview
exports.getAdminEmergencyMonitor = async (req, res) => {
    try {
        const [activeEmergencies, activeAmbulances, hospitals] = await Promise.all([
            EmergencyRequest.find({
                status: { $nin: ["Completed", "Cancelled"] },
            })
                .populate("patientId", "fullName email phone")
                .populate("hospitalId", "hospitalName city hospitalPhone latitude longitude emergencyCapabilities")
                .populate(
                    "ambulanceId",
                    "ambulanceNumber vehicleType capability driverName driverPhone status availabilityStatus currentLocation"
                )
                .populate("assignedDriverId", "fullName phone dutyStatus currentLocation")
                .sort({ updatedAt: -1 })
                .lean(),

            Ambulance.find({
                $or: [
                    { status: { $in: ["Available", "Assigned", "On The Way", "Busy"] } },
                    { availabilityStatus: { $in: ["AVAILABLE", "DISPATCHED", "EN_ROUTE_TO_PATIENT", "ARRIVED_AT_PATIENT", "PATIENT_ONBOARD", "EN_ROUTE_TO_HOSPITAL"] } },
                ],
            })
                .populate("hospitalId", "hospitalName city")
                .populate("driverId", "fullName phone dutyStatus")
                .lean(),

            Hospital.find({ emergencyAvailable: true })
                .select("hospitalName city latitude longitude emergencyAvailable emergencyCapabilities hospitalPhone")
                .lean(),
        ]);

        const criticalCount = activeEmergencies.filter(
            (e) =>
                e.emergencyCategory === "Heart / Chest Pain" ||
                e.emergencyCategory === "Accident / Trauma" ||
                e.emergencyCategory === "Stroke Symptoms" ||
                e.emergencyCategory === "Severe Bleeding" ||
                e.emergencyCategory === "Breathing Emergency" ||
                e.emergencyCategory === "Unconscious Person"
        ).length;

        const exceptionAlerts = [];
        const now = Date.now();

        activeEmergencies.forEach((em) => {
            if (em.status === "HOSPITAL_REJECTED") {
                exceptionAlerts.push({
                    type: "HOSPITAL_REJECTED",
                    severity: "error",
                    emergencyId: em._id,
                    title: `Hospital Rejected: #${em._id.toString().slice(-6)}`,
                    message: `${em.hospitalId?.hospitalName || "Hospital"} rejected transfer: "${em.hospitalRejectReason || "No reason specified"}". Administrative override needed.`,
                });
            }
            if (em.status === "AMBULANCE_NOT_RESPONDING" || em.driverIssue?.reported) {
                exceptionAlerts.push({
                    type: "DRIVER_ISSUE",
                    severity: "error",
                    emergencyId: em._id,
                    title: `Driver Issue: #${em._id.toString().slice(-6)}`,
                    message: `Driver reported: "${em.driverIssue?.reason || "Delay/breakdown"}". Please dispatch replacement.`,
                });
            }
            if (em.status === "NO_CAPABLE_HOSPITAL") {
                exceptionAlerts.push({
                    type: "NO_CAPABLE_HOSPITAL",
                    severity: "warning",
                    emergencyId: em._id,
                    title: `No Capable Facility: #${em._id.toString().slice(-6)}`,
                    message: `No hospital with open intake matched ${em.emergencyCategory}. Manual hospital assignment required.`,
                });
            }

            // Check GPS staleness for active trips
            if (em.journeyStatus && em.journeyStatus !== "HANDOVER_COMPLETE" && em.ambulanceId?.currentLocation?.updatedAt) {
                const diffMin = (now - new Date(em.ambulanceId.currentLocation.updatedAt).getTime()) / (1000 * 60);
                if (diffMin > 10) {
                    exceptionAlerts.push({
                        type: "GPS_STALE",
                        severity: "warning",
                        emergencyId: em._id,
                        title: `GPS Stale: Ambulance ${em.ambulanceId.ambulanceNumber}`,
                        message: `No location update for ${Math.round(diffMin)} minutes. Last known: ${em.ambulanceId.currentLocation.address || "Coordinates recorded"}.`,
                    });
                }
            }
        });

        res.status(200).json({
            success: true,
            metrics: {
                activeCount: activeEmergencies.length,
                criticalCount,
                ambulancesActive: activeAmbulances.length,
                exceptionCount: exceptionAlerts.length,
            },
            exceptionAlerts,
            activeEmergencies,
            activeAmbulances,
            hospitals,
        });
    } catch (error) {
        console.error("getAdminEmergencyMonitor error:", error);
        res.status(500).json({ success: false, message: "Failed to load live monitor." });
    }
};

// Admin: Override Hospital assignment
exports.adminOverrideHospital = async (req, res) => {
    try {
        const { hospitalId, reason } = req.body;
        const emergencyId = req.params.id;

        if (!hospitalId || !reason?.trim()) {
            return res.status(400).json({ success: false, message: "Hospital ID and override reason are required." });
        }

        const [emergency, targetHospital] = await Promise.all([
            EmergencyRequest.findById(emergencyId),
            Hospital.findById(hospitalId),
        ]);

        if (!emergency) {
            return res.status(404).json({ success: false, message: "Emergency request not found." });
        }
        if (!targetHospital) {
            return res.status(404).json({ success: false, message: "Target hospital not found." });
        }

        const prevHospitalId = emergency.hospitalId;
        emergency.hospitalId = targetHospital._id;
        emergency.assignedHospitalId = targetHospital._id;
        emergency.hospitalAcceptanceStatus = "PENDING";
        emergency.status = "HOSPITAL_RECOMMENDED";
        emergency.overrideInfo = {
            overriddenBy: req.user._id,
            reason: reason.trim(),
            previousHospitalId: prevHospitalId,
            timestamp: new Date(),
        };

        emergency.statusHistory.push({
            status: "MANUAL_ESCALATION",
            changedBy: req.user._id,
            role: "admin",
            changedAt: new Date(),
            note: `Admin manually reassigned to ${targetHospital.hospitalName}. Reason: ${reason.trim()}`,
        });

        await emergency.save();

        // Notify Target Hospital
        if (targetHospital.userId) {
            await Notification.create({
                userId: targetHospital.userId,
                title: "ADMIN OVERRIDE: Emergency Transfer Reassigned",
                message: `Admin has assigned emergency #${emergency._id.toString().slice(-6)} to your facility. Reason: ${reason.trim()}`,
                type: "Emergency",
                relatedId: emergency._id,
            }).catch(() => {});
        }

        emitToHospital(targetHospital._id, "emergency:created", {
            emergencyId: emergency._id,
            emergencyCategory: emergency.emergencyCategory,
            status: emergency.status,
            reason: reason.trim(),
        });

        res.status(200).json({
            success: true,
            message: `Emergency reassigned to ${targetHospital.hospitalName}.`,
            emergency,
        });
    } catch (error) {
        console.error("adminOverrideHospital error:", error);
        res.status(500).json({ success: false, message: "Failed to override hospital." });
    }
};

// Admin: Override Ambulance assignment
exports.adminOverrideAmbulance = async (req, res) => {
    try {
        const { ambulanceId, reason } = req.body;
        const emergencyId = req.params.id;

        if (!ambulanceId || !reason?.trim()) {
            return res.status(400).json({ success: false, message: "Ambulance ID and override reason are required." });
        }

        const emergency = await EmergencyRequest.findById(emergencyId);
        if (!emergency) {
            return res.status(404).json({ success: false, message: "Emergency request not found." });
        }

        const prevAmbulanceId = emergency.ambulanceId;

        const claimed = await Ambulance.findOneAndUpdate(
            {
                _id: ambulanceId,
                $or: [
                    { assignedEmergencyId: emergency._id },
                    { assignedEmergencyId: null, availability: true },
                    { assignedEmergencyId: { $exists: false }, availability: true },
                ],
            },
            {
                $set: {
                    status: "Busy",
                    availabilityStatus: "DISPATCHED",
                    availability: false,
                    assignedEmergencyId: emergency._id,
                },
            },
            { new: true }
        ).populate("driverId", "fullName phone dutyStatus");

        if (!claimed) {
            return res.status(409).json({ success: false, message: "Selected ambulance is not available." });
        }

        if (prevAmbulanceId && String(prevAmbulanceId) !== String(claimed._id)) {
            await Ambulance.updateOne(
                { _id: prevAmbulanceId, assignedEmergencyId: emergency._id },
                { $set: { status: "Available", availabilityStatus: "AVAILABLE", availability: true, assignedEmergencyId: null } }
            );
        }

        let driverUser = claimed.driverId;
        if (!driverUser) {
            driverUser = await User.findOne({ assignedAmbulanceId: claimed._id, role: "driver" });
        }

        emergency.ambulanceId = claimed._id;
        emergency.assignedAmbulanceId = claimed._id;
        emergency.assignedDriverId = driverUser?._id || undefined;
        emergency.status = "Assigned";
        emergency.journeyStatus = "DISPATCHED";
        emergency.overrideInfo = {
            overriddenBy: req.user._id,
            reason: reason.trim(),
            previousAmbulanceId: prevAmbulanceId,
            timestamp: new Date(),
        };

        emergency.statusHistory.push({
            status: "DISPATCHED",
            changedBy: req.user._id,
            role: "admin",
            changedAt: new Date(),
            note: `Admin manually reassigned ambulance to ${claimed.ambulanceNumber}. Reason: ${reason.trim()}`,
        });

        await emergency.save();

        if (driverUser?._id) {
            emitToDriver(driverUser._id, "emergency:ambulance-dispatched", {
                emergencyId: emergency._id,
                ambulanceNumber: claimed.ambulanceNumber,
                emergencyCategory: emergency.emergencyCategory,
            });
        }

        broadcastEmergencyEvent(
            "emergency:ambulance-dispatched",
            {
                emergencyId: emergency._id,
                ambulanceId: claimed._id,
                ambulanceNumber: claimed.ambulanceNumber,
                driverName: claimed.driverName,
                status: "Assigned",
                journeyStatus: "DISPATCHED",
            },
            {
                emergencyId: emergency._id,
                hospitalId: emergency.hospitalId,
                driverId: driverUser?._id,
                patientId: emergency.patientId,
            }
        );

        res.status(200).json({
            success: true,
            message: `Ambulance ${claimed.ambulanceNumber} assigned by administrator.`,
            emergency,
        });
    } catch (error) {
        console.error("adminOverrideAmbulance error:", error);
        res.status(500).json({ success: false, message: "Failed to override ambulance." });
    }
};

// Admin: General update legacy fallback
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

        const previousAmbulanceId = emergency.ambulanceId;
        if (hospitalId) emergency.hospitalId = hospitalId;
        if (status) emergency.status = status;
        if (hospitalNotes !== undefined) emergency.hospitalNotes = hospitalNotes.trim();

        if (ambulanceId) {
            const claimedAmbulance = await Ambulance.findOneAndUpdate(
                {
                    _id: ambulanceId,
                    $or: [
                        { assignedEmergencyId: emergency._id },
                        { assignedEmergencyId: null, availability: true, status: "Available" },
                        { assignedEmergencyId: { $exists: false }, availability: true, status: "Available" },
                    ],
                },
                {
                    $set: {
                        status: ["On The Way", "Arrived"].includes(emergency.status) ? "Busy" : "Assigned",
                        availability: false,
                        assignedEmergencyId: emergency._id,
                    },
                },
                { new: true }
            );

            if (claimedAmbulance) {
                emergency.ambulanceId = claimedAmbulance._id;
                if (previousAmbulanceId && String(previousAmbulanceId) !== String(claimedAmbulance._id)) {
                    await Ambulance.updateOne(
                        { _id: previousAmbulanceId, assignedEmergencyId: emergency._id },
                        { $set: { status: "Available", availability: true, assignedEmergencyId: null } }
                    );
                }
            }
        }

        if (["Completed", "Cancelled"].includes(emergency.status) && emergency.ambulanceId) {
            await Ambulance.updateOne(
                { _id: emergency.ambulanceId, assignedEmergencyId: emergency._id },
                { $set: { status: "Available", availability: true, assignedEmergencyId: null } }
            );
        }

        await emergency.save();

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
