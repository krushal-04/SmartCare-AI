const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please login.",
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication token missing.",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account not found.",
            });
        }

        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated. Please contact support.",
            });
        }

        if (user.status === "Rejected") {
            return res.status(403).json({
                success: false,
                message: user.rejectionReason
                    ? `Your account was rejected: ${user.rejectionReason}`
                    : "Your account has been rejected by administration.",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("protect middleware error:", error.message);
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token.",
        });
    }
};

const patientOnly = (req, res, next) => {
    if (!req.user || req.user.role !== "patient") {
        return res.status(403).json({
            success: false,
            message: "Access restricted to patients only.",
        });
    }
    next();
};

const hospitalOnly = (req, res, next) => {
    if (!req.user || req.user.role !== "hospital") {
        return res.status(403).json({
            success: false,
            message: "Access restricted to hospitals only.",
        });
    }

    if (!req.user.isApproved || req.user.status !== "Approved") {
        return res.status(403).json({
            success: false,
            message: "Hospital account is pending administrator approval or has been restricted.",
        });
    }

    next();
};

const doctorOnly = (req, res, next) => {
    if (!req.user || req.user.role !== "doctor") {
        return res.status(403).json({
            success: false,
            message: "Access restricted to doctors only.",
        });
    }
    next();
};

const driverOnly = (req, res, next) => {
    if (!req.user || req.user.role !== "driver") {
        return res.status(403).json({
            success: false,
            message: "Access restricted to ambulance drivers only.",
        });
    }
    next();
};

const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access restricted to administrators only.",
        });
    }
    next();
};

const hospitalOrAdmin = (req, res, next) => {
    if (!req.user || (req.user.role !== "hospital" && req.user.role !== "admin")) {
        return res.status(403).json({
            success: false,
            message: "Access restricted to hospitals and administrators only.",
        });
    }

    if (req.user.role === "hospital" && (!req.user.isApproved || req.user.status !== "Approved")) {
        return res.status(403).json({
            success: false,
            message: "Hospital account is pending administrator approval or has been restricted.",
        });
    }

    next();
};

const driverOrHospitalOrAdmin = (req, res, next) => {
    if (
        !req.user ||
        (req.user.role !== "driver" &&
            req.user.role !== "hospital" &&
            req.user.role !== "admin")
    ) {
        return res.status(403).json({
            success: false,
            message: "Access restricted to ambulance drivers, hospitals, and administrators.",
        });
    }
    next();
};

const doctorOrHospitalOrAdmin = (req, res, next) => {
    if (
        !req.user ||
        (req.user.role !== "doctor" &&
            req.user.role !== "hospital" &&
            req.user.role !== "admin")
    ) {
        return res.status(403).json({
            success: false,
            message: "Access restricted to medical personnel, hospitals, and administrators.",
        });
    }
    next();
};

module.exports = {
    protect,
    patientOnly,
    hospitalOnly,
    doctorOnly,
    driverOnly,
    adminOnly,
    hospitalOrAdmin,
    driverOrHospitalOrAdmin,
    doctorOrHospitalOrAdmin,
};
