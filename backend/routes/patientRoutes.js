const express = require("express");
const router = express.Router();

const {
    protect,
    patientOnly,
} = require("../middleware/protect");

const {
    getPatientDashboard,
    getMyProfile,
    updateMyProfile,
    getReminderSettings,
    updateReminderSettings,
} = require("../controllers/patientController");

router.get("/dashboard", protect, patientOnly, getPatientDashboard);
router.get("/profile", protect, patientOnly, getMyProfile);
router.put("/profile", protect, patientOnly, updateMyProfile);

// Reminder preferences
router.get("/reminder-settings", protect, patientOnly, getReminderSettings);
router.put("/reminder-settings", protect, patientOnly, updateReminderSettings);

module.exports = router;
