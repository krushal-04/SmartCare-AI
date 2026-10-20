const express = require("express");

const router =
    express.Router();

const {
    protect,
    patientOnly,
} = require("../middleware/protect");

const {
    getPatientDashboard,
    getMyProfile,
    updateMyProfile,
} = require("../controllers/patientController");

router.get(
    "/dashboard",
    protect,
    patientOnly,
    getPatientDashboard
);

router.get(
    "/profile",
    protect,
    patientOnly,
    getMyProfile
);

router.put(
    "/profile",
    protect,
    patientOnly,
    updateMyProfile
);

module.exports = router;