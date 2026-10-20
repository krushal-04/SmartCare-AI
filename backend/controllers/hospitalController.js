const Hospital = require("../models/Hospital");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Department = require("../models/Department");
const Appointment = require("../models/Appointment");
const EmergencyRequest = require("../models/EmergencyRequest");
const MedicalReport = require("../models/MedicalReport");
const Notification = require("../models/Notification");
const Review = require("../models/Review");

// Create initial hospital profile
const addHospital = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const hospitalExists = await Hospital.findOne({ userId: req.user._id });
        if (hospitalExists) {
            return res.status(400).json({
                success: false,
                message: "Hospital profile already exists.",
            });
        }

        const hospitalImages = req.files?.map((file) => file.path) || [];

        let facilities = [];
        if (req.body.facilities) {
            try {
                facilities = typeof req.body.facilities === "string"
                    ? JSON.parse(req.body.facilities)
                    : req.body.facilities;
            } catch (error) {
                facilities = String(req.body.facilities).split(",").map((s) => s.trim()).filter(Boolean);
            }
        }

        const hospital = await Hospital.create({
            userId: req.user._id,
            hospitalName: req.body.hospitalName,
            hospitalEmail: req.user.email,
            hospitalPhone: req.user.phone,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            pincode: req.body.pincode,
            description: req.body.description || "",
            facilities,
            hospitalImages,
            latitude: req.body.latitude ? Number(req.body.latitude) : undefined,
            longitude: req.body.longitude ? Number(req.body.longitude) : undefined,
            emergencyAvailable: req.body.emergencyAvailable === true || req.body.emergencyAvailable === "true",
        });

        return res.status(201).json({
            success: true,
            message: "Hospital profile created successfully.",
            hospital,
        });
    } catch (error) {
        console.error("ADD HOSPITAL ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create hospital profile.",
        });
    }
};

// Get all hospitals (Public)
const getHospitals = async (req, res) => {
    try {
        const query = {};
        if (req.query.city) {
            query.city = new RegExp(req.query.city, "i");
        }
        if (req.query.emergencyAvailable !== undefined) {
            query.emergencyAvailable = req.query.emergencyAvailable === "true";
        }

        const hospitals = await Hospital.find(query).select("-__v").lean();

        // Attach doctor & department counts
        const enriched = await Promise.all(
            hospitals.map(async (h) => {
                const doctorCount = await Doctor.countDocuments({ hospitalId: h._id });
                const departmentCount = await Department.countDocuments({ hospitalId: h._id });
                return { ...h, doctorCount, departmentCount };
            })
        );

        return res.status(200).json({
            success: true,
            hospitals: enriched,
        });
    } catch (error) {
        console.error("GET HOSPITALS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch hospitals.",
        });
    }
};

// Get single hospital by ID (Public)
const getHospitalById = async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.params.id).select("-__v").lean();
        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: "Hospital not found.",
            });
        }

        const doctorCount = await Doctor.countDocuments({ hospitalId: hospital._id });
        const departmentCount = await Department.countDocuments({ hospitalId: hospital._id });

        return res.status(200).json({
            success: true,
            hospital: { ...hospital, doctorCount, departmentCount },
        });
    } catch (error) {
        console.error("GET HOSPITAL BY ID ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch hospital.",
        });
    }
};

// Get my hospital profile (Hospital only)
const getMyHospital = async (req, res) => {
    try {
        let hospital = await Hospital.findOne({ userId: req.user._id }).select("-__v");

        if (!hospital) {
            // Auto-create initial profile shell if user has hospital role
            hospital = await Hospital.create({
                userId: req.user._id,
                hospitalName: req.user.fullName || "Hospital Center",
                hospitalEmail: req.user.email,
                hospitalPhone: req.user.phone || "0000000000",
                address: "Hospital Address Pending Update",
                city: "City",
                state: "State",
                pincode: "000000",
                description: "Hospital overview",
                facilities: ["Emergency Care", "OPD", "Pharmacy"],
                emergencyAvailable: true,
            });
        }

        const user = await User.findById(req.user._id).select("fullName email phone role status isApproved isVerified rejectionReason");

        return res.status(200).json({
            success: true,
            hospital,
            user,
        });
    } catch (error) {
        console.error("GET MY HOSPITAL ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to load hospital profile.",
        });
    }
};

