const express = require("express");

const router = express.Router();

const {
    addHospital,
    getHospitals,
    getHospitalById,
    getMyHospital,
    updateHospital
} = require("../controllers/hospitalController");

const {
    protect,
    hospitalOnly
} = require("../middleware/authMiddleware");

router.post("/add", protect, hospitalOnly, addHospital);

router.get("/all", getHospitals);

router.get("/profile", protect, hospitalOnly, getMyHospital);

router.put("/profile", protect, hospitalOnly, updateHospital);

router.get("/:id", getHospitalById);

module.exports = router;