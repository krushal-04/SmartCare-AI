const express = require("express");
const router = express.Router();

const {
    protect,
    adminOnly,
} = require("../middleware/protect");

const {
    getAmbulances,
    getAmbulanceById,
    createAmbulance,
    updateAmbulance,
    deleteAmbulance,
} = require("../controllers/ambulanceController");

// Get all ambulances (Public / Hospital / Admin)
router.get("/", getAmbulances);
router.get("/all", getAmbulances);
router.get("/:id", getAmbulanceById);

// Add ambulance (Admin or Hospital)
router.post("/create", protect, createAmbulance);

// Update ambulance
router.put("/:id", protect, updateAmbulance);

// Delete ambulance (Admin only)
router.delete("/:id", protect, adminOnly, deleteAmbulance);

module.exports = router;
