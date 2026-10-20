const User = require("../models/User");
const Hospital = require("../models/Hospital");
const Doctor = require("../models/Doctor");
const Department = require("../models/Department");
const Appointment = require("../models/Appointment");
const EmergencyRequest = require("../models/EmergencyRequest");
const MedicalReport = require("../models/MedicalReport");
const Notification = require("../models/Notification");
const Ambulance = require("../models/Ambulance");
const Medicine = require("../models/Medicine");
const AuditLog = require("../models/AuditLog");
const emailService = require("../services/emailService");

// 1. Admin Dashboard Statistics with Real MongoDB Data
const getAdminDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
        const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

        const [
            totalUsers,
            totalPatients,
            totalHospitals,
            pendingHospitals,
            approvedHospitals,
            rejectedHospitals,
            totalDoctors,
            totalDepartments,
            totalAppointments,
            todayAppointments,
            emergencyRequests,
            medicalReports,
            unreadNotifications,
            totalAmbulances,
            totalMedicines,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: "patient" }),
            User.countDocuments({ role: "hospital" }),
            User.countDocuments({ role: "hospital", status: "Pending" }),
            User.countDocuments({ role: "hospital", status: "Approved" }),
            User.countDocuments({ role: "hospital", status: "Rejected" }),
            Doctor.countDocuments(),
            Department.countDocuments(),
            Appointment.countDocuments(),
            Appointment.countDocuments({
                appointmentDate: { $gte: startOfDay, $lte: endOfDay },
            }),
            EmergencyRequest.countDocuments(),
            MedicalReport.countDocuments(),
            Notification.countDocuments({ userId: req.user._id, isRead: false }),
            Ambulance.countDocuments(),
            Medicine.countDocuments(),
        ]);

        // User Growth (past 6 months)
        const userGrowth = [];
        const hospitalRegistrationTrend = [];
        for (let i = 5; i >= 0; i--) {
            const mStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
            const mEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 0, 23, 59, 59, 999));
            const label = mStart.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

            const [userCount, hospCount] = await Promise.all([
                User.countDocuments({ createdAt: { $gte: mStart, $lte: mEnd } }),
                User.countDocuments({ role: "hospital", createdAt: { $gte: mStart, $lte: mEnd } }),
            ]);

            userGrowth.push({ month: label, users: userCount });
            hospitalRegistrationTrend.push({ month: label, hospitals: hospCount });
        }

        // Appointment Trend (past 7 days)
        const appointmentTrend = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setUTCDate(now.getUTCDate() - i);
            const dStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
            const dEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
            const dayLabel = dStart.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });

            const count = await Appointment.countDocuments({
                appointmentDate: { $gte: dStart, $lte: dEnd },
            });

            appointmentTrend.push({
                date: dStart.toISOString().split("T")[0],
                day: dayLabel,
                appointments: count,
            });
        }

        // Emergency Trend by Status
        const emergencyBreakdown = {
            requested: await EmergencyRequest.countDocuments({ status: "Requested" }),
            assigned: await EmergencyRequest.countDocuments({ status: "Assigned" }),
            onTheWay: await EmergencyRequest.countDocuments({ status: "On The Way" }),
            arrived: await EmergencyRequest.countDocuments({ status: "Arrived" }),
            completed: await EmergencyRequest.countDocuments({ status: "Completed" }),
            cancelled: await EmergencyRequest.countDocuments({ status: "Cancelled" }),
        };

        // Department distribution
        const departments = await Department.find().select("departmentName").lean();
        const deptMap = {};
        for (const dept of departments) {
            deptMap[dept.departmentName] = (deptMap[dept.departmentName] || 0) + 1;
        }
        const departmentUsage = Object.entries(deptMap).map(([name, count]) => ({
            name,
            count,
        })).slice(0, 8);

        // Doctor activity (top doctors by appointment count)
        const topDoctors = await Doctor.find()
            .select("doctorName specialization")
            .limit(6)
            .lean();
        const doctorActivity = await Promise.all(
            topDoctors.map(async (doc) => {
                const count = await Appointment.countDocuments({ doctorId: doc._id });
                return {
                    name: doc.doctorName,
                    specialization: doc.specialization,
                    appointments: count,
                };
            })
        );

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalPatients,
                totalHospitals,
                pendingHospitals,
                approvedHospitals,
                rejectedHospitals,
                totalDoctors,
                totalDepartments,
                totalAppointments,
                todayAppointments,
                emergencyRequests,
                medicalReports,
                unreadNotifications,
                totalAmbulances,
                totalMedicines,
            },
            charts: {
                userGrowth,
                hospitalRegistrationTrend,
                appointmentTrend,
                emergencyBreakdown,
                departmentUsage,
                doctorActivity,
            },
        });
    } catch (error) {
        console.error("getAdminDashboardStats error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to load admin statistics.",
        });
    }
};

