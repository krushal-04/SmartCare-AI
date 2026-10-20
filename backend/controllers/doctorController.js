const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");
const Department = require("../models/Department");
const DoctorSchedule = require("../models/DoctorSchedule");

// Add Doctor (Hospital or Admin)
const addDoctor = async (req, res) => {
    try {
        let hospitalId = req.body.hospitalId;

        if (req.user.role === "hospital") {
            const hospital = await Hospital.findOne({ userId: req.user._id });
            if (!hospital) {
                return res.status(404).json({
                    success: false,
                    message: "Hospital profile not found.",
                });
            }
            hospitalId = hospital._id;
        } else if (req.user.role === "admin") {
            if (!hospitalId) {
                return res.status(400).json({
                    success: false,
                    message: "Please specify hospitalId for this doctor.",
                });
            }
        }

        const {
            departmentId,
            doctorName,
            email,
            phone,
            qualification,
            specialization,
            experience,
            consultationFee,
            gender,
            languages,
            doctorImage,
        } = req.body;

        if (!doctorName?.trim() || !email?.trim() || !phone?.trim() || !departmentId) {
            return res.status(400).json({
                success: false,
                message: "Doctor name, email, phone, and department are required.",
            });
        }

        // Validate department belongs to hospital
        const department = await Department.findOne({
            _id: departmentId,
            hospitalId,
        });

        if (!department) {
            return res.status(400).json({
                success: false,
                message: "Selected department does not exist in this hospital.",
            });
        }

        const parsedLanguages = Array.isArray(languages)
            ? languages
            : typeof languages === "string"
            ? languages.split(",").map((s) => s.trim()).filter(Boolean)
            : [];

        const doctor = await Doctor.create({
            hospitalId,
            departmentId,
            doctorName: doctorName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            qualification: qualification?.trim() || "MBBS",
            specialization: specialization?.trim() || department.departmentName,
            experience: Number(experience) || 0,
            consultationFee: Number(consultationFee) || 0,
            gender: gender || "Other",
            languages: parsedLanguages,
            doctorImage: req.file ? (req.file.path || req.file.secure_url) : (doctorImage || ""),
        });

        // Auto-create default active schedule: Mon-Sat, 09:00 - 17:00, 30 min slots
        await DoctorSchedule.findOneAndUpdate(
            { doctorId: doctor._id },
            {
                doctorId: doctor._id,
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
        ).catch((err) => console.error("Auto-schedule creation error:", err.message));

        await doctor.populate("departmentId", "departmentName");
        await doctor.populate("hospitalId", "hospitalName city");

        res.status(201).json({
            success: true,
            message: "Doctor added successfully with default schedule.",
            doctor,
        });
    } catch (error) {
        console.error("addDoctor error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to add doctor.",
        });
    }
};

// Get all doctors (Public or Admin, supports hospitalId and departmentId filters)
const getDoctors = async (req, res) => {
    try {
        const query = {};
        if (req.query.hospitalId) query.hospitalId = req.query.hospitalId;
        if (req.query.departmentId) query.departmentId = req.query.departmentId;

        const doctors = await Doctor.find(query)
            .populate("hospitalId", "hospitalName city state")
            .populate("departmentId", "departmentName")
            .lean();

        res.status(200).json({
            success: true,
            doctors,
        });
    } catch (error) {
        console.error("getDoctors error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch doctors.",
        });
    }
};

// Get doctors for logged-in hospital
const getHospitalDoctors = async (req, res) => {
    try {
        const hospital = await Hospital.findOne({ userId: req.user._id });
        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: "Hospital profile not found.",
            });
        }

        const doctors = await Doctor.find({ hospitalId: hospital._id })
            .populate("departmentId", "departmentName")
            .lean();

        res.status(200).json({
            success: true,
            doctors,
        });
    } catch (error) {
        console.error("getHospitalDoctors error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch hospital doctors.",
        });
    }
};

// Get doctor by ID
const getDoctorById = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id)
            .populate("hospitalId", "hospitalName city address hospitalPhone")
            .populate("departmentId", "departmentName description")
            .lean();

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found.",
            });
        }

        res.status(200).json({
            success: true,
            doctor,
        });
    } catch (error) {
        console.error("getDoctorById error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch doctor.",
        });
    }
};

// Update Doctor with strict ownership check
const updateDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found.",
            });
        }

        // Security check: hospital can only edit its own doctor
        if (req.user.role === "hospital") {
            const hospital = await Hospital.findOne({ userId: req.user._id });
            if (!hospital || String(doctor.hospitalId) !== String(hospital._id)) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized: You can only edit doctors belonging to your hospital.",
                });
            }
        }

        const {
            departmentId,
            doctorName,
            email,
            phone,
            qualification,
            specialization,
            experience,
            consultationFee,
            gender,
            languages,
            doctorImage,
        } = req.body;

        if (departmentId) {
            // Verify new department belongs to this hospital
            const dept = await Department.findOne({
                _id: departmentId,
                hospitalId: doctor.hospitalId,
            });
            if (!dept) {
                return res.status(400).json({
                    success: false,
                    message: "Selected department does not exist in this hospital.",
                });
            }
            doctor.departmentId = departmentId;
        }

        if (doctorName) doctor.doctorName = doctorName.trim();
        if (email) doctor.email = email.trim().toLowerCase();
        if (phone) doctor.phone = phone.trim();
        if (qualification) doctor.qualification = qualification.trim();
        if (specialization) doctor.specialization = specialization.trim();
        if (experience !== undefined) doctor.experience = Number(experience);
        if (consultationFee !== undefined) doctor.consultationFee = Number(consultationFee);
        if (gender) doctor.gender = gender;
        if (languages !== undefined) {
            doctor.languages = Array.isArray(languages)
                ? languages
                : typeof languages === "string"
                ? languages.split(",").map((s) => s.trim()).filter(Boolean)
                : doctor.languages;
        }
        if (req.file) {
            doctor.doctorImage = req.file.path || req.file.secure_url;
        } else if (doctorImage !== undefined) {
            doctor.doctorImage = doctorImage;
        }

        await doctor.save();
        await doctor.populate("departmentId", "departmentName");

        res.status(200).json({
            success: true,
            message: "Doctor updated successfully.",
            doctor,
        });
    } catch (error) {
        console.error("updateDoctor error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update doctor.",
        });
    }
};

// Delete Doctor with strict ownership check and schedule cleanup
const deleteDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found.",
            });
        }

        // Security check: hospital can only delete its own doctor
        if (req.user.role === "hospital") {
            const hospital = await Hospital.findOne({ userId: req.user._id });
            if (!hospital || String(doctor.hospitalId) !== String(hospital._id)) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized: You can only delete doctors belonging to your hospital.",
                });
            }
        }

        // Inactivate or remove schedule
        await DoctorSchedule.deleteMany({ doctorId: doctor._id });
        await doctor.deleteOne();

        res.status(200).json({
            success: true,
            message: "Doctor and associated schedule deleted successfully.",
        });
    } catch (error) {
        console.error("deleteDoctor error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete doctor.",
        });
    }
};

module.exports = {
    addDoctor,
    getDoctors,
    getHospitalDoctors,
    getDoctorById,
    updateDoctor,
    deleteDoctor,
};