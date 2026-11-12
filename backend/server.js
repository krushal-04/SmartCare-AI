require("dotenv").config();
const http = require("http");

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
