const express = require("express");

const router = express.Router();

const {
    getPendingHospitals,
    approveHospital,
    rejectHospital,
    getAllHospitals
} = require("../controllers/adminController");

router.get("/pending-hospitals", getPendingHospitals);

router.get("/all-hospitals", getAllHospitals);

router.put("/approve/:id", approveHospital);

router.put("/reject/:id", rejectHospital);

module.exports = router;