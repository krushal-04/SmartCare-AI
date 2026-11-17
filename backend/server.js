require("dotenv").config();
const http = require("http");
const dns = require("dns");

// Prioritize IPv4 to prevent 21-second ETIMEDOUT socket hangs on Razorpay & Atlas connections
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
}

const app = require("./app");
const connectDB = require("./config/db");
const { initSocket } = require("./services/socketService");
const { initCronJobs } = require("./services/cronService");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        const server = http.createServer(app);

        // Initialize real-time Socket.IO
        initSocket(server);

        // Initialize background reminder scheduler
        initCronJobs();

        server.listen(PORT, () => {
            console.log("==================================");
            console.log(`Server Running on Port ${PORT}`);
            console.log(`Socket.IO and Reminder Scheduler Active`);
            console.log(`http://localhost:${PORT}`);
            console.log("==================================");
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();
