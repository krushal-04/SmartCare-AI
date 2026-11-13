const User = require("../models/User");
const Ambulance = require("../models/Ambulance");
const EmergencyRequest = require("../models/EmergencyRequest");
const Notification = require("../models/Notification");
const AuditLog = require("../models/AuditLog");
const { broadcastEmergencyEvent, emitToUser, emitToRole, emitToHospital } = require("../services/socketService");

// Start Duty
exports.startDuty = async (req, res) => {
    try {
        const { latitude, longitude, accuracy, speed, heading, address } = req.body || {};

        const driver = await User.findById(req.user._id);
        if (!driver) {
            return res.status(404).json({ success: false, message: "Driver not found." });
        }

        driver.dutyStatus = "ON_DUTY";
        driver.lastDutyStartAt = new Date();

        if (latitude != null && longitude != null) {
            driver.currentLocation = {
                latitude: Number(latitude),
                longitude: Number(longitude),
                accuracy: accuracy != null ? Number(accuracy) : undefined,
                speed: speed != null ? Number(speed) : undefined,
                heading: heading != null ? Number(heading) : undefined,
                updatedAt: new Date(),
            };
        }

        await driver.save();

        let assignedAmbulance = null;
        if (driver.assignedAmbulanceId) {
            assignedAmbulance = await Ambulance.findById(driver.assignedAmbulanceId);
            if (assignedAmbulance) {
                if (assignedAmbulance.isRestricted) {
                    driver.dutyStatus = "OFF_DUTY";
                    await driver.save();
                    return res.status(403).json({ success: false, message: `Your ambulance is restricted by the hospital: ${assignedAmbulance.restrictionReason || "Contact hospital operations."}` });
                }
                // If not currently on an active emergency, make it available
                if (!assignedAmbulance.assignedEmergencyId) {
                    assignedAmbulance.status = "Available";
                    assignedAmbulance.availabilityStatus = "AVAILABLE";
                    assignedAmbulance.availability = true;
                }
                if (latitude != null && longitude != null) {
                    assignedAmbulance.currentLocation = {
                        latitude: Number(latitude),
                        longitude: Number(longitude),
                        accuracy: accuracy != null ? Number(accuracy) : undefined,
                        speed: speed != null ? Number(speed) : undefined,
                        heading: heading != null ? Number(heading) : undefined,
                        address: address?.trim() || assignedAmbulance.currentLocation?.address || "",
                        updatedAt: new Date(),
                    };
                }
                await assignedAmbulance.save();
            }
        }

        // Notify Admin & Hospital
        emitToRole("admin", "driver:duty-updated", {
            driverId: driver._id,
            driverName: driver.fullName,
            dutyStatus: "ON_DUTY",
            ambulanceId: assignedAmbulance?._id,
        });

        if (driver.hospitalId) {
            emitToHospital(driver.hospitalId, "driver:duty-updated", {
                driverId: driver._id,
                driverName: driver.fullName,
                dutyStatus: "ON_DUTY",
                ambulanceId: assignedAmbulance?._id,
            });
        }

        res.status(200).json({
            success: true,
            message: "Driver is now ON DUTY. Assigned ambulance is active for dispatch.",
            driver: {
                _id: driver._id,
                fullName: driver.fullName,
                phone: driver.phone,
                dutyStatus: driver.dutyStatus,
                assignedAmbulanceId: driver.assignedAmbulanceId,
                hospitalId: driver.hospitalId,
                currentLocation: driver.currentLocation,
            },
            assignedAmbulance,
        });
    } catch (err) {
        console.error("startDuty error:", err);
        res.status(500).json({ success: false, message: "Failed to start duty." });
    }
};

