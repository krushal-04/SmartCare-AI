const express = require("express");
const router = express.Router();
const {
    getDoctorSchedule,
    updateDoctorSchedule,
    getHospitalSchedules,
} = require("../controllers/scheduleController");
const { protect, hospitalOnly } = require("../middleware/authMiddleware");

// Get doctor schedule (patient or hospital)
router.get("/doctor/:doctorId", protect, getDoctorSchedule);

// Update doctor schedule (hospital only)
router.put("/doctor/:doctorId", protect, hospitalOnly, updateDoctorSchedule);

// Get all schedules for logged-in hospital
router.get("/", protect, hospitalOnly, getHospitalSchedules);
router.get("/hospital", protect, hospitalOnly, getHospitalSchedules);

module.exports = router;
