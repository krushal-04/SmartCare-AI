const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const {
    protect,
    patientOnly,
    adminOnly,
    hospitalOrAdmin,
    doctorOrHospitalOrAdmin,
} = require("../middleware/protect");

// Patient Online Payment Flow
router.post("/create-order", protect, patientOnly, paymentController.createOrder);
router.post("/verify-payment", protect, patientOnly, paymentController.verifyPayment);
router.post("/handle-failure", protect, paymentController.handleFailure);

// Refund Preview & Cancellation
router.get("/refund-preview/:appointmentId", protect, paymentController.getRefundPreview);
router.post("/cancel-and-refund/:appointmentId", protect, paymentController.cancelAndRefund);

// Role-based Payment History & Management
router.get("/patient-history", protect, patientOnly, paymentController.getPatientPaymentHistory);
router.get("/doctor-summary", protect, doctorOrHospitalOrAdmin, paymentController.getDoctorPaymentSummary);
router.get("/hospital-summary", protect, hospitalOrAdmin, paymentController.getHospitalPaymentSummary);
router.get("/admin-overview", protect, adminOnly, paymentController.getAdminPaymentOverview);

// Razorpay Webhook (public with signature verification)
router.post("/webhook", paymentController.handleWebhook);

// Cancellation Policy
router.get("/policy", paymentController.getCancellationPolicy);
router.put("/policy", protect, adminOnly, paymentController.updateCancellationPolicy);

module.exports = router;

