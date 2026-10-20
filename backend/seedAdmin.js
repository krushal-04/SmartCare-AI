require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");
const connectDB = require("./config/db");

const ADMIN_CREDENTIALS = {
    fullName: "System Administrator",
    email: "smartcareai.admin@gmail.com",
    phone: "9999988888",
    password: "Password@123", // Set or change the default Admin password here
    role: "admin",
    isApproved: true,
    isVerified: true,
    status: "Approved",
};

async function seedAdmin() {
    try {
        await connectDB();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(ADMIN_CREDENTIALS.password, salt);

        const existingAdmin = await User.findOne({
            $or: [
                { email: ADMIN_CREDENTIALS.email },
                { role: "admin" },
                { phone: ADMIN_CREDENTIALS.phone },
            ],
        });

        if (existingAdmin) {
            existingAdmin.email = ADMIN_CREDENTIALS.email;
            existingAdmin.fullName = ADMIN_CREDENTIALS.fullName;
            existingAdmin.phone = ADMIN_CREDENTIALS.phone;
            existingAdmin.password = hashedPassword;
            existingAdmin.role = "admin";
            existingAdmin.isApproved = true;
            existingAdmin.isVerified = true;
            existingAdmin.status = "Approved";
            await existingAdmin.save();
            console.log(` Admin user updated: ${ADMIN_CREDENTIALS.email} / ${ADMIN_CREDENTIALS.password}`);
        } else {
            await User.create({
                ...ADMIN_CREDENTIALS,
                password: hashedPassword,
            });
            console.log(` Admin user created: ${ADMIN_CREDENTIALS.email} / ${ADMIN_CREDENTIALS.password}`);
        }

        process.exit(0);
    } catch (error) {
        console.error(" Failed to seed admin user:", error);
        process.exit(1);
    }
}

seedAdmin();
