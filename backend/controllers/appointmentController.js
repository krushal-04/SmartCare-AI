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

// Appointments scheduled in the past (prior dates or passed time slots today)
// transition automatically to Completed status time-and-date-wise.
const completePastAppointments = async (patientId) => {
    try {
        const today = getTodayString();
        const { start, end } = getDateRange(today);

        // 1. All appointments prior to today
        const pastDatesQuery = {
            appointmentDate: { $lt: start },
            status: { $in: ["Pending", "Confirmed"] },
        };
        if (patientId) pastDatesQuery.patientId = patientId;
        await Appointment.updateMany(pastDatesQuery, { $set: { status: "Completed", bookingStatus: "Completed" } });

        // 2. Today's appointments whose scheduled time slot has elapsed
        const todayQuery = {
            appointmentDate: { $gte: start, $lte: end },
            status: { $in: ["Pending", "Confirmed"] },
        };
        if (patientId) todayQuery.patientId = patientId;
        const todayAppointments = await Appointment.find(todayQuery).select("_id appointmentTime").lean();

        if (todayAppointments && todayAppointments.length > 0) {
            const now = new Date();
            const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
            const passedIds = [];

            for (const appt of todayAppointments) {
                if (appt.appointmentTime) {
                    const raw = String(appt.appointmentTime);
                    const parts = raw.split(":");
                    let h = parseInt(parts[0], 10);
                    let min = parseInt(parts[1], 10);
                    const isPM = /pm/i.test(raw);
                    const isAM = /am/i.test(raw);
                    if (isPM && h < 12) h += 12;
                    if (isAM && h === 12) h = 0;
                    if (!isNaN(h) && !isNaN(min)) {
                        if ((h * 60 + min) <= currentTotalMinutes) {
                            passedIds.push(appt._id);
                        }
                    }
                }
            }

            if (passedIds.length > 0) {
                await Appointment.updateMany({ _id: { $in: passedIds } }, { $set: { status: "Completed", bookingStatus: "Completed" } });
            }
        }
    } catch (err) {
        console.error("Auto completePastAppointments failed non-critically:", err.message);
    }
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

        const isToday = date === todayString;
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const slots = [];

        for (
            let current = startMinutes;
            current + duration <= endMinutes;
            current += duration
        ) {
            const time = toTimeString(current);
            const isPassedTime = isToday && current <= currentMinutes;
            const isBooked = bookedTimes.has(time);

            slots.push({
                time,
                available: !isBooked && !isPassedTime,
                isPast: isPassedTime,
            });
        }

        const availableCount = slots.filter((s) => s.available).length;
        let noticeMsg = "";
        if (isToday && availableCount === 0) {
            noticeMsg = "All consultation slots for today have already passed. Please select tomorrow or a future date.";
        }

        res.status(200).json({
            success: true,
            slots,
            message: noticeMsg,
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
                bookingStatus: "Pending",
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
        await completePastAppointments(req.user._id);
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
                .populate(
                    "paymentId",
                    "paymentStatus amount gatewayPaymentId refundStatus"
                )
                .lean();

        for (const appt of appointments) {
            if (appt.paymentId && appt.paymentId.paymentStatus === "Paid" && appt.paymentStatus !== "Paid") {
                appt.paymentStatus = "Paid";
                Appointment.updateOne({ _id: appt._id }, { $set: { paymentStatus: "Paid" } }).catch(() => {});
            }
        }

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
        await completePastAppointments();
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
                .populate(
                    "paymentId",
                    "paymentStatus amount gatewayPaymentId refundStatus"
                )
                .lean();

        for (const appt of appointments) {
            if (appt.paymentId && appt.paymentId.paymentStatus === "Paid" && appt.paymentStatus !== "Paid") {
                appt.paymentStatus = "Paid";
                Appointment.updateOne({ _id: appt._id }, { $set: { paymentStatus: "Paid" } }).catch(() => {});
            }
        }

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

            const today = getTodayString();
            const appointmentDay = appointment.appointmentDate.toISOString().slice(0, 10);
            if (appointmentDay < today) {
                if (["Pending", "Confirmed"].includes(appointment.status)) {
                    appointment.status = "Completed";
                    await appointment.save();
                }
                return res.status(400).json({
                    success: false,
                    message: "Past appointments are completed automatically and cannot be cancelled.",
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
        appointment.bookingStatus = status;

        if (status === "Confirmed") {
            appointment.approvedAt = new Date();
            appointment.approvedBy = req.user._id;
        } else if (status === "Rejected") {
            appointment.rejectedAt = new Date();
            appointment.rejectedBy = req.user._id;
            if (notes) appointment.rejectionReason = notes.trim();
        } else if (status === "Cancelled") {
            appointment.cancelledAt = new Date();
            appointment.cancelledBy = req.user.role;
            if (notes) appointment.cancellationReason = notes.trim();
        }

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
        await completePastAppointments();
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
            .populate(
                    "departmentId",
                    "departmentName"
                )
                .populate(
                    "paymentId",
                    "paymentStatus amount gatewayPaymentId refundStatus"
                )
                .lean();

        for (const appt of appointments) {
            if (appt.paymentId && appt.paymentId.paymentStatus === "Paid" && appt.paymentStatus !== "Paid") {
                appt.paymentStatus = "Paid";
                Appointment.updateOne({ _id: appt._id }, { $set: { paymentStatus: "Paid" } }).catch(() => {});
            }
        }

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


exports.getAppointmentById = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate("hospitalId", "hospitalName city state address hospitalPhone")
            .populate("doctorId", "doctorName specialization qualification doctorImage consultationFee")
            .populate("departmentId", "name departmentName")
            .populate("patientId", "fullName email phone");

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found.",
            });
        }

        res.status(200).json({
            success: true,
            appointment,
        });
    } catch (error) {
        console.error("getAppointmentById error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load appointment details.",
        });
    }
};


