const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Please login first"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        req.user = user;

        next();

    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }
};

const hospitalOnly = (req, res, next) => {
    if (req.user.role !== "hospital") {
        return res.status(403).json({
            success: false,
            message: "Hospital access only"
        });
    }

    if (!req.user.isApproved) {
        return res.status(403).json({
            success: false,
            message: "Hospital is not approved"
        });
    }

    next();
};

const adminOnly = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Admin access only"
        });
    }

    next();
};

const patientOnly = (req, res, next) => {
    if (req.user.role !== "patient") {
        return res.status(403).json({
            success: false,
            message: "Patient access only"
        });
    }

    next();
};

module.exports = {
    protect,
    hospitalOnly,
    adminOnly,
    patientOnly
};