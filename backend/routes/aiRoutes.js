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
        cb(allowed.includes(file.mimetype) ? null : new Error("Only PDF, JPG, and PNG files are supported."), allowed.includes(file.mimetype));
    },
});

const handleReportAnalysisUpload = (req, res, next) => {
    reportAnalysisUpload.single("report")(req, res, (error) => {
        if (!error) return next();
        const message = error.code === "LIMIT_FILE_SIZE"
            ? "The report must be 10 MB or smaller."
            : error.message || "Unable to upload this report.";
        return res.status(400).json({ success: false, message });
    });
};

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
    handleReportAnalysisUpload,
    analyzeMedicalReport
);

router.post(
    "/symptoms",
    protect,
    patientOnly,
    analyzeSymptoms
);

module.exports = router;
