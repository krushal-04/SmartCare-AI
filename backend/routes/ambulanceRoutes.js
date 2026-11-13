const express = require("express");
const router = express.Router();

const {
    protect,
} = require("../middleware/protect");

const {
    getAmbulances,
    getAmbulanceById,
    createAmbulance,
    updateAmbulance,
    deleteAmbulance,
    setAmbulanceRestriction,
} = require("../controllers/ambulanceController");

// Fleet data is operational data and requires authentication.
router.get("/", protect, getAmbulances);
router.get("/all", protect, getAmbulances);
router.get("/:id", protect, getAmbulanceById);

// Hospitals own and register their own ambulances.
router.post("/create", protect, createAmbulance);

// Update ambulance
router.put("/:id", protect, updateAmbulance);
router.patch("/:id/restriction", protect, setAmbulanceRestriction);

router.delete("/:id", protect, deleteAmbulance);

module.exports = router;
