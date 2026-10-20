const User = require("../models/User");
const Appointment = require("../models/Appointment");
const MedicalReport = require("../models/MedicalReport");
const EmergencyRequest = require("../models/EmergencyRequest");

const getPatientId = (req) => req.user._id;

const getDayStart = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
};

exports.getPatientDashboard = async (req, res) => {
    try {
        const patientId = getPatientId(req);

        const today = getDayStart();

        const [
            totalAppointments,
            upcomingAppointments,
            completedAppointments,
            reportCount,
            emergencyCount,
            recentAppointments,
        ] = await Promise.all([
            Appointment.countDocuments({
                patientId,
            }),

            Appointment.countDocuments({
                patientId,
                appointmentDate: {
                    $gte: today,
                },
                status: {
                    $in: [
                        "Pending",
                        "Confirmed",
                    ],
                },
            }),

            Appointment.countDocuments({
                patientId,
                status: "Completed",
            }),

            MedicalReport.countDocuments({
                patientId,
            }),

            EmergencyRequest.countDocuments({
                patientId,
            }),

            Appointment.find({
                patientId,
            })
                .sort({
                    appointmentDate: 1,
                    createdAt: -1,
                })
                .limit(5)
                .populate(
                    "hospitalId",
                    "hospitalName city"
                )
                .populate(
                    "doctorId",
                    "doctorName specialization"
                )
                .populate(
                    "departmentId",
                    "departmentName"
                )
                .lean(),
        ]);

        res.status(200).json({
            success: true,

            stats: {
                totalAppointments,
                upcomingAppointments,
                completedAppointments,
                reportCount,
                emergencyCount,
            },

            recentAppointments,
        });
    } catch (error) {
        console.error(
            "getPatientDashboard:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to load patient dashboard.",
        });
    }
};

exports.getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(
            req.user._id
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error(
            "getMyProfile:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to load profile.",
        });
    }
};

exports.updateMyProfile = async (req, res) => {
    try {
        const {
            fullName,
            phone,
        } = req.body;

        if (!fullName?.trim()) {
            return res.status(400).json({
                success: false,
                message:
                    "Full name is required.",
            });
        }

        if (!phone?.trim()) {
            return res.status(400).json({
                success: false,
                message:
                    "Phone number is required.",
            });
        }

        const duplicatePhone =
            await User.findOne({
                phone: phone.trim(),
                _id: {
                    $ne: req.user._id,
                },
            });

        if (duplicatePhone) {
            return res.status(400).json({
                success: false,
                message:
                    "Phone number is already in use.",
            });
        }

        const user =
            await User.findByIdAndUpdate(
                req.user._id,
                {
                    fullName:
                        fullName.trim(),
                    phone: phone.trim(),
                },
                {
                    new: true,
                    runValidators: true,
                }
            ).select("-password");

        res.status(200).json({
            success: true,
            message:
                "Profile updated successfully.",
            user,
        });
    } catch (error) {
        console.error(
            "updateMyProfile:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to update profile.",
        });
    }
};