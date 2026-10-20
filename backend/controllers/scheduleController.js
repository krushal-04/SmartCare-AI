const DoctorSchedule = require("../models/DoctorSchedule");
const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");

// Get schedule for a specific doctor
exports.getDoctorSchedule = async (req, res) => {
    try {
        const { doctorId } = req.params;

        let schedule = await DoctorSchedule.findOne({ doctorId }).populate("doctorId", "doctorName specialization");

        if (!schedule) {
            const doctor = await Doctor.findById(doctorId);
            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    message: "Doctor not found.",
                });
            }

            schedule = await DoctorSchedule.findOneAndUpdate(
                { doctorId },
                {
                    doctorId,
                    workingDays: [
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                    ],
                    startTime: "09:00",
                    endTime: "17:00",
                    slotDuration: 30,
                    leaveDates: [],
                    isActive: true,
                },
                { upsert: true, returnDocument: "after" }
            ).populate("doctorId", "doctorName specialization");
        }

        res.status(200).json({
            success: true,
            schedule,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch schedule.",
        });
    }
};

// Update doctor schedule (Hospital only, verifying ownership)
exports.updateDoctorSchedule = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const {
            workingDays,
            startTime,
            endTime,
            slotDuration,
            leaveDates,
            isActive,
        } = req.body;

        const hospital = await Hospital.findOne({ userId: req.user._id });
        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: "Hospital profile not found.",
            });
        }

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found.",
            });
        }

        if (String(doctor.hospitalId) !== String(hospital._id)) {
            return res.status(403).json({
                success: false,
                message: "You can only update schedules for doctors in your hospital.",
            });
        }

        const updateData = {};
        if (Array.isArray(workingDays)) updateData.workingDays = workingDays;
        if (startTime) updateData.startTime = startTime;
        if (endTime) updateData.endTime = endTime;
        if (slotDuration) updateData.slotDuration = Number(slotDuration);
        if (Array.isArray(leaveDates)) updateData.leaveDates = leaveDates;
        if (typeof isActive === "boolean") updateData.isActive = isActive;

        const schedule = await DoctorSchedule.findOneAndUpdate(
            { doctorId },
            updateData,
            { upsert: true, returnDocument: "after" }
        ).populate("doctorId", "doctorName specialization");

        res.status(200).json({
            success: true,
            message: "Doctor schedule updated successfully.",
            schedule,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update schedule.",
        });
    }
};

// Get all schedules for the logged-in hospital's doctors
exports.getHospitalSchedules = async (req, res) => {
    try {
        const hospital = await Hospital.findOne({ userId: req.user._id });
        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: "Hospital profile not found.",
            });
        }

        const doctors = await Doctor.find({ hospitalId: hospital._id }).select("_id doctorName specialization departmentId");
        const doctorIds = doctors.map((d) => d._id);

        const schedules = await DoctorSchedule.find({ doctorId: { $in: doctorIds } }).populate("doctorId", "doctorName specialization");

        res.status(200).json({
            success: true,
            schedules,
            doctors,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch hospital schedules.",
        });
    }
};
