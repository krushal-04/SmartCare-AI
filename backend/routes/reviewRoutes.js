const express = require("express");

const router =
    express.Router();

const {
    protect,
    patientOnly,
} = require("../middleware/protect");

const {
    getEligibleAppointments,
    createReview,
    getMyReviews,
} = require("../controllers/reviewController");

router.get(
    "/eligible",
    protect,
    patientOnly,
    getEligibleAppointments
);

router.post(
    "/",
    protect,
    patientOnly,
    createReview
);

router.get(
    "/my",
    protect,
    patientOnly,
    getMyReviews
);

module.exports = router;