// Update my hospital profile (Hospital only)
const updateHospital = async (req, res) => {
    try {
        const {
            hospitalName,
            hospitalEmail,
            hospitalPhone,
            address,
            city,
            state,
            pincode,
            description,
            facilities,
            emergencyAvailable,
            latitude,
            longitude,
            hospitalImages,
        } = req.body;

        const updateData = {};
        if (hospitalName) updateData.hospitalName = hospitalName.trim();
        if (hospitalEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(hospitalEmail)) {
                return res.status(400).json({ success: false, message: "Invalid hospital email format." });
            }
            updateData.hospitalEmail = hospitalEmail.trim().toLowerCase();
        }
        if (hospitalPhone) {
            if (hospitalPhone.trim().length < 7) {
                return res.status(400).json({ success: false, message: "Invalid phone number." });
            }
            updateData.hospitalPhone = hospitalPhone.trim();
        }
        if (address) updateData.address = address.trim();
        if (city) updateData.city = city.trim();
        if (state) updateData.state = state.trim();
        if (pincode) updateData.pincode = pincode.trim();
        if (description !== undefined) updateData.description = description.trim();
        if (facilities !== undefined) {
            updateData.facilities = Array.isArray(facilities)
                ? facilities
                : typeof facilities === "string"
                ? facilities.split(",").map((s) => s.trim()).filter(Boolean)
                : [];
        }
        if (emergencyAvailable !== undefined) {
            updateData.emergencyAvailable = emergencyAvailable === true || emergencyAvailable === "true";
        }
        if (latitude !== undefined && latitude !== "") {
            const lat = Number(latitude);
            if (isNaN(lat) || lat < -90 || lat > 90) {
                return res.status(400).json({ success: false, message: "Latitude must be between -90 and 90." });
            }
            updateData.latitude = lat;
        }
        if (longitude !== undefined && longitude !== "") {
            const lng = Number(longitude);
            if (isNaN(lng) || lng < -180 || lng > 180) {
                return res.status(400).json({ success: false, message: "Longitude must be between -180 and 180." });
            }
            updateData.longitude = lng;
        }
        let newUploadedImages = [];
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            newUploadedImages = req.files.map((f) => f.path || f.secure_url);
        }

        if (newUploadedImages.length > 0) {
            if (Array.isArray(hospitalImages)) {
                updateData.hospitalImages = [...hospitalImages, ...newUploadedImages];
            } else if (typeof hospitalImages === "string") {
                try {
                    const parsed = JSON.parse(hospitalImages);
                    updateData.hospitalImages = Array.isArray(parsed) ? [...parsed, ...newUploadedImages] : newUploadedImages;
                } catch {
                    updateData.hospitalImages = newUploadedImages;
                }
            } else {
                updateData.hospitalImages = newUploadedImages;
            }
        } else if (hospitalImages !== undefined) {
            if (Array.isArray(hospitalImages)) {
                updateData.hospitalImages = hospitalImages;
            } else if (typeof hospitalImages === "string") {
                try {
                    updateData.hospitalImages = JSON.parse(hospitalImages);
                } catch {
                    updateData.hospitalImages = hospitalImages.split(",").map((s) => s.trim()).filter(Boolean);
                }
            }
        }

        const hospital = await Hospital.findOneAndUpdate(
            { userId: req.user._id },
            updateData,
            { new: true, runValidators: true }
        );

        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: "Hospital profile not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Hospital profile updated successfully.",
            hospital,
        });
    } catch (error) {
        console.error("UPDATE HOSPITAL ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update hospital profile.",
        });
    }
};