// 2. Hospital Approval Management: Get pending hospitals with full profile data
const getPendingHospitals = async (req, res) => {
    try {
        const users = await User.find({
            role: "hospital",
            status: "Pending",
        }).select("-password").lean();

        // Enforce full hospital profile attachments
        const pendingWithProfiles = await Promise.all(
            users.map(async (u) => {
                const hospital = await Hospital.findOne({ userId: u._id }).lean();
                return {
                    ...u,
                    hospitalProfile: hospital || null,
                };
            })
        );

        res.status(200).json({
            success: true,
            hospitals: pendingWithProfiles,
        });
    } catch (error) {
        console.error("getPendingHospitals error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to load pending hospitals.",
        });
    }
};

// Approve Hospital
const approveHospital = async (req, res) => {
    try {
        const user = await User.findOne({
            _id: req.params.id,
            role: "hospital",
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Hospital user not found.",
            });
        }

        user.isApproved = true;
        user.isVerified = true;
        user.status = "Approved";
        user.rejectionReason = "";
        user.approvedBy = req.user._id;
        user.approvalDate = new Date();

        await user.save();

        // Also ensure Hospital model profile is verified
        const hospital = await Hospital.findOne({ userId: user._id });

        // In-app Notification for the hospital
        await Notification.create({
            userId: user._id,
            title: "Hospital Registration Approved!",
            message: "Your hospital registration has been approved. You now have full access to the operations console.",
            type: "Hospital",
            relatedId: hospital ? hospital._id : user._id,
        });

        // Send Approval Email
        emailService.sendHospitalApprovalEmail(user).catch((e) =>
            console.error("Approval email error:", e.message)
        );

        // Audit Log
        await AuditLog.create({
            userId: req.user._id,
            userName: req.user.fullName,
            userRole: "admin",
            action: "Hospital Approved",
            details: `Approved hospital ${user.fullName} (${user.email})`,
            targetId: user._id,
            targetType: "Hospital",
        }).catch(() => {});

        res.status(200).json({
            success: true,
            message: "Hospital approved, email sent, and notification dispatched successfully.",
            hospital: user,
        });
    } catch (error) {
        console.error("approveHospital error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to approve hospital.",
        });
    }
};

// Reject / Cancel Hospital Approval
const rejectHospital = async (req, res) => {
    try {
        const { rejectionReason } = req.body;

        const user = await User.findOne({
            _id: req.params.id,
            role: "hospital",
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Hospital user not found.",
            });
        }

        const wasApproved = user.isApproved || user.status === "Approved";
        user.isApproved = false;
        user.status = "Rejected";
        user.rejectionReason =
            rejectionReason?.trim() ||
            (wasApproved
                ? "Hospital approval has been cancelled by administration."
                : "Submitted documentation could not be verified.");
        user.rejectedBy = req.user._id;
        user.rejectionDate = new Date();

        await user.save();

        const notifTitle = wasApproved
            ? "Hospital Approval Cancelled"
            : "Hospital Registration Rejected";
        const notifMessage = wasApproved
            ? `Your hospital approval status has been cancelled by administration. Reason: ${user.rejectionReason}`
            : `Your hospital registration was not approved. Reason: ${user.rejectionReason}`;

        // In-app Notification
        await Notification.create({
            userId: user._id,
            title: notifTitle,
            message: notifMessage,
            type: "Hospital",
            relatedId: user._id,
        });

        // Send Email: If it was approved, send the specific cancellation email; if pending, send rejection email
        if (wasApproved) {
            emailService.sendHospitalCancellationEmail(user, user.rejectionReason).catch((e) =>
                console.error("Cancellation email error:", e.message)
            );
        } else {
            emailService.sendHospitalRejectionEmail(user, user.rejectionReason).catch((e) =>
                console.error("Rejection email error:", e.message)
            );
        }

        // Audit Log
        await AuditLog.create({
            userId: req.user._id,
            userName: req.user.fullName,
            userRole: "admin",
            action: wasApproved ? "Hospital Approval Cancelled" : "Hospital Rejected",
            details: `${wasApproved ? "Cancelled approval for" : "Rejected"} hospital ${user.fullName} (${user.email}): ${user.rejectionReason}`,
            targetId: user._id,
            targetType: "Hospital",
        }).catch(() => {});

        res.status(200).json({
            success: true,
            message: wasApproved
                ? "Hospital approval has been cancelled. Cancellation notice and email dispatched."
                : "Hospital application rejected. Rejection notice and email dispatched.",
            hospital: user,
            wasApproved,
        });
    } catch (error) {
        console.error("rejectHospital error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to reject or cancel hospital approval.",
        });
    }
};

