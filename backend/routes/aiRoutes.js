const express = require("express");

const router = express.Router();

const {
    protect,
    patientOnly,
} = require("../middleware/protect");

const {
    chatWithGemini,
    analyzeSymptoms,
} = require("../controllers/aiController");

router.post(
    "/chat",
    protect,
    patientOnly,
    chatWithGemini
);

router.post(
    "/symptoms",
    protect,
    patientOnly,
    analyzeSymptoms
);

module.exports = router;