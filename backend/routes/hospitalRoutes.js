const express = require("express");
const router = express.Router();

const {
    addHospital,
    getHospitals,
    getHospitalById,
    getMyHospital,
    updateHospital,
    getHospitalDashboardStats,
    getHospitalPatients,
    getHospitalReviews,
} = require("../controllers/hospitalController");

const {
    protect,
    hospitalOnly,
} = require("../middleware/protect");

const uploadHospitalImages = require("../middleware/cloudinaryUpload");

// Hospital Dashboard statistics
router.get("/dashboard-stats", protect, hospitalOnly, getHospitalDashboardStats);

// Hospital Patients list
router.get("/patients", protect, hospitalOnly, getHospitalPatients);

// Hospital Reviews list
router.get("/reviews", protect, hospitalOnly, getHospitalReviews);

// Add Hospital profile
router.post(
    "/add",
    protect,
    hospitalOnly,
    uploadHospitalImages.array("hospitalImages", 5),
    addHospital
);

// All Hospitals (Public)
router.get("/all", getHospitals);

// Hospital Own Profile
router.get("/profile", protect, hospitalOnly, getMyHospital);
router.put("/profile", protect, hospitalOnly, uploadHospitalImages.array("hospitalImages", 5), updateHospital);

// Single Hospital by ID
router.get("/:id", getHospitalById);

module.exports = router;