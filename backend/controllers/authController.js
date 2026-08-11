const User = require("../models/User");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");

const registerUser = async (req, res) => {
    try {

        const { fullName, email, phone, password, role } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(role);
        const user = await User.create({
            fullName,
            email,
            phone,
            password: hashedPassword,
            role,
            isApproved: role === "hospital" ? false : true,
            isVerified: false,
            status: role === "hospital" ? "Pending" : "Approved"
        });

        if (role === "hospital") {
            return res.status(201).json({
                success: true,
                message: "Hospital registered successfully. Waiting for admin approval."
            });
        }

        res.status(201).json({
            success: true,
            message: "Registration Successful"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please enter email and password"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid Password"
            });
        }

        if (user.role === "hospital") {

            if (user.status === "Pending") {
                return res.status(403).json({
                    success: false,
                    message: "Your registration is waiting for admin approval."
                });
            }

            if (user.status === "Rejected") {
                return res.status(403).json({
                    success: false,
                    message: "Your registration has been rejected."
                });
            }

        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: "Login Successful",
            token,
            user
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

module.exports = {
    registerUser,
    loginUser
};