// Real MongoDB Dashboard statistics for hospital
const getHospitalDashboardStats = async (req, res) => {
    try {
        let hospital = await Hospital.findOne({ userId: req.user._id });
        if (!hospital) {
            hospital = await Hospital.findOne({ hospitalEmail: req.user.email });
        }
        if (!hospital) {
            hospital = await Hospital.create({
                userId: req.user._id,
                hospitalName: req.user.fullName || "Hospital Center",
                hospitalEmail: req.user.email,
                hospitalPhone: req.user.phone || "0000000000",
                address: "Hospital Address Pending Update",
                city: "City",
                state: "State",
                pincode: "000000",
                description: "Hospital overview",
                facilities: ["Emergency Care", "OPD", "Pharmacy"],
                emergencyAvailable: true,
            });
        }

        const hospitalId = hospital._id;

        // Date calculations (UTC safe)
        const now = new Date();
        const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
        const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

        // Real counts
        const [
            totalDoctors,
            totalDepartments,
            totalAppointments,
            todayAppointments,
            upcomingAppointments,
            patientIds,
            emergencyRequests,
            medicalReports,
            unreadNotifications,
        ] = await Promise.all([
            Doctor.countDocuments({ hospitalId }),
            Department.countDocuments({ hospitalId }),
            Appointment.countDocuments({ hospitalId }),
            Appointment.countDocuments({
                hospitalId,
                appointmentDate: { $gte: startOfDay, $lte: endOfDay },
            }),
            Appointment.countDocuments({
                hospitalId,
                appointmentDate: { $gte: startOfDay },
                status: { $in: ["Pending", "Confirmed"] },
            }),
            Appointment.distinct("patientId", { hospitalId }),
            EmergencyRequest.countDocuments({ hospitalId }),
            MedicalReport.countDocuments({ hospitalId }),
            Notification.countDocuments({ userId: req.user._id, isRead: false }),
        ]);

        const totalPatients = patientIds.length;

        // Daily appointments trend for the last 7 days
        const dailyAppointments = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setUTCDate(now.getUTCDate() - i);
            const dayStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
            const dayEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
            const dayName = dayStart.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
            const dateStr = dayStart.toISOString().split("T")[0];

            const count = await Appointment.countDocuments({
                hospitalId,
                appointmentDate: { $gte: dayStart, $lte: dayEnd },
            });

            dailyAppointments.push({
                date: dateStr,
                label: dayName,
                count,
            });
        }

        // Monthly trends for past 6 months
        const monthlyTrends = [];
        for (let i = 5; i >= 0; i--) {
            const mDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
            const mEnd = new Date(Date.UTC(mDate.getUTCFullYear(), mDate.getUTCMonth() + 1, 0, 23, 59, 59, 999));
            const monthLabel = mDate.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

            const count = await Appointment.countDocuments({
                hospitalId,
                appointmentDate: { $gte: mDate, $lte: mEnd },
            });

            monthlyTrends.push({
                month: monthLabel,
                count,
            });
        }

        // Department usage (Appointment counts per department)
        const departments = await Department.find({ hospitalId }).select("_id departmentName").lean();
        const departmentUsage = await Promise.all(
            departments.map(async (dept) => {
                const count = await Appointment.countDocuments({ hospitalId, departmentId: dept._id });
                return {
                    name: dept.departmentName,
                    count,
                };
            })
        );

        // Doctor activity
        const doctors = await Doctor.find({ hospitalId }).select("_id doctorName specialization").limit(8).lean();
        const doctorActivity = await Promise.all(
            doctors.map(async (doc) => {
                const count = await Appointment.countDocuments({ doctorId: doc._id });
                return {
                    name: doc.doctorName,
                    specialization: doc.specialization,
                    count,
                };
            })
        );

        // Emergency status breakdown
        const emergencyBreakdown = {
            requested: await EmergencyRequest.countDocuments({ hospitalId, status: "Requested" }),
            assigned: await EmergencyRequest.countDocuments({ hospitalId, status: "Assigned" }),
            onTheWay: await EmergencyRequest.countDocuments({ hospitalId, status: "On The Way" }),
            arrived: await EmergencyRequest.countDocuments({ hospitalId, status: "Arrived" }),
            completed: await EmergencyRequest.countDocuments({ hospitalId, status: "Completed" }),
            cancelled: await EmergencyRequest.countDocuments({ hospitalId, status: "Cancelled" }),
        };

        // Verification & approval details
        const hospitalUser = await User.findById(req.user._id).select("isApproved isVerified status");

        return res.status(200).json({
            success: true,
            stats: {
                hospitalName: hospital.hospitalName,
                approvalStatus: hospitalUser?.status || "Pending",
                isApproved: hospitalUser?.isApproved || false,
                isVerified: hospitalUser?.isVerified || false,
                totalDoctors,
                totalDepartments,
                totalAppointments,
                todayAppointments,
                upcomingAppointments,
                totalPatients,
                emergencyRequests,
                medicalReports,
                unreadNotifications,
            },
            charts: {
                dailyAppointments,
                monthlyTrends,
                departmentUsage,
                doctorActivity,
                emergencyBreakdown,
            },
        });
    } catch (error) {
        console.error("GET HOSPITAL DASHBOARD STATS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to load hospital dashboard statistics.",
        });
    }
};

