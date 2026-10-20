const express = require("express");
const router = express.Router();

const {
    protect,
    patientOnly,
    hospitalOnly,
    adminOnly,
} = require("../middleware/protect");

const reportUpload = require("../middleware/reportUpload");

const {
    uploadReport,
    hospitalUploadReport,
    getMyReports,
    getHospitalReports,
    adminGetAllReports,
    downloadReport,
    deleteReport,
} = require("../controllers/medicalReportController");

// Middleware supporting either "reportFile" or "report" field names
const handleReportUpload = (req, res, next) => {
    reportUpload.fields([
        { name: "reportFile", maxCount: 1 },
        { name: "report", maxCount: 1 }
    ])(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || "File upload failed.",
            });
        }
        if (req.files) {
            req.file = (req.files["reportFile"] && req.files["reportFile"][0]) ||
                       (req.files["report"] && req.files["report"][0]) ||
                       null;
        }
        next();
    });
};

// Patient upload (supports both /upload and root /)
router.post(
    "/upload",
    protect,
    patientOnly,
    handleReportUpload,
    uploadReport
);

router.post(
    "/",
    protect,
    patientOnly,
    handleReportUpload,
    uploadReport
);

// Hospital upload for patient
router.post(
    "/hospital/upload",
    protect,
    hospitalOnly,
    handleReportUpload,
    hospitalUploadReport
);

// Patient own reports
router.get("/my", protect, patientOnly, getMyReports);

// Hospital reports
router.get("/hospital", protect, hospitalOnly, getHospitalReports);

// Admin all reports metadata
router.get("/admin/all", protect, adminOnly, adminGetAllReports);

// Universal download & aliases
router.get("/:id/download", protect, downloadReport);
router.get("/:id/file", protect, downloadReport);
router.delete("/:id", protect, deleteReport);

module.exports = router;