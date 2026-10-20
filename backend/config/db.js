const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        mongoose.set("strictQuery", true);

        const conn = await mongoose.connect(
            process.env.MONGO_URI,
            {
                family: 4,
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                maxPoolSize: 10,
                minPoolSize: 2,
            }
        );

        console.log("================================");
        console.log("✅ MongoDB Connected Successfully");
        console.log("Host:", conn.connection.host);
        console.log("================================");

        mongoose.connection.on("connected", () => {
            console.log("🟢 MongoDB connection established");
        });

        mongoose.connection.on("disconnected", () => {
            console.log("🔴 MongoDB disconnected");
        });

        mongoose.connection.on("reconnected", () => {
            console.log("🟢 MongoDB reconnected");
        });

        mongoose.connection.on("error", (error) => {
            console.error(
                "MongoDB connection error:",
                error.message
            );
        });

    } catch (error) {
        console.error(
            "❌ MongoDB Connection Failed:",
            error.message
        );

        process.exit(1);
    }
};

module.exports = connectDB;