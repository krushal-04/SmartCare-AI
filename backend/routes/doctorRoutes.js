const express = require("express");

const router = express.Router();

const {
    addDoctor,
    getDoctors,
    getHospitalDoctors,
    getDoctorById,
    updateDoctor,
    deleteDoctor
} = require("../controllers/doctorController");

const {
    protect,
    hospitalOnly
} = require("../middleware/authMiddleware");

router.post("/add", protect, hospitalOnly, addDoctor);

router.get("/all", getDoctors);

router.get("/hospital", protect, hospitalOnly, getHospitalDoctors);

router.get("/:id", getDoctorById);

router.put("/:id", protect, hospitalOnly, updateDoctor);

router.delete("/:id", protect, hospitalOnly, deleteDoctor);

module.exports = router;