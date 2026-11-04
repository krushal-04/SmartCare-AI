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

        // 1. Sync Paid / Refunded from Payment collection to Appointment collection
        const allPayments = await Payment.find().lean();
        console.log(`Found ${allPayments.length} total payment records.`);

        for (const p of allPayments) {
            if (!p.appointmentId) continue;
            const appt = await Appointment.findById(p.appointmentId);
            if (appt) {
                const updateFields = {};
                if (p.paymentStatus === "Paid" && appt.paymentStatus !== "Paid") {
                    updateFields.paymentStatus = "Paid";
                }
                if (p.paymentStatus === "Refunded" && appt.paymentStatus !== "Refunded") {
                    updateFields.paymentStatus = "Refunded";
                }
                if (!appt.paymentId) {
                    updateFields.paymentId = p._id;
                }
                if (Object.keys(updateFields).length > 0) {
                    await Appointment.updateOne({ _id: appt._id }, { $set: updateFields });
                    console.log(`Updated Appt #${appt._id}:`, updateFields);
                }
            }
        }

        // 2. Free appointments should have NotRequired paymentStatus
        const freeRes = await Appointment.updateMany(
            {
                $or: [
                    { consultationFee: { $lte: 0 } },
                    { consultationFee: { $exists: false } },
                    { paymentRequired: false },
                ],
                paymentStatus: { $nin: ["Paid", "Refunded"] },
            },
            { $set: { paymentStatus: "NotRequired" } }
        );
        console.log(`Updated free appointments to NotRequired: ${freeRes.modifiedCount}`);

        console.log("Sync finished successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Sync error:", err.message);
        process.exit(1);
    }
}

sync();