// 4. Admin Hospital Management: View all hospitals with doctor/department/appointment stats
const getAllHospitalsDetailed = async (req, res) => {
    try {
        const query = { role: "hospital" };
        if (req.query.status) query.status = req.query.status;

        if (req.query.search) {
            const s = new RegExp(req.query.search, "i");
            query.$or = [{ fullName: s }, { email: s }, { phone: s }];
        }

        const users = await User.find(query).select("-password").sort({ createdAt: -1 }).lean();

        const hospitals = await Promise.all(
            users.map(async (u) => {
                const profile = await Hospital.findOne({ userId: u._id }).lean();
                let doctorCount = 0;
                let departmentCount = 0;
                let appointmentCount = 0;

                if (profile) {
                    [doctorCount, departmentCount, appointmentCount] = await Promise.all([
                        Doctor.countDocuments({ hospitalId: profile._id }),
                        Department.countDocuments({ hospitalId: profile._id }),
                        Appointment.countDocuments({ hospitalId: profile._id }),
                    ]);
                }

                return {
                    ...u,
                    hospitalProfile: profile,
                    doctorCount,
                    departmentCount,
                    appointmentCount,
                };
            })
        );

        res.status(200).json({
            success: true,
            hospitals,
        });
    } catch (error) {
        console.error("getAllHospitalsDetailed error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch hospitals.",
        });
    }
};

// Update hospital profile or status by admin
const updateHospitalByAdmin = async (req, res) => {
    try {
        const { hospitalName, city, address, phone, emergencyAvailable, isActive, status } = req.body;

        const user = await User.findById(req.params.id);
        if (!user || user.role !== "hospital") {
            return res.status(404).json({ success: false, message: "Hospital not found." });
        }

        if (isActive !== undefined) user.isActive = Boolean(isActive);
        if (status) user.status = status;
        if (hospitalName) user.fullName = hospitalName.trim();
        if (phone) user.phone = phone.trim();
        await user.save();

        const hospital = await Hospital.findOne({ userId: user._id });
        if (hospital) {
            if (hospitalName) hospital.hospitalName = hospitalName.trim();
            if (city) hospital.city = city.trim();
            if (address) hospital.address = address.trim();
            if (phone) hospital.hospitalPhone = phone.trim();
            if (emergencyAvailable !== undefined) hospital.emergencyAvailable = Boolean(emergencyAvailable);
            await hospital.save();
        }

        // Audit Log
        await AuditLog.create({
            userId: req.user._id,
            userName: req.user.fullName,
            userRole: "admin",
            action: "Hospital Profile Updated by Admin",
            details: `Admin updated hospital ${user.fullName}`,
            targetId: user._id,
            targetType: "Hospital",
        }).catch(() => {});

        res.status(200).json({
            success: true,
            message: "Hospital updated successfully.",
            user,
            hospital,
        });
    } catch (error) {
        console.error("updateHospitalByAdmin error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update hospital.",
        });
    }
};

