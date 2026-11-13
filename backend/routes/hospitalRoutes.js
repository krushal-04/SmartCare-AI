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
    getHospitalEmergencyOperations,
    updateHospitalEmergencyCapabilities,
    getHospitalEmergencies,
    hospitalAcceptEmergency,
    hospitalRejectEmergency,
    getHospitalAvailableAmbulances,
    hospitalDispatchAmbulance,
} = require("../controllers/emergencyController");
const { getHospitalDrivers, createHospitalDriver } = require("../controllers/ambulanceController");

const {
    protect,
    hospitalOnly,
} = require("../middleware/protect");

const uploadHospitalImages = require("../middleware/cloudinaryUpload");

// Hospital Dashboard statistics
router.get("/dashboard-stats", protect, hospitalOnly, getHospitalDashboardStats);

// Emergency Operations Endpoints (Prompt Spec #13)
router.get("/emergency-operations", protect, hospitalOnly, getHospitalEmergencyOperations);
router.patch("/emergency-capabilities", protect, hospitalOnly, updateHospitalEmergencyCapabilities);
router.get("/emergencies/incoming", protect, hospitalOnly, getHospitalEmergencies);
router.post("/emergencies/:id/accept", protect, hospitalOnly, hospitalAcceptEmergency);
router.post("/emergencies/:id/reject", protect, hospitalOnly, hospitalRejectEmergency);
router.get("/ambulances/available", protect, hospitalOnly, getHospitalAvailableAmbulances);
router.post("/emergencies/:id/dispatch-ambulance", protect, hospitalOnly, hospitalDispatchAmbulance);
router.get("/drivers", protect, hospitalOnly, getHospitalDrivers);
router.post("/drivers", protect, hospitalOnly, createHospitalDriver);

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
