const fs = require("fs");
const path = require("path");

const MedicalReport = require("../models/MedicalReport");
const Notification = require("../models/Notification");
const Hospital = require("../models/Hospital");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const emailService = require("../services/emailService");

// Patient uploads own report
exports.uploadReport = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a report file (PDF, JPG, or PNG).",
            });
        }

        const report = await MedicalReport.create({
            patientId: req.user._id,
            hospitalId: req.body.hospitalId || undefined,
            appointmentId: req.body.appointmentId || undefined,
            reportType: req.body.reportType || "Other",
            originalName: req.file.originalname,
            storedName: req.file.filename,
            mimeType: req.file.mimetype,
            size: req.file.size,
            filePath: req.file.path,
            notes: req.body.notes?.trim() || "",
            uploadedBy: "Patient",
        });

        await Notification.create({
            userId: req.user._id,
            title: "Medical Report Uploaded",
            message: `Your medical report "${req.file.originalname}" has been stored securely.`,
            type: "Report",
            relatedId: report._id,
        });

        res.status(201).json({
            success: true,
            message: "Medical report uploaded successfully.",
            report,
        });
    } catch (error) {
        console.error("uploadReport error:", error);
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: error.message || "Unable to upload medical report.",
        });
    }
};

// Hospital uploads report for a patient
exports.hospitalUploadReport = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a report file (PDF, JPG, or PNG).",
            });
        }

        const hospital = await Hospital.findOne({ userId: req.user._id });
        if (!hospital) {
            if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(404).json({
                success: false,
                message: "Hospital profile not found.",
            });
        }

        const { patientId, appointmentId, reportType, notes } = req.body;

        if (!patientId) {
            if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: "Patient ID is required.",
            });
        }

        // Verify patient exists
        const patient = await User.findById(patientId);
        if (!patient) {
            if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(404).json({
                success: false,
                message: "Patient record not found.",
            });
        }

        // Security check: Verify patient has an appointment or record with this hospital
        const hasAppointment = await Appointment.findOne({
            hospitalId: hospital._id,
            patientId,
        });

        if (!hasAppointment && req.user.role !== "admin") {
            if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(403).json({
                success: false,
                message: "Unauthorized: This patient has no appointment record with your hospital.",
            });
        }

        const report = await MedicalReport.create({
            patientId,
            hospitalId: hospital._id,
            appointmentId: appointmentId || undefined,
            reportType: reportType || "Other",
            originalName: req.file.originalname,
            storedName: req.file.filename,
            mimeType: req.file.mimetype,
            size: req.file.size,
            filePath: req.file.path,
            notes: notes?.trim() || "",
            uploadedBy: "Hospital",
        });

        // Notify patient in-app
        await Notification.create({
            userId: patientId,
            title: `New Medical Report from ${hospital.hospitalName}`,
            message: `${hospital.hospitalName} has uploaded a new ${report.reportType} report for you.`,
            type: "Report",
            relatedId: report._id,
        });

        // Send email to patient
        if (patient.email) {
            emailService.sendEmail({
                to: patient.email,
                subject: `SmartCare AI - New Medical Report Uploaded by ${hospital.hospitalName}`,
                text: `Dear ${patient.fullName},\n\n${hospital.hospitalName} has uploaded a new medical report (${report.reportType}) to your account.\nYou can view and download it securely from your Patient Reports dashboard.\n\nBest regards,\nSmartCare AI Team`,
            }).catch(() => {});
        }

        // Audit Log
        await AuditLog.create({
            userId: req.user._id,
            userName: hospital.hospitalName,
            userRole: "hospital",
            action: "Medical Report Uploaded",
            details: `Uploaded ${report.reportType} report for patient ${patient.fullName}`,
            targetId: report._id,
            targetType: "Report",
        }).catch(() => {});

        res.status(201).json({
            success: true,
            message: "Medical report uploaded and patient notified successfully.",
            report,
        });
    } catch (error) {
        console.error("hospitalUploadReport error:", error);
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: error.message || "Failed to upload report.",
        });
    }
};

