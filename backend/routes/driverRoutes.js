const express = require("express");
const router = express.Router();
const { protect, driverOnly } = require("../middleware/protect");
const {
    startDuty,
    endDuty,
    updateLocation,
    getCurrentTrip,
    updateJourneyStatus,
    reportIssue,
    getProfile,
} = require("../controllers/driverController");

// All driver endpoints require auth + driver role
router.post("/duty/start", protect, driverOnly, startDuty);
router.post("/duty/end", protect, driverOnly, endDuty);
router.patch("/location", protect, driverOnly, updateLocation);
router.get("/current-trip", protect, driverOnly, getCurrentTrip);
router.patch("/emergency/:id/journey-status", protect, driverOnly, updateJourneyStatus);
router.post("/emergency/:id/report-issue", protect, driverOnly, reportIssue);
router.get("/profile", protect, driverOnly, getProfile);

module.exports = router;