// End Duty
exports.endDuty = async (req, res) => {
    try {
        const driver = await User.findById(req.user._id);
        if (!driver) {
            return res.status(404).json({ success: false, message: "Driver not found." });
        }

        // Check if there is an active emergency trip running
        const activeTrip = await EmergencyRequest.findOne({
            $or: [
                { assignedDriverId: driver._id },
                { assignedAmbulanceId: driver.assignedAmbulanceId },
            ],
            journeyStatus: {
                $in: [
                    "DISPATCHED",
                    "EN_ROUTE_TO_PATIENT",
                    "ARRIVED_AT_PATIENT",
                    "PATIENT_ONBOARD",
                    "EN_ROUTE_TO_HOSPITAL",
                ],
            },
            status: { $nin: ["Completed", "Cancelled", "HOSPITAL_REJECTED"] },
        });

        if (activeTrip) {
            return res.status(400).json({
                success: false,
                message: "Cannot end duty while an active emergency trip is in progress. Please complete patient handover first.",
            });
        }

        driver.dutyStatus = "OFF_DUTY";
        driver.lastDutyEndAt = new Date();
        await driver.save();

        let assignedAmbulance = null;
        if (driver.assignedAmbulanceId) {
            assignedAmbulance = await Ambulance.findById(driver.assignedAmbulanceId);
            if (assignedAmbulance && !assignedAmbulance.assignedEmergencyId) {
                assignedAmbulance.status = "Offline";
                assignedAmbulance.availabilityStatus = "OFF_DUTY";
                assignedAmbulance.availability = false;
                await assignedAmbulance.save();
            }
        }

        emitToRole("admin", "driver:duty-updated", {
            driverId: driver._id,
            driverName: driver.fullName,
            dutyStatus: "OFF_DUTY",
            ambulanceId: assignedAmbulance?._id,
        });

        if (driver.hospitalId) {
            emitToHospital(driver.hospitalId, "driver:duty-updated", {
                driverId: driver._id,
                driverName: driver.fullName,
                dutyStatus: "OFF_DUTY",
                ambulanceId: assignedAmbulance?._id,
            });
        }

        res.status(200).json({
            success: true,
            message: "Driver is now OFF DUTY. GPS tracking paused.",
            dutyStatus: "OFF_DUTY",
        });
    } catch (err) {
        console.error("endDuty error:", err);
        res.status(500).json({ success: false, message: "Failed to end duty." });
    }
};

// Update GPS Location
exports.updateLocation = async (req, res) => {
    try {
        const { latitude, longitude, accuracy, speed, heading, address } = req.body;

        if (latitude == null || longitude == null) {
            return res.status(400).json({ success: false, message: "Latitude and longitude are required." });
        }

        const now = new Date();
        const locationData = {
            latitude: Number(latitude),
            longitude: Number(longitude),
            accuracy: accuracy != null ? Number(accuracy) : undefined,
            speed: speed != null ? Number(speed) : undefined,
            heading: heading != null ? Number(heading) : undefined,
            address: address?.trim() || "",
            updatedAt: now,
        };

        const driver = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { currentLocation: locationData } },
            { new: true }
        );

        let activeTrip = null;
        let ambulance = null;

        if (driver.assignedAmbulanceId) {
            ambulance = await Ambulance.findByIdAndUpdate(
                driver.assignedAmbulanceId,
                { $set: { currentLocation: locationData } },
                { new: true }
            );

            // Find any active emergency for this ambulance
            activeTrip = await EmergencyRequest.findOne({
                $or: [
                    { assignedDriverId: driver._id },
                    { ambulanceId: driver.assignedAmbulanceId },
                    { assignedAmbulanceId: driver.assignedAmbulanceId },
                ],
                journeyStatus: {
                    $in: [
                        "DISPATCHED",
                        "EN_ROUTE_TO_PATIENT",
                        "ARRIVED_AT_PATIENT",
                        "PATIENT_ONBOARD",
                        "EN_ROUTE_TO_HOSPITAL",
                    ],
                },
                status: { $nin: ["Completed", "Cancelled"] },
            });
        }

        // Broadcast live location to subscribers
        const payload = {
            driverId: driver._id,
            ambulanceId: ambulance?._id,
            ambulanceNumber: ambulance?.ambulanceNumber,
            emergencyId: activeTrip?._id || null,
            location: locationData,
        };

        broadcastEmergencyEvent("ambulance:location-updated", payload, {
            emergencyId: activeTrip?._id,
            hospitalId: driver.hospitalId || ambulance?.hospitalId,
            driverId: driver._id,
            patientId: activeTrip?.patientId,
        });

        res.status(200).json({
            success: true,
            location: locationData,
            hasActiveTrip: Boolean(activeTrip),
        });
    } catch (err) {
        console.error("updateLocation error:", err);
        res.status(500).json({ success: false, message: "Failed to update location." });
    }
};

// Get current active trip for driver
exports.getCurrentTrip = async (req, res) => {
    try {
        const driver = await User.findById(req.user._id);
        if (!driver) {
            return res.status(404).json({ success: false, message: "Driver not found." });
        }

        const trip = await EmergencyRequest.findOne({
            $or: [
                { assignedDriverId: driver._id },
                { assignedAmbulanceId: driver.assignedAmbulanceId },
                { ambulanceId: driver.assignedAmbulanceId },
            ],
            journeyStatus: {
                $in: [
                    "DISPATCHED",
                    "EN_ROUTE_TO_PATIENT",
                    "ARRIVED_AT_PATIENT",
                    "PATIENT_ONBOARD",
                    "EN_ROUTE_TO_HOSPITAL",
                ],
            },
            status: { $nin: ["Completed", "Cancelled", "HOSPITAL_REJECTED"] },
        })
            .populate("patientId", "fullName email phone")
            .populate("hospitalId", "hospitalName hospitalPhone address city latitude longitude")
            .populate("ambulanceId", "ambulanceNumber vehicleType capability status currentLocation")
            .sort({ updatedAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            trip: trip || null,
            dutyStatus: driver.dutyStatus,
        });
    } catch (err) {
        console.error("getCurrentTrip error:", err);
        res.status(500).json({ success: false, message: "Failed to get current trip." });
    }
};

