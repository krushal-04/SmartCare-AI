const Reminder = require("../models/Reminder");
const { retryFailedReminder } = require("../services/reminderService");

exports.getReminderMonitoring = async (req, res) => {
    try {
        const { status, search } = req.query;

        const query = {};
        if (status && status !== "ALL") {
            query.status = status;
        }

        const [
            totalReminders,
            pendingCount,
            sentCount,
            failedCount,
            cancelledCount,
            reminders,
        ] = await Promise.all([
            Reminder.countDocuments({}),
            Reminder.countDocuments({ status: "PENDING" }),
            Reminder.countDocuments({ status: "SENT" }),
            Reminder.countDocuments({ status: "FAILED" }),
            Reminder.countDocuments({ status: "CANCELLED" }),
            Reminder.find(query)
                .sort({ scheduledAt: -1, createdAt: -1 })
                .limit(200)
                .populate("patientId", "fullName email phone")
                .populate("doctorId", "doctorName specialization")
                .populate("hospitalId", "hospitalName city")
                .populate("appointmentId", "appointmentDate appointmentTime status bookingStatus")
                .lean(),
        ]);

        res.status(200).json({
            success: true,
            stats: {
                totalReminders,
                pendingCount,
                sentCount,
                failedCount,
                cancelledCount,
            },
            reminders,
        });
    } catch (error) {
        console.error("getReminderMonitoring error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to retrieve reminder monitoring records.",
        });
    }
};

exports.retryReminder = async (req, res) => {
    try {
        const reminder = await retryFailedReminder(req.params.id);
        res.status(200).json({
            success: true,
            message: "Reminder queued for retry successfully.",
            reminder,
        });
    } catch (error) {
        console.error("retryReminder error:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to retry reminder.",
        });
    }
};

