const Reminder = require("../models/Reminder");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { emitToUser, emitUnreadCount } = require("./socketService");
const { sendAppointmentReminderEmail } = require("./emailService");

/**
 * Parses time string like "10:00", "14:30", "10:00 AM", "02:30 PM"
 * Returns 24-hour hours and minutes.
 */
const parseTimeParts = (timeStr) => {
    let hours = 9;
    let minutes = 0;
    if (timeStr && timeStr.includes(":")) {
        const parts = timeStr.trim().split(":");
        let h = parseInt(parts[0], 10);
        const isPM = /pm/i.test(timeStr);
        const isAM = /am/i.test(timeStr);
        let m = parseInt(parts[1], 10) || 0;
        if (isPM && h < 12) h += 12;
        if (isAM && h === 12) h = 0;
        if (!isNaN(h)) {
            hours = h;
            minutes = m;
        }
    }
    return { hours, minutes };
};

/**
 * Calculates appointment timestamp in UTC based on Asia/Kolkata (UTC +05:30) timezone.
 */
const getAppointmentTimestamp = (appointmentDate, appointmentTime) => {
    if (!appointmentDate) return null;
    const d = new Date(appointmentDate);
    if (isNaN(d.getTime())) return null;

    // Use date parts from appointmentDate
    const year = d.getFullYear();
    const month = d.getMonth();
    const date = d.getDate();

    const { hours, minutes } = parseTimeParts(appointmentTime);

    // Asia/Kolkata is UTC+05:30 (+330 minutes)
    // To get UTC equivalent: Date.UTC(year, month, date, hours - 5, minutes - 30)
    const utcTime = Date.UTC(year, month, date, hours - 5, minutes - 30, 0, 0);
    return new Date(utcTime);
};

/**
 * Schedules 24-hour and 1-hour reminders for a confirmed appointment.
 */
const scheduleRemindersForAppointment = async (appointmentInput) => {
    try {
        let appointment = appointmentInput;
        if (!appointment.doctorId || !appointment.hospitalId || !appointment.patientId) {
            appointment = await Appointment.findById(appointment._id);
        }
        if (!appointment) return { scheduled: 0, reason: "Appointment not found" };

        const status = appointment.status || appointment.bookingStatus;
        if (status !== "Confirmed") {
            return { scheduled: 0, reason: "Appointment is not confirmed" };
        }

        const apptTimestamp = getAppointmentTimestamp(appointment.appointmentDate, appointment.appointmentTime);
        if (!apptTimestamp) {
            return { scheduled: 0, reason: "Invalid appointment date/time" };
        }

        const now = new Date();
        if (apptTimestamp.getTime() <= now.getTime()) {
            return { scheduled: 0, reason: "Appointment is already in the past or in progress" };
        }

        // Fetch patient to check reminder preferences
        const patientId = appointment.patientId?._id || appointment.patientId;
        const patient = await User.findById(patientId);
        const settings = patient?.reminderSettings || {
            enabled: true,
            reminder24h: true,
            reminder1h: true,
            channels: { inApp: true, email: true },
        };

        if (settings.enabled === false) {
            return { scheduled: 0, reason: "Patient has disabled appointment reminders in settings" };
        }

        const version = (appointment.rescheduleCount || 0) + 1;
        const doctorId = appointment.doctorId?._id || appointment.doctorId;
        const hospitalId = appointment.hospitalId?._id || appointment.hospitalId;

        const remindersToCreate = [];

        // 1. 24-Hour Reminder
        if (settings.reminder24h !== false) {
            const time24h = new Date(apptTimestamp.getTime() - 24 * 60 * 60 * 1000);
            if (time24h.getTime() > now.getTime()) {
                remindersToCreate.push({
                    appointmentId: appointment._id,
                    patientId,
                    doctorId,
                    hospitalId,
                    reminderType: "24_HOURS",
                    scheduledAt: time24h,
                    appointmentVersion: version,
                    channels: settings.channels || { inApp: true, email: true },
                    idempotencyKey: `${appointment._id}_24_HOURS_v${version}`,
                });
            }
        }

        // 2. 1-Hour Reminder
        if (settings.reminder1h !== false) {
            const time1h = new Date(apptTimestamp.getTime() - 1 * 60 * 60 * 1000);
            if (time1h.getTime() > now.getTime()) {
                remindersToCreate.push({
                    appointmentId: appointment._id,
                    patientId,
                    doctorId,
                    hospitalId,
                    reminderType: "1_HOUR",
                    scheduledAt: time1h,
                    appointmentVersion: version,
                    channels: settings.channels || { inApp: true, email: true },
                    idempotencyKey: `${appointment._id}_1_HOUR_v${version}`,
                });
            }
        }

        let scheduledCount = 0;
        for (const remData of remindersToCreate) {
            try {
                await Reminder.create(remData);
                scheduledCount += 1;
            } catch (err) {
                // If duplicate key (E11000), ignore safely
                if (err.code !== 11000) {
                    console.error("Error creating reminder record:", err.message);
                }
            }
        }

        return { scheduled: scheduledCount, totalPossible: remindersToCreate.length };
    } catch (error) {
        console.error("scheduleRemindersForAppointment error:", error);
        return { scheduled: 0, error: error.message };
    }
};