// 3. Admin User Management: View all users, search, filter role/status
const getAllUsers = async (req, res) => {
    try {
        const query = {};
        if (req.query.role) query.role = req.query.role;
        if (req.query.status) query.status = req.query.status;
        if (req.query.isActive !== undefined) {
            query.isActive = req.query.isActive === "true" ? { $ne: false } : false;
        }

        if (req.query.search) {
            const s = new RegExp(req.query.search, "i");
            query.$or = [{ fullName: s }, { email: s }, { phone: s }];
        }

        const users = await User.find(query).select("-password").sort({ createdAt: -1 }).lean();

        res.status(200).json({
            success: true,
            users,
        });
    } catch (error) {
        console.error("getAllUsers error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch users.",
        });
    }
};

// Toggle user activation / status
const updateUserStatus = async (req, res) => {
    try {
        const { isActive, status } = req.body;

        const user = await User.findById(req.params.id).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        if (String(user._id) === String(req.user._id)) {
            return res.status(400).json({ success: false, message: "You cannot deactivate your own admin account." });
        }

        if (typeof isActive === "boolean") user.isActive = isActive;
        if (status) user.status = status;

        await user.save();

        // Audit Log
        await AuditLog.create({
            userId: req.user._id,
            userName: req.user.fullName,
            userRole: "admin",
            action: "User Status Changed",
            details: `User ${user.email} status updated: isActive=${user.isActive}, status=${user.status}`,
            targetId: user._id,
            targetType: "User",
        }).catch(() => {});

        res.status(200).json({
            success: true,
            message: "User status updated successfully.",
            user,
        });
    } catch (error) {
        console.error("updateUserStatus error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update user status.",
        });
    }
};

// 12. Admin Analytics with Deep Insights
const getAdminAnalytics = async (req, res) => {
    try {
        const now = new Date();

        // Daily appointments over 14 days
        const dailyAppointments = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date(now);
            d.setUTCDate(now.getUTCDate() - i);
            const dStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
            const dEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
            const label = dStart.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

            const count = await Appointment.countDocuments({
                appointmentDate: { $gte: dStart, $lte: dEnd },
            });
            dailyAppointments.push({ date: label, count });
        }

        // Monthly appointments over 12 months
        const monthlyAppointments = [];
        for (let i = 11; i >= 0; i--) {
            const mStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
            const mEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 0, 23, 59, 59, 999));
            const label = mStart.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

            const count = await Appointment.countDocuments({
                appointmentDate: { $gte: mStart, $lte: mEnd },
            });
            monthlyAppointments.push({ month: label, count });
        }

        // Hospital performance metrics
        const hospitals = await Hospital.find().select("hospitalName rating city").lean();
        const hospitalPerformance = await Promise.all(
            hospitals.map(async (h) => {
                const [appointmentsCount, doctorCount, completedCount] = await Promise.all([
                    Appointment.countDocuments({ hospitalId: h._id }),
                    Doctor.countDocuments({ hospitalId: h._id }),
                    Appointment.countDocuments({ hospitalId: h._id, status: "Completed" }),
                ]);
                return {
                    name: h.hospitalName,
                    city: h.city,
                    rating: h.rating || 0,
                    doctors: doctorCount,
                    totalAppointments: appointmentsCount,
                    completedAppointments: completedCount,
                };
            })
        );

        // Emergency breakdown
        const emergencyBreakdown = [
            { status: "Requested", count: await EmergencyRequest.countDocuments({ status: "Requested" }) },
            { status: "Assigned", count: await EmergencyRequest.countDocuments({ status: "Assigned" }) },
            { status: "On The Way", count: await EmergencyRequest.countDocuments({ status: "On The Way" }) },
            { status: "Arrived", count: await EmergencyRequest.countDocuments({ status: "Arrived" }) },
            { status: "Completed", count: await EmergencyRequest.countDocuments({ status: "Completed" }) },
            { status: "Cancelled", count: await EmergencyRequest.countDocuments({ status: "Cancelled" }) },
        ];

        res.status(200).json({
            success: true,
            analytics: {
                dailyAppointments,
                monthlyAppointments,
                hospitalPerformance,
                emergencyBreakdown,
            },
        });
    } catch (error) {
        console.error("getAdminAnalytics error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to load analytics.",
        });
    }
};

