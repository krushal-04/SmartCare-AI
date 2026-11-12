const cron = require("node-cron");
const { processDueReminders } = require("./reminderService");

let cronJob = null;

const initCronJobs = () => {
    if (cronJob) return cronJob;

    console.log("[Scheduler] Initializing automated background reminder scheduler (every minute)...");

    // Run every minute
    cronJob = cron.schedule("* * * * *", async () => {
        try {
            await processDueReminders();
        } catch (err) {
            console.error("[Scheduler] Error in reminder scheduler job:", err.message);
        }
    });

    // Also run an immediate check on startup to handle any reminders that became due while server was down
    setImmediate(async () => {
        try {
            console.log("[Scheduler] Running initial startup check for due reminders...");
            await processDueReminders();
        } catch (e) {
            console.error("[Scheduler] Initial check error:", e.message);
        }
    });

    return cronJob;
};

module.exports = {
    initCronJobs,
};

