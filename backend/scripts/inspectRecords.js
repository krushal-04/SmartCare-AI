const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
require("../models/Doctor");
require("../models/Hospital");
require("../models/Department");
require("../models/User");
const Appointment = require("../models/Appointment");
const Payment = require("../models/Payment");

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const payments = await Payment.find().lean();
    console.log("=== PAYMENTS ===");
    for (const p of payments) {
        console.log(`Payment #${p._id}: apptId=${p.appointmentId}, status=${p.paymentStatus}, gatewayId=${p.gatewayPaymentId}, amount=${p.amount}`);
    }

    const appts = await Appointment.find().populate("doctorId", "doctorName").lean();
    console.log("\n=== APPOINTMENTS ===");
    for (const a of appts) {
        console.log(`Appt #${a._id}: doc=${a.doctorId?.doctorName}, date=${a.appointmentDate?.toISOString().slice(0,10)}, time=${a.appointmentTime}, status=${a.status}, bookingStatus=${a.bookingStatus}, paymentStatus=${a.paymentStatus}, paymentId=${a.paymentId}`);
    }
    process.exit(0);
}
check();
