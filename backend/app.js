const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const hospitalRoutes=require("./routes/hospitalRoutes");
const adminRoutes = require("./routes/adminRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const patientRoutes =require("./routes/patientRoutes");
const appointmentRoutes =require("./routes/appointmentRoutes");
const medicalReportRoutes =require("./routes/medicalReportRoutes");
const emergencyRoutes =require("./routes/emergencyRoutes");
const notificationRoutes =require("./routes/notificationRoutes");
const aiRoutes =require("./routes/aiRoutes");
const reviewRoutes =require("./routes/reviewRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const ambulanceRoutes = require("./routes/ambulanceRoutes");
const medicineRoutes = require("./routes/medicineRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to SmartCare AI"
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "SmartCare AI Backend is Running"
    });
});




app.use("/api/auth", authRoutes);
app.use("/api/hospital", hospitalRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/department", departmentRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/appointment", appointmentRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/reports", medicalReportRoutes);
app.use("/api/medical-reports", medicalReportRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/emergencies", emergencyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/ambulance", ambulanceRoutes);
app.use("/api/ambulances", ambulanceRoutes);
app.use("/api/medicine", medicineRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/upload", uploadRoutes);

module.exports = app;