/**
 * GET /api/appointment/:appointmentId/reschedule/availability?date=YYYY-MM-DD
 * Check available slots for rescheduling an existing appointment
 * Patient Only (Ownership verified)
 */
exports.getRescheduleAvailability = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { date } = req.query;

        if (!appointmentId) {
            return res.status(400).json({
                success: false,
                message: "Appointment ID is required.",
            });
        }

        const appointment = await Appointment.findById(appointmentId)
            .populate("doctorId", "doctorName specialization qualification doctorImage consultationFee")
            .populate("hospitalId", "hospitalName city state address hospitalPhone")
            .populate("departmentId", "name departmentName");

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found.",
            });
        }

        // Verify patient ownership
        if (String(appointment.patientId) !== String(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to reschedule this appointment.",
            });
        }

        // Eligibility: Only Pending or Confirmed
        if (!["Pending", "Confirmed"].includes(appointment.status)) {
            return res.status(400).json({
                success: false,
                message: `Appointments with status "${appointment.status}" cannot be rescheduled.`,
            });
        }

        // Check if appointment date & time has already passed
        const apptDateIso = appointment.appointmentDate.toISOString().slice(0, 10);
        const [appY, appM, appD] = apptDateIso.split("-").map(Number);
        const [appH, appMin] = (appointment.appointmentTime || "00:00").split(":").map(Number);
        const appointmentDateTime = new Date(appY, appM - 1, appD, appH, appMin);
        const now = new Date();

        if (appointmentDateTime.getTime() <= now.getTime()) {
            return res.status(400).json({
                success: false,
                message: "Past appointments cannot be rescheduled.",
                deadlinePassed: true,
            });
        }

        // 2-hour rescheduling deadline
        const diffMs = appointmentDateTime.getTime() - now.getTime();
        const minNoticeMs = 2 * 60 * 60 * 1000; // 2 hours
        if (diffMs < minNoticeMs) {
            return res.status(400).json({
                success: false,
                message: "Appointments can only be rescheduled at least 2 hours before the scheduled time.",
                deadlinePassed: true,
            });
        }

        // If date query param not provided, return appointment eligibility status
        if (!date) {
            return res.status(200).json({
                success: true,
                eligible: true,
                appointment: {
                    _id: appointment._id,
                    appointmentDate: appointment.appointmentDate,
                    appointmentTime: appointment.appointmentTime,
                    status: appointment.status,
                    bookingStatus: appointment.bookingStatus,
                    consultationFee: appointment.consultationFee,
                    doctor: appointment.doctorId,
                    hospital: appointment.hospitalId,
                    department: appointment.departmentId,
                    isRescheduled: appointment.isRescheduled,
                    rescheduleHistory: appointment.rescheduleHistory || [],
                },
                message: "Appointment is eligible for rescheduling. Please select a date to view available slots.",
            });
        }

        // Validate date format
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
                message: "Past dates are not allowed for appointment rescheduling.",
            });
        }

        const doctorId = appointment.doctorId._id || appointment.doctorId;

        // Fetch Doctor Schedule
        let schedule = await DoctorSchedule.findOne({
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

        const [y, m, d] = date.split("-").map(Number);
        const dayOfWeekIndex = new Date(y, m - 1, d).getDay();
        const selectedDay = dayNames[dayOfWeekIndex];

        if (!schedule.workingDays.includes(selectedDay)) {
            return res.status(200).json({
                success: true,
                slots: [],
                message: `Doctor is not available on ${selectedDay}s.`,
                workingDays: schedule.workingDays,
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
                message: "Doctor is marked on leave on this date.",
                workingDays: schedule.workingDays,
            });
        }

        const startMinutes = toMinutes(schedule.startTime || "09:00");
        const endMinutes = toMinutes(schedule.endTime || "17:00");
        const duration = Number(schedule.slotDuration) || 30;

        const { start, end } = getDateRange(date);

        // Fetch booked appointments on requested date, EXCLUDING this appointment itself!
        const bookedAppointments = await Appointment.find({
            _id: { $ne: appointment._id },
            doctorId,
            appointmentDate: { $gte: start, $lte: end },
            status: { $nin: ["Cancelled", "Rejected"] },
        })
            .select("appointmentTime")
            .lean();

        const bookedTimes = new Set(bookedAppointments.map((item) => item.appointmentTime));

        const isToday = date === todayString;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const slots = [];
        for (let current = startMinutes; current + duration <= endMinutes; current += duration) {
            const time = toTimeString(current);
            const isPassedTime = isToday && current <= currentMinutes;
            const isBooked = bookedTimes.has(time);
            const isCurrentSlot = (date === apptDateIso && time === appointment.appointmentTime);

            slots.push({
                time,
                available: !isBooked && !isPassedTime && !isCurrentSlot,
                isPast: isPassedTime,
                isCurrentSlot,
            });
        }

        const availableCount = slots.filter((s) => s.available).length;
        let noticeMsg = "";
        if (isToday && availableCount === 0) {
            noticeMsg = "All consultation slots for today have already passed. Please select tomorrow or a future date.";
        }

        return res.status(200).json({
            success: true,
            date,
            appointment: {
                _id: appointment._id,
                appointmentDate: appointment.appointmentDate,
                appointmentTime: appointment.appointmentTime,
                status: appointment.status,
                bookingStatus: appointment.bookingStatus,
                consultationFee: appointment.consultationFee,
                doctor: appointment.doctorId,
                hospital: appointment.hospitalId,
                department: appointment.departmentId,
                isRescheduled: appointment.isRescheduled,
                rescheduleHistory: appointment.rescheduleHistory || [],
            },
            schedule: {
                workingDays: schedule.workingDays,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                slotDuration: schedule.slotDuration,
            },
            slots,
            availableCount,
            message: noticeMsg,
        });
    } catch (error) {
        console.error("getRescheduleAvailability error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to retrieve doctor availability for rescheduling.",
        });
    }
};

