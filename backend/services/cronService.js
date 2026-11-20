const cron = require("node-cron");
const { processDueReminders } = require("./reminderService");
const { processPastAndExpiredAppointments } = require("./appointmentExpirationService");

let cronJob = null;

const initCronJobs = () => {
    if (cronJob) return cronJob;

    console.log("[Scheduler] Initializing automated background reminder & appointment expiration scheduler (every minute)...");

    // Run every minute
    cronJob = cron.schedule("* * * * *", async () => {
        try {
            await processDueReminders();
        } catch (err) {
            console.error("[Scheduler] Error in reminder scheduler job:", err.message);
        }

        try {
            await processPastAndExpiredAppointments();
        } catch (err) {
            console.error("[Scheduler] Error in appointment expiration job:", err.message);
        }
    });

    // Also run an immediate check on startup to handle any reminders or expired appointments while server was down
    setImmediate(async () => {
        try {
            console.log("[Scheduler] Running initial startup check for due reminders & expired appointments...");
            await processDueReminders();
            await processPastAndExpiredAppointments();
        } catch (e) {
            console.error("[Scheduler] Initial check error:", e.message);
        }
    });

    return cronJob;
};

module.exports = {
    initCronJobs,
};

