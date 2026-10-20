const Appointment = require("../models/Appointment");
const DoctorSchedule = require("../models/DoctorSchedule");
const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");
const Department = require("../models/Department");
const Notification = require("../models/Notification");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const emailService = require("../services/emailService");

const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

const toMinutes = (time) => {
    const [hours, minutes] =
        String(time).split(":").map(Number);

    return hours * 60 + minutes;
};

const toTimeString = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${String(hours).padStart(
        2,
        "0"
    )}:${String(mins).padStart(2, "0")}`;
};

const parseAppointmentDate = (dateString) => {
    const [y, m, d] = String(dateString).split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
};

const getDateRange = (dateString) => {
    const [y, m, d] = String(dateString).split("-").map(Number);
    const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    const end = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
    return { start, end };
};

const getTodayString = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

exports.getAvailableSlots = async (
    req,
    res
) => {
    try {
        const {
            doctorId,
            date,
        } = req.query;

        if (!doctorId || !date) {
            return res.status(400).json({
                success: false,
                message:
                    "Doctor and date are required.",
            });
        }

        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!datePattern.test(date)) {
            return res.status(400).json({
                success: false,
                message: "Invalid date format. Expected YYYY-MM-DD.",
            });
        }

        const todayString = getTodayString();
        if (date < todayString) {
            return res.status(400).json({
                success: false,
                message:
                    "Past dates are not allowed.",
            });
        }

        let schedule =
            await DoctorSchedule.findOne({
                doctorId,
                isActive: true,
            }).lean();

        if (!schedule) {
            const doctor = await Doctor.findById(doctorId);
            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    message: "Doctor not found.",
                });
            }

            // Auto-initialize standard active schedule for doctor: Mon-Sat 09:00 to 17:00
            schedule = await DoctorSchedule.findOneAndUpdate(
                { doctorId },
                {
                    doctorId,
                    workingDays: [
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                    ],
                    startTime: "09:00",
                    endTime: "17:00",
                    slotDuration: 30,
                    leaveDates: [],
                    isActive: true,
                },
                { upsert: true, returnDocument: "after" }
            ).lean();
        }

        const [y, m, d] = date.split("-").map(Number);
        const dayOfWeekIndex = new Date(y, m - 1, d).getDay();
        const selectedDay = dayNames[dayOfWeekIndex];

        if (
            !schedule.workingDays.includes(
                selectedDay
            )
        ) {
            return res.status(200).json({
                success: true,
                slots: [],
                message:
                    "Doctor is not available on this day.",
            });
        }

        const isDateOnLeave = (leaveDatesList, target) => {
            if (!Array.isArray(leaveDatesList) || !target) return false;
            const cleanTarget = String(target).split("T")[0].trim();
            return leaveDatesList.some((ld) => {
                if (!ld) return false;
                const cleanLd = String(ld).split("T")[0].trim();
                return cleanLd === cleanTarget;
            });
        };

        if (isDateOnLeave(schedule.leaveDates, date)) {
            return res.status(200).json({
                success: true,
                slots: [],
                message: "Doctor is on leave on this date.",
            });
        }

        const startMinutes =
            toMinutes(schedule.startTime || "09:00");

        const endMinutes =
            toMinutes(schedule.endTime || "17:00");

        const duration =
            Number(schedule.slotDuration) || 30;

        const { start, end } =
            getDateRange(date);

        const bookedAppointments =
            await Appointment.find({
                doctorId,
                appointmentDate: {
                    $gte: start,
                    $lte: end,
                },
                status: {
                    $nin: [
                        "Cancelled",
                        "Rejected",
                    ],
                },
            })
                .select("appointmentTime")
                .lean();

        const bookedTimes = new Set(
            bookedAppointments.map(
                (item) =>
                    item.appointmentTime
            )
        );

        const slots = [];

        for (
            let current = startMinutes;
            current + duration <= endMinutes;
            current += duration
        ) {
            const time =
                toTimeString(current);

            slots.push({
                time,
                available:
                    !bookedTimes.has(time),
            });
        }

        res.status(200).json({
            success: true,
            slots,
        });
    } catch (error) {
        console.error(
            "getAvailableSlots:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to calculate available slots.",
        });
    }
};

exports.createAppointment = async (
    req,
    res
) => {
    try {
        const {
            hospitalId,
            doctorId,
            departmentId,
            appointmentDate,
            appointmentTime,
            reason,
        } = req.body;

        if (
            !hospitalId ||
            !doctorId ||
            !departmentId ||
            !appointmentDate ||
            !appointmentTime
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Hospital, department, doctor, date and time are required.",
            });
        }

        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!datePattern.test(appointmentDate)) {
            return res.status(400).json({
                success: false,
                message: "Appointment date must be in YYYY-MM-DD format.",
            });
        }

        const todayString = getTodayString();
        if (appointmentDate < todayString) {
            return res.status(400).json({
                success: false,
                message:
                    "Appointment date cannot be in the past.",
            });
        }

        const [
            hospital,
            doctor,
            department,
        ] = await Promise.all([
            Hospital.findById(
                hospitalId
            ),
            Doctor.findById(doctorId),
            Department.findById(
                departmentId
            ),
        ]);

        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: "Hospital not found.",
            });
        }

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found.",
            });
        }

        if (!department) {
            return res.status(404).json({
                success: false,
                message:
                    "Department not found.",
            });
        }

        if (
            doctor.hospitalId &&
            String(
                doctor.hospitalId
            ) !== String(hospitalId)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Doctor does not belong to selected hospital.",
            });
        }

        if (
            doctor.departmentId &&
            String(
                doctor.departmentId
            ) !== String(departmentId)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Doctor does not belong to selected department.",
            });
        }

        if (
            department.hospitalId &&
            String(
                department.hospitalId
            ) !== String(hospitalId)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Department does not belong to selected hospital.",
            });
        }

        let schedule =
            await DoctorSchedule.findOne({
                doctorId,
                isActive: true,
            }).lean();

        if (!schedule) {
            schedule = await DoctorSchedule.findOneAndUpdate(
                { doctorId },
                {
                    doctorId,
                    workingDays: [
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                    ],
                    startTime: "09:00",
                    endTime: "17:00",
                    slotDuration: 30,
                    leaveDates: [],
                    isActive: true,
                },
                { upsert: true, returnDocument: "after" }
            ).lean();
        }

        const [y, m, d] = appointmentDate.split("-").map(Number);
        const dayOfWeekIndex = new Date(y, m - 1, d).getDay();
        const selectedDay = dayNames[dayOfWeekIndex];

        if (
            !schedule.workingDays.includes(
                selectedDay
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Doctor is not available on this day.",
            });
        }

        const isDateOnLeave = (schedule.leaveDates || []).some(ld => {
            const formattedLd = String(ld).split('T')[0].trim();
            const formattedAppt = String(appointmentDate).split('T')[0].trim();
            return formattedLd === formattedAppt;
        });

        if (isDateOnLeave) {
            return res.status(400).json({
                success: false,
                message:
                    "Doctor is on leave on this date.",
            });
        }

        const requestedMinutes =
            toMinutes(
                appointmentTime
            );

        const startMinutes =
            toMinutes(
                schedule.startTime
            );

        const endMinutes =
            toMinutes(
                schedule.endTime
            );

        if (
            requestedMinutes <
                startMinutes ||
            requestedMinutes +
                schedule.slotDuration >
                endMinutes ||
            (requestedMinutes -
                startMinutes) %
                schedule.slotDuration !==
                0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Selected time is not a valid slot.",
            });
        }

        const { start, end } =
            getDateRange(
                appointmentDate
            );

        const existing =
            await Appointment.findOne({
                doctorId,
                appointmentDate: {
                    $gte: start,
                    $lte: end,
                },
                appointmentTime,
                status: {
                    $nin: [
                        "Cancelled",
                        "Rejected",
                    ],
                },
            });

        if (existing) {
            return res.status(409).json({
                success: false,
                message:
                    "This appointment slot is already booked.",
            });
        }

        const appointment =
            await Appointment.create({
                patientId:
                    req.user._id,

                hospitalId,

                doctorId,

                departmentId,

                appointmentDate: parseAppointmentDate(appointmentDate),

                appointmentTime,

                reason:
                    reason?.trim() || "",

                status: "Pending",
            });

        await appointment.populate([
            {
                path: "hospitalId",
                select:
                    "hospitalName city hospitalEmail",
            },
            {
                path: "doctorId",
                select:
                    "doctorName specialization",
            },
            {
                path: "departmentId",
                select:
                    "departmentName",
            },
        ]);

        await Notification.create({
            userId: req.user._id,
            title:
                "Appointment Booked",
            message: `Your appointment with ${
                appointment.doctorId
                    ?.doctorName ||
                "the doctor"
            } has been booked and is pending confirmation.`,
            type: "Appointment",
            relatedId:
                appointment._id,
        });

        if (hospital.userId) {
            await Notification.create({
                userId:
                    hospital.userId,
                title:
                    "New Appointment Request",
                message: `A patient has requested an appointment with ${
                    appointment.doctorId
                        ?.doctorName ||
                    "a doctor"
                }.`,
                type: "Appointment",
                relatedId:
                    appointment._id,
            });
        }

        // Send booking confirmation email to patient
        if (req.user && req.user.email) {
            emailService.sendAppointmentCreatedEmail(appointment, req.user, doctor, hospital).catch((e) =>
                console.error("[EmailService] Appointment created email error:", e.message)
            );
        }

        res.status(201).json({
            success: true,
            message:
                "Appointment booked successfully.",
            appointment,
        });
    } catch (error) {
        console.error(
            "createAppointment:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to create appointment.",
        });
    }
};

exports.getMyAppointments = async (
    req,
    res
) => {
    try {
        const appointments =
            await Appointment.find({
                patientId:
                    req.user._id,
            })
                .sort({
                    appointmentDate: -1,
                    createdAt: -1,
                })
                .populate(
                    "hospitalId",
                    "hospitalName city state address hospitalPhone"
                )
                .populate(
                    "doctorId",
                    "doctorName specialization qualification doctorImage"
                )
                .populate(
                    "departmentId",
                    "departmentName"
                )
                .lean();

        res.status(200).json({
            success: true,
            appointments,
        });
    } catch (error) {
        console.error(
            "getMyAppointments:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to load appointments.",
        });
    }
};

exports.getHospitalAppointments = async (
    req,
    res
) => {
    try {
        const hospital =
            await Hospital.findOne({
                userId: req.user._id,
            }).select("_id");

        if (!hospital) {
            return res.status(404).json({
                success: false,
                message:
                    "Hospital profile not found.",
            });
        }

        const query = {
            hospitalId: hospital._id,
        };

        if (req.query.status) {
            query.status = req.query.status;
        }

        if (req.query.doctorId) {
            query.doctorId = req.query.doctorId;
        }

        if (req.query.departmentId) {
            query.departmentId = req.query.departmentId;
        }

        if (req.query.date) {
            const { start, end } = getDateRange(req.query.date);
            query.appointmentDate = { $gte: start, $lte: end };
        }

        const appointments =
            await Appointment.find(query)
                .sort({
                    appointmentDate: 1,
                    appointmentTime: 1,
                })
                .populate(
                    "patientId",
                    "fullName email phone"
                )
                .populate(
                    "doctorId",
                    "doctorName specialization"
                )
                .populate(
                    "departmentId",
                    "departmentName"
                )
                .lean();

        res.status(200).json({
            success: true,
            appointments,
        });
    } catch (error) {
        console.error(
            "getHospitalAppointments:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to load hospital appointments.",
        });
    }
};

exports.updateAppointmentStatus = async (
    req,
    res
) => {
    try {
        const {
            status,
            notes,
        } = req.body;

        const allowedStatuses = [
            "Pending",
            "Confirmed",
            "Completed",
            "Rejected",
            "Cancelled",
        ];

        if (
            !allowedStatuses.includes(
                status
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid appointment status.",
            });
        }

        const appointment =
            await Appointment.findById(
                req.params.id
            )
                .populate(
                    "hospitalId",
                    "hospitalName userId"
                )
                .populate(
                    "doctorId",
                    "doctorName"
                );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message:
                    "Appointment not found.",
            });
        }

        if (
            req.user.role === "patient"
        ) {
            if (
                String(
                    appointment.patientId
                ) !==
                String(
                    req.user._id
                )
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You cannot modify this appointment.",
                });
            }

            if (
                status !== "Cancelled"
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Patients can only cancel appointments.",
                });
            }

            if (
                [
                    "Completed",
                    "Rejected",
                ].includes(
                    appointment.status
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This appointment cannot be cancelled.",
                });
            }
        }

        if (
            req.user.role ===
            "hospital"
        ) {
            if (
                String(
                    appointment.hospitalId
                        ?.userId
                ) !==
                String(
                    req.user._id
                )
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "This appointment does not belong to your hospital.",
                });
            }
        }

        appointment.status = status;
        if (notes !== undefined) {
            appointment.notes = notes.trim();
        }

        await appointment.save();

        await Notification.create({
            userId:
                appointment.patientId,
            title:
                `Appointment ${status}`,
            message: `Your appointment status has been changed to ${status}.${notes ? ` Notes: ${notes}` : ""}`,
            type: "Appointment",
            relatedId:
                appointment._id,
        });

        // Trigger email to patient
        const patientUser = await User.findById(appointment.patientId).select("fullName email");
        if (patientUser?.email) {
            emailService.sendAppointmentStatusEmail(
                appointment,
                patientUser,
                appointment.doctorId,
                appointment.hospitalId,
                status,
                appointment.notes
            ).catch(() => {});
        }

        // Audit Log
        await AuditLog.create({
            userId: req.user._id,
            userName: req.user.fullName,
            userRole: req.user.role,
            action: "Appointment Status Updated",
            details: `Appointment ${appointment._id} status changed to ${status}`,
            targetId: appointment._id,
            targetType: "Appointment",
        }).catch(() => {});

        res.status(200).json({
            success: true,
            message:
                "Appointment status updated.",
            appointment,
        });
    } catch (error) {
        console.error(
            "updateAppointmentStatus:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to update appointment status.",
        });
    }
};

exports.getAllAppointments = async (req, res) => {
    try {
        const query = {};
        if (req.query.status) query.status = req.query.status;
        if (req.query.hospitalId) query.hospitalId = req.query.hospitalId;
        if (req.query.doctorId) query.doctorId = req.query.doctorId;
        if (req.query.patientId) query.patientId = req.query.patientId;
        if (req.query.departmentId) query.departmentId = req.query.departmentId;
        if (req.query.date) {
            const { start, end } = getDateRange(req.query.date);
            query.appointmentDate = { $gte: start, $lte: end };
        }

        const appointments = await Appointment.find(query)
            .sort({ appointmentDate: -1, appointmentTime: 1 })
            .populate("patientId", "fullName email phone")
            .populate("hospitalId", "hospitalName city")
            .populate("doctorId", "doctorName specialization")
            .populate("departmentId", "departmentName")
            .lean();

        res.status(200).json({
            success: true,
            appointments,
        });
    } catch (error) {
        console.error("getAllAppointments error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load appointments.",
        });
    }
};