// Update journey status (Start Journey / En Route / Arrived / Onboard / Hospital / Handover)
exports.updateJourneyStatus = async (req, res) => {
    try {
        const { journeyStatus, note } = req.body;
        const emergencyId = req.params.id;

        const validJourneyStatuses = [
            "DISPATCHED",
            "EN_ROUTE_TO_PATIENT",
            "ARRIVED_AT_PATIENT",
            "PATIENT_ONBOARD",
            "EN_ROUTE_TO_HOSPITAL",
            "HANDOVER_COMPLETE",
        ];

        if (!validJourneyStatuses.includes(journeyStatus)) {
            return res.status(400).json({
                success: false,
                message: `Invalid journey status. Valid values: ${validJourneyStatuses.join(", ")}`,
            });
        }

        const emergency = await EmergencyRequest.findById(emergencyId)
            .populate("patientId", "fullName email phone")
            .populate("hospitalId", "hospitalName userId hospitalPhone")
            .populate("ambulanceId");

        if (!emergency) {
            return res.status(404).json({ success: false, message: "Emergency trip not found." });
        }

        // Authorization check: Must be assigned driver or admin
        if (
            req.user.role === "driver" &&
            emergency.assignedDriverId &&
            String(emergency.assignedDriverId) !== String(req.user._id)
        ) {
            return res.status(403).json({ success: false, message: "You are not assigned to this emergency trip." });
        }

        const oldJourneyStatus = emergency.journeyStatus;
        emergency.journeyStatus = journeyStatus;

        // Map journey status to main emergency status
        let mainStatus = emergency.status;
        if (journeyStatus === "EN_ROUTE_TO_PATIENT") {
            mainStatus = "On The Way";
        } else if (journeyStatus === "ARRIVED_AT_PATIENT") {
            mainStatus = "Arrived";
        } else if (journeyStatus === "PATIENT_ONBOARD") {
            mainStatus = "Arrived";
        } else if (journeyStatus === "EN_ROUTE_TO_HOSPITAL") {
            mainStatus = "On The Way";
        } else if (journeyStatus === "HANDOVER_COMPLETE") {
            mainStatus = "Completed";
        }
        emergency.status = mainStatus;

        // Append to history
        emergency.statusHistory.push({
            status: journeyStatus,
            changedBy: req.user._id,
            role: "driver",
            changedAt: new Date(),
            note: note?.trim() || `Driver transitioned journey status to ${journeyStatus}`,
        });

        // Update ambulance status
        if (emergency.ambulanceId) {
            const amb = await Ambulance.findById(emergency.ambulanceId._id || emergency.ambulanceId);
            if (amb) {
                if (journeyStatus === "HANDOVER_COMPLETE") {
                    amb.status = "Available";
                    amb.availabilityStatus = "AVAILABLE";
                    amb.availability = true;
                    amb.assignedEmergencyId = null;
                } else {
                    amb.status = "Busy";
                    amb.availabilityStatus = journeyStatus;
                    amb.availability = false;
                }
                await amb.save();
            }
        }

        await emergency.save();

        // Notify Patient
        const journeyLabels = {
            EN_ROUTE_TO_PATIENT: "Ambulance is en route to your location",
            ARRIVED_AT_PATIENT: "Ambulance has arrived at your location",
            PATIENT_ONBOARD: "Patient is onboard the ambulance",
            EN_ROUTE_TO_HOSPITAL: "Ambulance is en route to the hospital",
            HANDOVER_COMPLETE: "Patient handover completed at the hospital",
        };

        if (emergency.patientId?._id) {
            await Notification.create({
                userId: emergency.patientId._id,
                title: `Emergency Trip Update: ${journeyStatus.replace(/_/g, " ")}`,
                message: journeyLabels[journeyStatus] || `Ambulance journey status updated to ${journeyStatus}.`,
                type: "Emergency",
                relatedId: emergency._id,
            }).catch(() => {});
        }

        // Notify Hospital Staff
        if (emergency.hospitalId?.userId) {
            await Notification.create({
                userId: emergency.hospitalId.userId,
                title: `Ambulance Update: ${journeyStatus.replace(/_/g, " ")}`,
                message: `Ambulance ${emergency.ambulanceId?.ambulanceNumber || ""} for emergency #${emergency._id.toString().slice(-6)} is now ${journeyStatus.replace(/_/g, " ")}.`,
                type: "Emergency",
                relatedId: emergency._id,
            }).catch(() => {});
        }

        // Broadcast via Socket.IO
        broadcastEmergencyEvent(
            "ambulance:journey-status-updated",
            {
                emergencyId: emergency._id,
                journeyStatus,
                status: mainStatus,
                ambulanceId: emergency.ambulanceId?._id,
                ambulanceNumber: emergency.ambulanceId?.ambulanceNumber,
                timestamp: new Date(),
            },
            {
                emergencyId: emergency._id,
                hospitalId: emergency.hospitalId?._id,
                driverId: req.user._id,
                patientId: emergency.patientId?._id,
            }
        );

        // Audit Log
        await AuditLog.create({
            userId: req.user._id,
            userName: req.user.fullName,
            userRole: "driver",
            action: "Ambulance Journey Status Updated",
            details: `Emergency ${emergency._id} journey changed from ${oldJourneyStatus} to ${journeyStatus}`,
            targetId: emergency._id,
            targetType: "Emergency",
        }).catch(() => {});

        res.status(200).json({
            success: true,
            message: `Journey status updated to ${journeyStatus}.`,
            emergency,
        });
    } catch (err) {
        console.error("updateJourneyStatus error:", err);
        res.status(500).json({ success: false, message: "Failed to update journey status." });
    }
};