// Hospital Patient Management: view patients who have appointments with this hospital
const getHospitalPatients = async (req, res) => {
    try {
        let hospital = await Hospital.findOne({ userId: req.user._id });
        if (!hospital) {
            hospital = await Hospital.findOne({ hospitalEmail: req.user.email });
        }
        if (!hospital) {
            return res.status(200).json({
                success: true,
                patients: [],
            });
        }

        const hospitalId = hospital._id;

        // Distinct patient IDs who have appointments with this hospital
        const patientIds = await Appointment.distinct("patientId", { hospitalId });

        if (!patientIds.length) {
            return res.status(200).json({
                success: true,
                patients: [],
            });
        }

        // Fetch patient records (without password)
        const patients = await User.find({ _id: { $in: patientIds } })
            .select("fullName email phone createdAt")
            .lean();

        // Attach appointment history and reports for each patient
        const now = new Date();
        const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));

        const enrichedPatients = await Promise.all(
            patients.map(async (p) => {
                const appointments = await Appointment.find({
                    hospitalId,
                    patientId: p._id,
                })
                    .populate("doctorId", "doctorName specialization")
                    .populate("departmentId", "departmentName")
                    .sort({ appointmentDate: -1 })
                    .lean();

                const totalAppointments = appointments.length;
                const completedAppointments = appointments.filter((a) => a.status === "Completed").length;
                const upcoming = appointments.filter(
                    (a) => new Date(a.appointmentDate) >= startOfDay && ["Pending", "Confirmed"].includes(a.status)
                );

                const reportsCount = await MedicalReport.countDocuments({
                    hospitalId,
                    patientId: p._id,
                });

                return {
                    ...p,
                    totalAppointments,
                    completedAppointments,
                    upcomingCount: upcoming.length,
                    upcomingAppointments: upcoming.slice(0, 3),
                    appointmentHistory: appointments,
                    reportsCount,
                };
            })
        );

        return res.status(200).json({
            success: true,
            patients: enrichedPatients,
        });
    } catch (error) {
        console.error("GET HOSPITAL PATIENTS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to load hospital patients.",
        });
    }
};

// Hospital Reviews: view patient feedback related to this hospital
const getHospitalReviews = async (req, res) => {
    try {
        let hospital = await Hospital.findOne({ userId: req.user._id });
        if (!hospital) {
            hospital = await Hospital.findOne({ hospitalEmail: req.user.email });
        }
        if (!hospital) {
            return res.status(200).json({
                success: true,
                reviews: [],
            });
        }

        const reviews = await Review.find({ hospitalId: hospital._id })
            .populate("patientId", "fullName email")
            .populate("doctorId", "doctorName specialization")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            reviews,
        });
    } catch (error) {
        console.error("GET HOSPITAL REVIEWS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to load hospital reviews.",
        });
    }
};

module.exports = {
    addHospital,
    getHospitals,
    getHospitalById,
    getMyHospital,
    updateHospital,
    getHospitalDashboardStats,
    getHospitalPatients,
    getHospitalReviews,
};