const express = require("express");

const router = express.Router();

const {
    protect,
    patientOnly,
} = require("../middleware/protect");

const {
    chatWithGemini,
    analyzeSymptoms,
    analyzeMedicalReport,
} = require("../controllers/aiController");
const multer = require("multer");
const reportAnalysisUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
        cb(null, allowed.includes(file.mimetype));
    },
});

router.post(
    "/chat",
    protect,
    patientOnly,
    chatWithGemini
);

router.post(
    "/report-analysis",
    protect,
    patientOnly,
    reportAnalysisUpload.single("report"),
    analyzeMedicalReport
);

router.post(
    "/symptoms",
    protect,
    patientOnly,
    analyzeSymptoms
);

module.exports = router;
