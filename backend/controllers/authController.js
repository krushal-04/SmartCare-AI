const User = require("../models/User");
const Notification = require("../models/Notification");
const emailService = require("../services/emailService");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");

const registerUser = async (req, res) => {
    try {
        const { fullName, email, phone, password, role } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({
                success: false,
                message: "Email already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(`[Auth] Registering role: ${role} - ${email}`);

        const user = await User.create({
            fullName,
            email,
            phone,
            password: hashedPassword,
            role,
            isApproved: role === "hospital" ? false : true,
            isVerified: false,
            status: role === "hospital" ? "Pending" : "Approved",
        });

        if (role === "hospital") {
            // Acknowledgment email to registering hospital
            emailService.sendHospitalRegistrationEmail(user).catch((e) =>
                console.error("[EmailService] Hospital registration email error:", e.message)
            );

            // In-app alert and email to all admins
            try {
                const admins = await User.find({ role: "admin" }).select("_id email");
                for (const admin of admins) {
                    await Notification.create({
                        userId: admin._id,
                        title: "New Hospital Registration",
                        message: `${fullName} has registered as a hospital and is waiting for review.`,
                        type: "Hospital",
                        relatedId: user._id,
                        isRead: false,
                    });
                    emailService.sendAdminNewHospitalNotification(user, admin.email).catch((e) =>
                        console.error("[EmailService] Admin new hospital alert error:", e.message)
                    );
                }
            } catch (notifErr) {
                console.error("Admin notification creation error:", notifErr);
            }
            return res.status(201).json({
                success: true,
                message: "Hospital registered successfully. Awaiting administrator review and approval.",
            });
        }

        res.status(201).json({
            success: true,
            message: "Registration Successful",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please enter email and password",
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid Password",
            });
        }

        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated. Please contact support.",
            });
        }

        if (user.role === "hospital") {
            if (user.status === "Rejected") {
                return res.status(403).json({
                    success: false,
                    message: user.rejectionReason
                        ? `Your hospital registration / approval was rejected or cancelled: ${user.rejectionReason}`
                        : "Your hospital registration or approval has been cancelled by administration.",
                });
            }

            if (user.status !== "Approved" || !user.isApproved) {
                return res.status(403).json({
                    success: false,
                    message: "Your hospital registration is pending administrator approval. You will receive an email once approved.",
                });
            }
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: "Login Successful",
            token,
            user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getCurrentUser = async (req, res) => {
    res.status(200).json({ success: true, user: req.user });
};

const updateCurrentUser = async (req, res) => {
    try {
        const { fullName, email, phone } = req.body;
        if (!fullName || !email || !phone) {
            return res.status(400).json({ success: false, message: "Full name, email and phone are required" });
        }
        const existingUser = await User.findOne({
            _id: { $ne: req.user._id },
            $or: [{ email: email.toLowerCase().trim() }, { phone: phone.trim() }],
        });
        if (existingUser) return res.status(400).json({ success: false, message: "This email address or phone number is already in use" });

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { fullName: fullName.trim(), email: email.toLowerCase().trim(), phone: phone.trim() },
            { new: true, runValidators: true }
        ).select("-password");
        res.status(200).json({ success: true, message: "Profile updated", user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getCurrentUser,
    updateCurrentUser,
};