/**
 * Cancels all pending reminders for an appointment (used during cancellation or rescheduling).
 */
const cancelRemindersForAppointment = async (appointmentId, reason = "Appointment cancelled or rescheduled") => {
    try {
        const result = await Reminder.updateMany(
            {
                appointmentId,
                status: "PENDING",
            },
            {
                $set: {
                    status: "CANCELLED",
                    lastError: reason,
                },
            }
        );
        return { cancelledCount: result.modifiedCount };
    } catch (error) {
        console.error("cancelRemindersForAppointment error:", error);
        return { error: error.message };
    }
};

/**
 * Reconciles reminders for a patient when their reminder preferences change.
 */
const reconcilePatientReminders = async (patientId) => {
    try {
        const patient = await User.findById(patientId);
        if (!patient) return;

        const settings = patient.reminderSettings || { enabled: true, reminder24h: true, reminder1h: true };

        // If reminders globally disabled: cancel all pending reminders
        if (!settings.enabled) {
            await Reminder.updateMany(
                { patientId, status: "PENDING" },
                { $set: { status: "CANCELLED", lastError: "Patient disabled reminders in settings" } }
            );
            return;
        }

        // If 24h reminder disabled: cancel pending 24h reminders
        if (!settings.reminder24h) {
            await Reminder.updateMany(
                { patientId, status: "PENDING", reminderType: "24_HOURS" },
                { $set: { status: "CANCELLED", lastError: "Patient disabled 24-hour reminder" } }
            );
        }

        // If 1h reminder disabled: cancel pending 1h reminders
        if (!settings.reminder1h) {
            await Reminder.updateMany(
                { patientId, status: "PENDING", reminderType: "1_HOUR" },
                { $set: { status: "CANCELLED", lastError: "Patient disabled 1-hour reminder" } }
            );
        }

        // Find upcoming confirmed appointments for this patient and generate missing future reminders
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingAppointments = await Appointment.find({
            patientId,
            appointmentDate: { $gte: today },
            status: "Confirmed",
        });

        for (const appt of upcomingAppointments) {
            await scheduleRemindersForAppointment(appt);
        }
    } catch (error) {
        console.error("reconcilePatientReminders error:", error);
    }
};

/**
 * Background worker task: checks and executes all due reminders atomically.
 */
