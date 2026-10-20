const express = require("express");
const router = express.Router();

const {
    protect,
    patientOnly,
    hospitalOnly,
    adminOnly,
} = require("../middleware/protect");

const {
    getAvailableSlots,
    createAppointment,
    getMyAppointments,
    getHospitalAppointments,
    updateAppointmentStatus,
    getAllAppointments,
} = require("../controllers/appointmentController");

router.get("/slots", protect, patientOnly, getAvailableSlots);
router.post("/create", protect, patientOnly, createAppointment);
router.get("/my", protect, patientOnly, getMyAppointments);
router.get("/hospital", protect, hospitalOnly, getHospitalAppointments);
router.get("/all", protect, adminOnly, getAllAppointments);
router.put("/:id/status", protect, updateAppointmentStatus);

module.exports = router;