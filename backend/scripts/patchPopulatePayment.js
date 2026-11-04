const fs = require('fs');
const path = require('path');

const apptCtrlPath = path.join(__dirname, '..', 'controllers', 'appointmentController.js');
let code = fs.readFileSync(apptCtrlPath, 'utf8');

const regex = /\.populate\(\s*"departmentId",\s*"departmentName"\s*\)\s*\.lean\(\);/g;

code = code.replace(regex, `.populate(
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
        }`);

fs.writeFileSync(apptCtrlPath, code, 'utf8');
console.log('Successfully replaced with regex.');
