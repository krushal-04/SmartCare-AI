const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'frontend', 'src', 'pages', 'hospital', 'HospitalAppointments.js');
let code = fs.readFileSync(filePath, 'utf8');

const regex = /<Typography fontSize=\{11\.5\} fontWeight=\{750\} color=\{appt\.paymentStatus === "Paid" \? "#065F46" : colors\.slate\}>\s*₹\{appt\.consultationFee \|\| 0\} • \{appt\.paymentStatus \|\| "Free"\}\s*<\/Typography>/;

const replacement = `<Typography
    fontSize={11.5}
    fontWeight={750}
    color={
        (appt.paymentId?.paymentStatus === "Paid" || appt.paymentStatus === "Paid")
            ? "#065F46"
            : (appt.paymentId?.paymentStatus === "Refunded" || appt.paymentStatus === "Refunded")
            ? "#1D4ED8"
            : (Number(appt.consultationFee || 0) === 0 || appt.paymentStatus === "NotRequired")
            ? colors.slate
            : "#B45309"
    }
>
    ₹{appt.consultationFee || 0} • {
        (Number(appt.consultationFee || 0) === 0 || appt.paymentStatus === "NotRequired")
            ? "Free"
            : (appt.paymentId?.paymentStatus || appt.paymentStatus || "Pending")
    }
</Typography>`;

code = code.replace(regex, replacement);
fs.writeFileSync(filePath, code, 'utf8');
console.log('HospitalAppointments.js updated successfully.');
