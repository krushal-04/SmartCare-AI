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
    getMyEmergencyRequests,
    cancelEmergency,
    getHospitalEmergencies,
    updateHospitalEmergencyStatus,
    getAllEmergencies,
    adminUpdateEmergency,
} = require("../controllers/emergencyController");

// Patient Routes
router.post("/request", protect, patientOnly, requestEmergency);
router.get("/my", protect, patientOnly, getMyEmergencyRequests);
router.put("/:id/cancel", protect, patientOnly, cancelEmergency);

// Hospital Routes
router.get("/hospital", protect, hospitalOnly, getHospitalEmergencies);
router.put("/:id/status", protect, updateHospitalEmergencyStatus);

// Admin Routes
router.get("/all", protect, adminOnly, getAllEmergencies);
router.put("/:id/admin", protect, adminOnly, adminUpdateEmergency);

module.exports = router;