// 13. Admin System Report Generation: Appointments, Hospitals, Doctors, Departments, Users, Emergencies, Reports
const getAdminReportsData = async (req, res) => {
    try {
        const { reportType, startDate, endDate, status } = req.query;

        let dateQuery = {};
        if (startDate && endDate) {
            dateQuery = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate + "T23:59:59.999Z"),
                },
            };
        }

        let data = [];
        let summary = {};

        switch (reportType) {
            case "appointments": {
                const q = { ...dateQuery };
                if (status) q.status = status;
                if (startDate && endDate) {
                    q.appointmentDate = {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate + "T23:59:59.999Z"),
                    };
                    delete q.createdAt;
                }
                data = await Appointment.find(q)
                    .populate("patientId", "fullName email phone")
                    .populate("hospitalId", "hospitalName city")
                    .populate("doctorId", "doctorName specialization")
                    .populate("departmentId", "departmentName")
                    .sort({ appointmentDate: -1 })
                    .lean();

                summary = {
                    total: data.length,
                    confirmed: data.filter((a) => a.status === "Confirmed").length,
                    completed: data.filter((a) => a.status === "Completed").length,
                    cancelled: data.filter((a) => a.status === "Cancelled").length,
                    pending: data.filter((a) => a.status === "Pending").length,
                };
                break;
            }

            case "hospitals": {
                const q = { role: "hospital", ...dateQuery };
                if (status) q.status = status;
                data = await User.find(q).select("-password").lean();
                summary = {
                    total: data.length,
                    approved: data.filter((h) => h.status === "Approved").length,
                    pending: data.filter((h) => h.status === "Pending").length,
                    rejected: data.filter((h) => h.status === "Rejected").length,
                };
                break;
            }

            case "doctors": {
                data = await Doctor.find(dateQuery)
                    .populate("hospitalId", "hospitalName city")
                    .populate("departmentId", "departmentName")
                    .lean();
                summary = {
                    total: data.length,
                    averageFee: data.length
                        ? (data.reduce((acc, d) => acc + (d.consultationFee || 0), 0) / data.length).toFixed(0)
                        : 0,
                };
                break;
            }

            case "departments": {
                data = await Department.find(dateQuery)
                    .populate("hospitalId", "hospitalName city")
                    .lean();
                summary = { total: data.length };
                break;
            }

            case "emergencies": {
                const q = { ...dateQuery };
                if (status) q.status = status;
                data = await EmergencyRequest.find(q)
                    .populate("patientId", "fullName email phone")
                    .populate("hospitalId", "hospitalName city")
                    .populate("ambulanceId", "ambulanceNumber driverName driverPhone")
                    .sort({ createdAt: -1 })
                    .lean();
                summary = {
                    total: data.length,
                    completed: data.filter((e) => e.status === "Completed").length,
                    cancelled: data.filter((e) => e.status === "Cancelled").length,
                    active: data.filter((e) => ["Requested", "Assigned", "On The Way", "Arrived"].includes(e.status)).length,
                };
                break;
            }

            case "reports": {
                data = await MedicalReport.find(dateQuery)
                    .populate("patientId", "fullName email")
                    .populate("hospitalId", "hospitalName city")
                    .sort({ createdAt: -1 })
                    .lean();
                summary = {
                    total: data.length,
                    patientUploaded: data.filter((r) => r.uploadedBy === "Patient").length,
                    hospitalUploaded: data.filter((r) => r.uploadedBy === "Hospital").length,
                };
                break;
            }

            case "users":
            default: {
                const q = { ...dateQuery };
                if (status) q.status = status;
                data = await User.find(q).select("-password").sort({ createdAt: -1 }).lean();
                summary = {
                    total: data.length,
                    patients: data.filter((u) => u.role === "patient").length,
                    hospitals: data.filter((u) => u.role === "hospital").length,
                    admins: data.filter((u) => u.role === "admin").length,
                };
                break;
            }
        }

        res.status(200).json({
            success: true,
            reportType: reportType || "users",
            summary,
            records: data,
        });
    } catch (error) {
        console.error("getAdminReportsData error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to generate report.",
        });
    }
};

// 15. Audit Logs
const getAuditLogs = async (req, res) => {
    try {
        const query = {};
        if (req.query.action) query.action = req.query.action;
        if (req.query.targetType) query.targetType = req.query.targetType;

        const logs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        res.status(200).json({
            success: true,
            logs,
        });
    } catch (error) {
        console.error("getAuditLogs error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch audit logs.",
        });
    }
};

module.exports = {
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
};