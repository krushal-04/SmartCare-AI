const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");

async function migrate() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected successfully to MongoDB.");

        const appointments = await Appointment.find({}).lean();
        console.log(`Found ${appointments.length} total appointment records in MongoDB.`);

        let updatedCount = 0;
        for (const appt of appointments) {
            const updates = {};

            // 1. Normalize bookingStatus
            let currentBooking = appt.bookingStatus;
            if (!currentBooking || currentBooking === "PendingPayment" || currentBooking.toLowerCase() === "pending") {
                if (currentBooking !== "Pending") {
                    updates.bookingStatus = "Pending";
                }
            } else if (currentBooking.toLowerCase() === "confirmed") {
                if (currentBooking !== "Confirmed") updates.bookingStatus = "Confirmed";
            } else if (currentBooking.toLowerCase() === "completed") {
                if (currentBooking !== "Completed") updates.bookingStatus = "Completed";
            } else if (currentBooking.toLowerCase() === "cancelled") {
                if (currentBooking !== "Cancelled") updates.bookingStatus = "Cancelled";
            } else if (currentBooking.toLowerCase() === "rejected") {
                if (currentBooking !== "Rejected") updates.bookingStatus = "Rejected";
            }

            // If bookingStatus was completely undefined, infer from status:
            if (!appt.bookingStatus) {
                if (["Confirmed", "Completed", "Cancelled", "Rejected"].includes(appt.status)) {
                    updates.bookingStatus = appt.status;
                } else {
                    updates.bookingStatus = "Pending";
                }
            }

            // 2. Normalize status
            if (!appt.status) {
                updates.status = updates.bookingStatus || "Pending";
            } else if (appt.status.toLowerCase() === "pending" && appt.status !== "Pending") {
                updates.status = "Pending";
            } else if (appt.status.toLowerCase() === "confirmed" && appt.status !== "Confirmed") {
                updates.status = "Confirmed";
            } else if (appt.status.toLowerCase() === "completed" && appt.status !== "Completed") {
                updates.status = "Completed";
            } else if (appt.status.toLowerCase() === "cancelled" && appt.status !== "Cancelled") {
                updates.status = "Cancelled";
            } else if (appt.status.toLowerCase() === "rejected" && appt.status !== "Rejected") {
                updates.status = "Rejected";
            }

            // 3. Normalize paymentStatus
            if (!appt.paymentStatus) {
                if (Number(appt.consultationFee || 0) === 0) {
                    updates.paymentStatus = "NotRequired";
                } else {
                    updates.paymentStatus = "Pending";
                }
            }

            if (Object.keys(updates).length > 0) {
                await Appointment.updateOne({ _id: appt._id }, { $set: updates });
                updatedCount++;
                console.log(`Updated Appointment #${appt._id}:`, updates);
            }
        }

        console.log(`Migration complete. Updated ${updatedCount} / ${appointments.length} appointment records.`);
        process.exit(0);
    } catch (err) {
        console.error("Migration error:", err.message);
        process.exit(1);
    }
}

migrate();