// Patient: Get own reports
exports.getMyReports = async (req, res) => {
    try {
        const reports = await MedicalReport.find({
            patientId: req.user._id,
        })
            .sort({ createdAt: -1 })
            .populate("hospitalId", "hospitalName city")
            .populate("appointmentId", "appointmentDate appointmentTime")
            .lean();

        res.status(200).json({
            success: true,
            reports,
        });
    } catch (error) {
        console.error("getMyReports error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load reports.",
        });
    }
};

// Hospital: Get reports for this hospital
exports.getHospitalReports = async (req, res) => {
    try {
        let hospital = await Hospital.findOne({ userId: req.user._id });
        if (!hospital) {
            hospital = await Hospital.findOne({ hospitalEmail: req.user.email });
        }
        if (!hospital) {
            return res.status(200).json({
                success: true,
                reports: [],
            });
        }

        const reports = await MedicalReport.find({ hospitalId: hospital._id })
            .populate("patientId", "fullName email phone")
            .populate("appointmentId", "appointmentDate appointmentTime")
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            reports,
        });
    } catch (error) {
        console.error("getHospitalReports error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load hospital reports.",
        });
    }
};

// Admin: View all system report metadata (strictly authorized)
exports.adminGetAllReports = async (req, res) => {
    try {
        const query = {};
        if (req.query.reportType) query.reportType = req.query.reportType;
        if (req.query.hospitalId) query.hospitalId = req.query.hospitalId;

        const reports = await MedicalReport.find(query)
            .populate("patientId", "fullName email phone")
            .populate("hospitalId", "hospitalName city")
            .populate("appointmentId", "appointmentDate appointmentTime")
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            reports,
        });
    } catch (error) {
        console.error("adminGetAllReports error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load reports list.",
        });
    }
};

// Universal Download: checks authorization
exports.downloadReport = async (req, res) => {
    try {
        const report = await MedicalReport.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found.",
            });
        }

        // Privacy authorization check
        const isOwner = String(report.patientId) === String(req.user._id);
        const isAdmin = req.user.role === "admin";
        let isHospitalAuthorized = false;

        if (req.user.role === "hospital" && report.hospitalId) {
            const hospital = await Hospital.findOne({ userId: req.user._id });
            if (hospital && String(hospital._id) === String(report.hospitalId)) {
                isHospitalAuthorized = true;
            }
        }

        if (!isOwner && !isAdmin && !isHospitalAuthorized) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: You do not have permission to access this medical report.",
            });
        }

        if (!fs.existsSync(report.filePath)) {
            return res.status(404).json({
                success: false,
                message: "Report file no longer exists on server storage.",
            });
        }

        res.download(path.resolve(report.filePath), report.originalName);
    } catch (error) {
        console.error("downloadReport error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to download report.",
        });
    }
};

// Delete report: Owner patient, uploader hospital, or admin
exports.deleteReport = async (req, res) => {
    try {
        const report = await MedicalReport.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found.",
            });
        }

        const isOwner = String(report.patientId) === String(req.user._id);
        const isAdmin = req.user.role === "admin";
        let isHospitalUploader = false;

        if (req.user.role === "hospital" && report.hospitalId) {
            const hospital = await Hospital.findOne({ userId: req.user._id });
            if (hospital && String(hospital._id) === String(report.hospitalId) && report.uploadedBy === "Hospital") {
                isHospitalUploader = true;
            }
        }

        if (!isOwner && !isAdmin && !isHospitalUploader) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: You do not have permission to delete this report.",
            });
        }

        if (report.filePath && fs.existsSync(report.filePath)) {
            fs.unlinkSync(report.filePath);
        }

        await report.deleteOne();

        res.status(200).json({
            success: true,
            message: "Report deleted successfully.",
        });
    } catch (error) {
        console.error("deleteReport error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to delete report.",
        });
    }
};