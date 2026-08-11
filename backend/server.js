require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/database/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log("==================================");
            console.log(` Server Running on Port ${PORT}`);
            console.log(` http://localhost:${PORT}`);
            console.log("==================================");
        });
    } catch (error) {
        console.error(" Server failed to start");
    }
};

startServer();