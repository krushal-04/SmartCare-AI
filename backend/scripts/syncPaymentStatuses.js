const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const Payment = require("../models/Payment");

async function sync() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected successfully.");

        const paidPayments = await Payment.find({ paymentStatus: "Paid" }).lean();
        console.log(`Found ${paidPayments.length} Paid payment records.`);

        let syncedCount = 0;
        for (const p of paidPayments) {
            if (!p.appointmentId) continue;

            const appt = await Appointment.findById(p.appointmentId);
            if (appt) {
                let needsUpdate = false;
                const updateFields = {};

                if (appt.paymentStatus !== "Paid") {
                    updateFields.paymentStatus = "Paid";
                    needsUpdate = true;
                }

                if (!appt.paymentId || String(appt.paymentId) !== String(p._id)) {
                    updateFields.paymentId = p._id;
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    await Appointment.updateOne({ _id: appt._id }, { $set: updateFields });
                    console.log(`Synced Appointment #${appt._id}:`, updateFields);
                    syncedCount++;
                }
            }
        }

        console.log(`Synchronization complete. Updated ${syncedCount} appointments.`);
        process.exit(0);
    } catch (err) {
        console.error("Sync error:", err.message);
        process.exit(1);
    }
}

sync();
