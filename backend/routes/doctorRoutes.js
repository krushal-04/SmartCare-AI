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
const { uploadDoctorImage } = require("../middleware/cloudinaryUpload");

router.post("/add", protect, hospitalOnly, uploadDoctorImage.single("doctorImage"), addDoctor);

router.get("/", getDoctors);
router.get("/all", getDoctors);

router.get("/hospital", protect, hospitalOnly, getHospitalDoctors);

router.get("/:id", getDoctorById);

router.put("/:id", protect, hospitalOnly, uploadDoctorImage.single("doctorImage"), updateDoctor);

router.delete("/:id", protect, hospitalOnly, deleteDoctor);

module.exports = router;