const processDueReminders = async () => {
    try {
        const now = new Date();

        // Find pending reminders due on or before now, with attempts < 3
        const dueReminders = await Reminder.find({
            status: "PENDING",
            scheduledAt: { $lte: now },
            attempts: { $lt: 3 },
        })
            .limit(50)
            .lean();

        if (!dueReminders.length) return;

        for (const reminder of dueReminders) {
            // Atomic lock claiming
            const claimed = await Reminder.findOneAndUpdate(
                {
                    _id: reminder._id,
                    status: "PENDING",
                },
                {
                    $set: { status: "PROCESSING" },
                },
                { new: true }
            );

            if (!claimed) continue; // Claimed by another worker instance

            try {
                // Verify appointment
                const appt = await Appointment.findById(claimed.appointmentId)
                    .populate("doctorId", "doctorName specialization")
                    .populate("hospitalId", "hospitalName city state")
                    .populate("patientId", "fullName email phone reminderSettings");

                if (!appt) {
                    claimed.status = "CANCELLED";
                    claimed.lastError = "Appointment record not found";
                    await claimed.save();
                    continue;
                }

                // Check appointment status and version
                const currentStatus = appt.status || appt.bookingStatus;
                const currentVersion = (appt.rescheduleCount || 0) + 1;

                if (currentStatus !== "Confirmed") {
                    claimed.status = "CANCELLED";
                    claimed.lastError = `Appointment status is '${currentStatus}', not 'Confirmed'`;
                    await claimed.save();
                    continue;
                }

                if (claimed.appointmentVersion !== currentVersion) {
                    claimed.status = "CANCELLED";
                    claimed.lastError = `Stale reminder for schedule version ${claimed.appointmentVersion} (current is ${currentVersion})`;
                    await claimed.save();
                    continue;
                }

                // Check patient preferences
                const patientUser = appt.patientId;
                const pSettings = patientUser?.reminderSettings;
                if (pSettings?.enabled === false) {
                    claimed.status = "CANCELLED";
                    claimed.lastError = "Patient preferences disabled reminders";
                    await claimed.save();
                    continue;
                }
                if (claimed.reminderType === "24_HOURS" && pSettings?.reminder24h === false) {
                    claimed.status = "CANCELLED";
                    claimed.lastError = "Patient preferences disabled 24-hour reminder";
                    await claimed.save();
                    continue;
                }
                if (claimed.reminderType === "1_HOUR" && pSettings?.reminder1h === false) {
                    claimed.status = "CANCELLED";
                    claimed.lastError = "Patient preferences disabled 1-hour reminder";
                    await claimed.save();
                    continue;
                }

                const docName = appt.doctorId?.doctorName?.replace(/^dr\.?\s+/i, "") || "Specialist";
                const hospName = appt.hospitalId?.hospitalName || "Hospital";
                const formattedTime = appt.appointmentTime || "";
                const formattedDate = appt.appointmentDate
                    ? new Date(appt.appointmentDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                      })
                    : "";

                // Notification Messages according to specification
                const is24h = claimed.reminderType === "24_HOURS";
                const notificationTitle = is24h
                    ? "Appointment Reminder (Tomorrow)"
                    : "Appointment Reminder (In 1 Hour)";

                const notificationMessage = is24h
                    ? `Your appointment with Dr. ${docName} is scheduled for tomorrow at ${formattedTime} at ${hospName}. Please arrive on time.`
                    : `Reminder: Your appointment with Dr. ${docName} is scheduled in 1 hour. Your appointment time is ${formattedTime}.`;

                // 1. Deliver In-App Notification
                let inAppSuccess = false;
                try {
                    const notif = await Notification.create({
                        userId: claimed.patientId,
                        title: notificationTitle,
                        message: notificationMessage,
                        type: "Appointment",
                        relatedId: claimed.appointmentId,
                    });

                    // Real-time delivery via Socket.IO
                    emitToUser(claimed.patientId, "new_notification", notif);

                    // Real-time unread count update
                    const unreadCount = await Notification.countDocuments({
                        userId: claimed.patientId,
                        isRead: false,
                    });
                    emitUnreadCount(claimed.patientId, unreadCount);

                    inAppSuccess = true;
                } catch (notifErr) {
                    console.error("Reminder in-app notification error:", notifErr);
                }

                // 2. Deliver Email Notification if configured
                let emailSuccess = false;
                if (patientUser?.email && claimed.channels?.email !== false) {
                    try {
                        const emailResult = await sendAppointmentReminderEmail({
                            to: patientUser.email,
                            patientName: patientUser.fullName || "Patient",
                            doctorName: docName,
                            hospitalName: hospName,
                            appointmentDate: formattedDate,
                            appointmentTime: formattedTime,
                            reminderType: claimed.reminderType,
                        });
                        emailSuccess = Boolean(emailResult?.success);
                    } catch (eErr) {
                        console.warn("Reminder email sending skipped/failed:", eErr.message);
                    }
                }

                // Mark reminder as SENT if in-app notification succeeded
                if (inAppSuccess) {
                    claimed.status = "SENT";
                    claimed.sentAt = new Date();
                    claimed.channelResults = {
                        inApp: inAppSuccess,
                        email: emailSuccess,
                    };
                    claimed.lastError = "";
                    await claimed.save();
                } else {
                    throw new Error("Failed to deliver in-app notification");
                }
            } catch (execErr) {
                claimed.attempts = (claimed.attempts || 0) + 1;
                claimed.lastError = execErr.message;
                claimed.status = claimed.attempts >= 3 ? "FAILED" : "PENDING";
                await claimed.save();
            }
        }
    } catch (cronError) {
        console.error("processDueReminders global error:", cronError);
    }
};

/**
 * Admin action to safely retry a failed reminder.
 */
const retryFailedReminder = async (reminderId) => {
    const reminder = await Reminder.findById(reminderId);
    if (!reminder) {
        throw new Error("Reminder not found");
    }
    if (reminder.status !== "FAILED") {
        throw new Error(`Only failed reminders can be retried. Current status is ${reminder.status}`);
    }

    reminder.status = "PENDING";
    reminder.attempts = 0;
    reminder.lastError = "Queued for retry by administrator";
    await reminder.save();

    // Trigger processing
    setImmediate(() => processDueReminders());

    return reminder;
};

module.exports = {
    getAppointmentTimestamp,
    scheduleRemindersForAppointment,
    cancelRemindersForAppointment,
    reconcilePatientReminders,
    processDueReminders,
    retryFailedReminder,
};