// Report Issue (Breakdown / Medical issue)
exports.reportIssue = async (req, res) => {
    try {
        const { reason } = req.body;
        const emergencyId = req.params.id;

        if (!reason?.trim()) {
            return res.status(400).json({ success: false, message: "Please provide a reason or description of the issue." });
        }

        const emergency = await EmergencyRequest.findById(emergencyId)
            .populate("hospitalId", "hospitalName userId")
            .populate("patientId", "fullName phone");

        if (!emergency) {
            return res.status(404).json({ success: false, message: "Emergency request not found." });
        }

        emergency.driverIssue = {
            reported: true,
            reason: reason.trim(),
            reportedAt: new Date(),
        };
        emergency.status = "AMBULANCE_NOT_RESPONDING";
        emergency.statusHistory.push({
            status: "AMBULANCE_NOT_RESPONDING",
            changedBy: req.user._id,
            role: "driver",
            changedAt: new Date(),
            note: `Driver reported issue: ${reason.trim()}`,
        });

        await emergency.save();

        // Mark ambulance maintenance/busy
        if (emergency.ambulanceId) {
            await Ambulance.findByIdAndUpdate(emergency.ambulanceId, {
                status: "Busy",
                availabilityStatus: "MAINTENANCE",
                availability: false,
            });
        }

        // Notify Hospital Staff & Admin immediately
        if (emergency.hospitalId?.userId) {
            await Notification.create({
                userId: emergency.hospitalId.userId,
                title: "URGENT ALERT: Driver Reported Issue",
                message: `Ambulance driver reported an issue for emergency #${emergency._id.toString().slice(-6)}: "${reason.trim()}". Please reassign a replacement ambulance immediately.`,
                type: "Emergency",
                relatedId: emergency._id,
            }).catch(() => {});
        }

        // Broadcast socket escalation
        broadcastEmergencyEvent(
            "ambulance:not-responding",
            {
                emergencyId: emergency._id,
                reason: reason.trim(),
                reportedAt: new Date(),
                hospitalId: emergency.hospitalId?._id,
                ambulanceId: emergency.ambulanceId,
            },
            {
                emergencyId: emergency._id,
                hospitalId: emergency.hospitalId?._id,
                driverId: req.user._id,
                patientId: emergency.patientId?._id,
            }
        );

        res.status(200).json({
            success: true,
            message: "Issue reported. Hospital dispatch and platform administrators have been alerted.",
            emergency,
        });
    } catch (err) {
        console.error("reportIssue error:", err);
        res.status(500).json({ success: false, message: "Failed to report issue." });
    }
};

// Driver Profile & vehicle assignment
exports.getProfile = async (req, res) => {
    try {
        const driver = await User.findById(req.user._id)
            .populate("assignedAmbulanceId")
            .populate("hospitalId", "hospitalName address city hospitalPhone")
            .select("-password");

        if (!driver) {
            return res.status(404).json({ success: false, message: "Driver not found." });
        }

        res.status(200).json({
            success: true,
            driver,
        });
    } catch (err) {
        console.error("getProfile error:", err);
        res.status(500).json({ success: false, message: "Failed to get driver profile." });
    }
};

