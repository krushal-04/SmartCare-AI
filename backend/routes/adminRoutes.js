const express = require("express");
const router = express.Router();

const {
    protect,
    adminOnly,
} = require("../middleware/protect");

const {
    getAdminDashboardStats,
    getPendingHospitals,
    approveHospital,
    rejectHospital,
    getAllHospitalsDetailed,
    updateHospitalByAdmin,
    getAllUsers,
    updateUserStatus,
    getAdminAnalytics,
    getAdminReportsData,
    getAuditLogs,
} = require("../controllers/adminController");

// All admin routes require valid JWT and admin role
router.use(protect, adminOnly);

// Dashboard
router.get("/dashboard-stats", getAdminDashboardStats);

// Hospital Approvals & Management
router.get("/pending-hospitals", getPendingHospitals);
router.put("/approve/:id", approveHospital);
router.put("/reject/:id", rejectHospital);
router.put("/cancel/:id", rejectHospital);
router.get("/all-hospitals", getAllHospitalsDetailed);
router.get("/hospitals", getAllHospitalsDetailed);
router.put("/hospital/:id", updateHospitalByAdmin);

// User Management
router.get("/users", getAllUsers);
router.put("/user/:id/status", updateUserStatus);

// Analytics & Reports
router.get("/analytics", getAdminAnalytics);
router.get("/reports", getAdminReportsData);

// Audit Logs
router.get("/audit-logs", getAuditLogs);

module.exports = router;