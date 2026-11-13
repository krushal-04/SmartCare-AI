const express = require("express");
const router = express.Router();

const {
    protect,
    patientOnly,
    hospitalOnly,
    adminOnly,
} = require("../middleware/protect");

const {
    requestEmergency,
    getEmergencyLiveStatus,
    updateEmergencyLocation,
    getMyEmergencyRequests,
    cancelEmergency,
    hospitalAcceptEmergency,
    hospitalRejectEmergency,
    hospitalDispatchAmbulance,
    getHospitalEmergencyOperations,
    updateHospitalEmergencyCapabilities,
    getHospitalEmergencies,
    getHospitalAvailableAmbulances,
    updateHospitalEmergencyStatus,
    getAllEmergencies,
    getAdminEmergencyMonitor,
    adminOverrideHospital,
    adminOverrideAmbulance,
    adminUpdateEmergency,
} = require("../controllers/emergencyController");

// Patient Routes
router.post("/request", protect, patientOnly, requestEmergency);
router.post("/", protect, patientOnly, requestEmergency);
router.get("/my", protect, patientOnly, getMyEmergencyRequests);
router.get("/:id/live-status", protect, getEmergencyLiveStatus);
router.patch("/:id/location", protect, patientOnly, updateEmergencyLocation);
router.put("/:id/cancel", protect, patientOnly, cancelEmergency);

// Hospital Operations & Dispatch Routes
router.get("/hospital/operations", protect, hospitalOnly, getHospitalEmergencyOperations);
router.patch("/hospital/capabilities", protect, hospitalOnly, updateHospitalEmergencyCapabilities);
router.get("/hospital/available-ambulances", protect, hospitalOnly, getHospitalAvailableAmbulances);
router.post("/hospital/:id/accept", protect, hospitalOnly, hospitalAcceptEmergency);
router.post("/hospital/:id/reject", protect, hospitalOnly, hospitalRejectEmergency);
router.post("/hospital/:id/dispatch-ambulance", protect, hospitalOnly, hospitalDispatchAmbulance);
router.get("/hospital", protect, hospitalOnly, getHospitalEmergencies);
router.put("/:id/status", protect, hospitalOnly, updateHospitalEmergencyStatus);

// Admin Live Monitor & Exception Handling
router.get("/admin/monitor", protect, adminOnly, getAdminEmergencyMonitor);
router.post("/admin/:id/override-hospital", protect, adminOnly, adminOverrideHospital);
router.post("/admin/:id/override-ambulance", protect, adminOnly, adminOverrideAmbulance);
router.get("/all", protect, adminOnly, getAllEmergencies);
router.put("/:id/admin", protect, adminOnly, adminUpdateEmergency);

module.exports = router;
