const fs = require('fs');
const path = require('path');

const apptCtrlPath = path.join(__dirname, '..', 'controllers', 'appointmentController.js');
let code = fs.readFileSync(apptCtrlPath, 'utf8');

// 1. In createAppointment, ensure default status is Pending
code = code.replace(
    /status:\s*"Confirmed",\s*bookingStatus:\s*"Confirmed",/,
    'status: "Pending",\n                bookingStatus: "Pending",'
);

// 2. In updateAppointmentStatus, update bookingStatus and record audit timestamps
const oldUpdate = `        appointment.status = status;
        if (notes !== undefined) {
            appointment.notes = notes.trim();
        }

        await appointment.save();`;

const newUpdate = `        appointment.status = status;
        appointment.bookingStatus = status;

        if (status === "Confirmed") {
            appointment.approvedAt = new Date();
            appointment.approvedBy = req.user._id;
        } else if (status === "Rejected") {
            appointment.rejectedAt = new Date();
            appointment.rejectedBy = req.user._id;
            if (notes) appointment.rejectionReason = notes.trim();
        } else if (status === "Cancelled") {
            appointment.cancelledAt = new Date();
            appointment.cancelledBy = req.user.role;
            if (notes) appointment.cancellationReason = notes.trim();
        }

        if (notes !== undefined) {
            appointment.notes = notes.trim();
        }

        await appointment.save();`;

if (code.includes(oldUpdate)) {
    code = code.replace(oldUpdate, newUpdate);
} else {
    console.warn("Could not find exact oldUpdate block; attempting regex replace");
    code = code.replace(
        /appointment\.status = status;\s*if\s*\(notes !== undefined\)\s*\{\s*appointment\.notes = notes\.trim\(\);\s*\}\s*await appointment\.save\(\);/,
        newUpdate
    );
}

// 3. Add getAppointmentById controller if not already present
if (!code.includes("exports.getAppointmentById")) {
    const getApptByIdCode = `
exports.getAppointmentById = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate("hospitalId", "hospitalName city state address hospitalPhone")
            .populate("doctorId", "doctorName specialization qualification doctorImage consultationFee")
            .populate("departmentId", "name departmentName")
            .populate("patientId", "fullName email phone");

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found.",
            });
        }

        res.status(200).json({
            success: true,
            appointment,
        });
    } catch (error) {
        console.error("getAppointmentById error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load appointment details.",
        });
    }
};
`;
    code += "\n" + getApptByIdCode;
}

fs.writeFileSync(apptCtrlPath, code, 'utf8');
console.log('appointmentController.js successfully updated.');