/**
 * PUT /api/appointment/:appointmentId/reschedule
 * Reschedule an existing appointment to a new date and time
 * Patient Only (Ownership verified)
 */
exports.rescheduleAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { newDate, newTime, reason } = req.body;

        if (!appointmentId || !newDate || !newTime) {
            return res.status(400).json({
                success: false,
                message: "Appointment ID, new date, and new time slot are required.",
            });
        }

        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!datePattern.test(newDate)) {
            return res.status(400).json({
                success: false,
                message: "Invalid date format. Expected YYYY-MM-DD.",
            });
        }

        const timePattern = /^([01]?\d|2[0-3]):[0-5]\d$/;
        if (!timePattern.test(newTime)) {
            return res.status(400).json({
                success: false,
                message: "Invalid time format. Expected HH:MM (24-hour).",
            });
        }

        const appointment = await Appointment.findById(appointmentId)
            .populate("doctorId")
            .populate("hospitalId")
            .populate("departmentId");

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found.",
            });
        }

        // Verify patient ownership
        if (String(appointment.patientId) !== String(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to reschedule this appointment.",
            });
        }

        // Eligibility: Only Pending or Confirmed
        if (!["Pending", "Confirmed"].includes(appointment.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot reschedule appointment in "${appointment.status}" status.`,
            });
        }

        // Check if appointment date & time has already passed
        const apptDateIso = appointment.appointmentDate.toISOString().slice(0, 10);
        const [appY, appM, appD] = apptDateIso.split("-").map(Number);
        const [appH, appMin] = (appointment.appointmentTime || "00:00").split(":").map(Number);
        const currentApptDateTime = new Date(appY, appM - 1, appD, appH, appMin);
        const now = new Date();

        if (currentApptDateTime.getTime() <= now.getTime()) {
            return res.status(400).json({
                success: false,
                message: "Past appointments cannot be rescheduled.",
                deadlinePassed: true,
            });
        }

        // 2-hour rescheduling deadline rule
        const diffMs = currentApptDateTime.getTime() - now.getTime();
        const minNoticeMs = 2 * 60 * 60 * 1000;
        if (diffMs < minNoticeMs) {
            return res.status(400).json({
                success: false,
                message: "The rescheduling deadline for this appointment has passed (at least 2 hours advance notice required).",
                deadlinePassed: true,
            });
        }

        // Prevent rescheduling to the exact same date and time
        if (apptDateIso === newDate && appointment.appointmentTime === newTime) {
            return res.status(400).json({
                success: false,
                message: "The selected date and time are identical to your current appointment. Please choose a different slot.",
            });
        }

        const todayString = getTodayString();
        if (newDate < todayString) {
            return res.status(400).json({
                success: false,
                message: "Cannot reschedule to a past date.",
            });
        }

        const doctorId = appointment.doctorId._id || appointment.doctorId;

        // Fetch Doctor Schedule for verification
        let schedule = await DoctorSchedule.findOne({
            doctorId,
            isActive: true,
        }).lean();

        if (!schedule) {
            schedule = {
                workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                startTime: "09:00",
                endTime: "17:00",
                slotDuration: 30,
                leaveDates: [],
            };
        }

        const [ny, nm, nd] = newDate.split("-").map(Number);
        const dayOfWeekIndex = new Date(ny, nm - 1, nd).getDay();
        const selectedDay = dayNames[dayOfWeekIndex];

        if (!schedule.workingDays.includes(selectedDay)) {
            return res.status(400).json({
                success: false,
                message: `Doctor is not scheduled to consult on ${selectedDay}s.`,
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

        if (isDateOnLeave(schedule.leaveDates, newDate)) {
            return res.status(400).json({
                success: false,
                message: "Doctor is marked on leave on this date. Please choose another date.",
            });
        }

        const startMinutes = toMinutes(schedule.startTime || "09:00");
        const endMinutes = toMinutes(schedule.endTime || "17:00");
        const duration = Number(schedule.slotDuration) || 30;
        const requestedMinutes = toMinutes(newTime);

        if (
            requestedMinutes < startMinutes ||
            requestedMinutes + duration > endMinutes ||
            (requestedMinutes - startMinutes) % duration !== 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Selected time is not a valid consultation slot for this doctor.",
            });
        }

        if (newDate === todayString) {
            const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
            if (requestedMinutes <= currentTotalMinutes) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot select a time slot that has already passed today.",
                });
            }
        }

        // CRITICAL DOUBLE-BOOKING PREVENTION & CONCURRENCY
        // Ensure no other active appointment occupies the target new slot
        const { start: newRangeStart, end: newRangeEnd } = getDateRange(newDate);

        const conflictingAppt = await Appointment.findOne({
            _id: { $ne: appointment._id },
            doctorId,
            appointmentDate: { $gte: newRangeStart, $lte: newRangeEnd },
            appointmentTime: newTime,
            status: { $nin: ["Cancelled", "Rejected"] },
        });

        if (conflictingAppt) {
            return res.status(409).json({
                success: false,
                message: "This time slot is no longer available. Please select another time slot.",
            });
        }

        // Capture previous details for history
        const oldDate = appointment.appointmentDate;
        const oldStartTime = appointment.appointmentTime;
        const oldEndTime = toTimeString(toMinutes(oldStartTime) + duration);
        const newStartTime = newTime;
        const newEndTime = toTimeString(toMinutes(newStartTime) + duration);

        const historyRecord = {
            oldDate,
            oldTime: oldStartTime,
            oldStartTime,
            oldEndTime,
            newDate: parseAppointmentDate(newDate),
            newTime: newStartTime,
            newStartTime,
            newEndTime,
            rescheduledBy: req.user._id,
            rescheduledByRole: "patient",
            reason: reason?.trim() || "Patient requested rescheduling",
            previousStatus: appointment.status,
            updatedStatus: appointment.status,
            rescheduledAt: new Date(),
        };

        // Update appointment atomically: old slot is released, new slot is booked
        appointment.appointmentDate = parseAppointmentDate(newDate);
        appointment.appointmentTime = newTime;
        appointment.isRescheduled = true;
        appointment.rescheduledAt = new Date();
        appointment.rescheduleCount = (appointment.rescheduleCount || 0) + 1;
        appointment.rescheduleHistory.push(historyRecord);

        await appointment.save();

        // Populate updated appointment for response and notification
        const populatedAppt = await Appointment.findById(appointment._id)
            .populate("hospitalId", "hospitalName city state address hospitalPhone userId")
            .populate("doctorId", "doctorName specialization qualification doctorImage consultationFee userId")
            .populate("departmentId", "name departmentName")
            .populate("patientId", "fullName email phone")
            .populate("paymentId", "paymentStatus amount gatewayPaymentId");

        const oldDateFormatted = new Date(oldDate).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
        const newDateFormatted = new Date(parseAppointmentDate(newDate)).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });

        const docName = populatedAppt.doctorId?.doctorName || "Doctor";
        const hospName = populatedAppt.hospitalId?.hospitalName || "Medical Center";
        const patientName = populatedAppt.patientId?.fullName || "Patient";

        // 1. In-app notification to Patient
        Notification.create({
            userId: req.user._id,
            title: "Appointment Rescheduled",
            message: `Your appointment with Dr. ${docName} at ${hospName} has been rescheduled to ${newDateFormatted} at ${newStartTime}.`,
            type: "Appointment",
            relatedId: appointment._id,
        }).catch((e) => console.warn("Patient reschedule notification err:", e.message));

        // 2. In-app notification to Hospital
        if (populatedAppt.hospitalId?.userId) {
            Notification.create({
                userId: populatedAppt.hospitalId.userId,
                title: "Appointment Rescheduled by Patient",
                message: `Patient ${patientName} rescheduled consultation with Dr. ${docName} from ${oldDateFormatted} (${oldStartTime}) to ${newDateFormatted} (${newStartTime}).`,
                type: "Appointment",
                relatedId: appointment._id,
            }).catch((e) => console.warn("Hospital reschedule notification err:", e.message));
        }

        // 3. In-app notification to Doctor
        if (populatedAppt.doctorId?.userId) {
            Notification.create({
                userId: populatedAppt.doctorId.userId,
                title: "Appointment Rescheduled by Patient",
                message: `Patient ${patientName} rescheduled consultation to ${newDateFormatted} at ${newStartTime}.`,
                type: "Appointment",
                relatedId: appointment._id,
            }).catch((e) => console.warn("Doctor reschedule notification err:", e.message));
        }

        // 4. Audit Log
        AuditLog.create({
            userId: req.user._id,
            userName: req.user.fullName || "Patient",
            userRole: "patient",
            action: "APPOINTMENT_RESCHEDULED",
            targetType: "Appointment",
            targetId: appointment._id,
            details: `Appointment #${appointment._id} rescheduled from ${oldDateFormatted} ${oldStartTime} to ${newDateFormatted} ${newStartTime}.`,
        }).catch((e) => console.warn("AuditLog err:", e.message));

        // 5. Email Notification to patient
        emailService
            .sendAppointmentRescheduledEmail({
                appointment: populatedAppt,
                patient: populatedAppt.patientId,
                doctor: populatedAppt.doctorId,
                hospital: populatedAppt.hospitalId,
                oldDateStr: oldDateFormatted,
                oldTimeStr: oldStartTime,
                newDateStr: newDateFormatted,
                newTimeStr: newStartTime,
                reason: reason?.trim() || "",
            })
            .catch((e) => console.error("Reschedule email err:", e.message));

        return res.status(200).json({
            success: true,
            message: "Your appointment has been successfully rescheduled.",
            appointment: populatedAppt,
        });
    } catch (error) {
        console.error("rescheduleAppointment error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to reschedule appointment.",
        });
    }
};
