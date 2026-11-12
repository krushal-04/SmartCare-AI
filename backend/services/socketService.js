const { Server } = require("socket.io");

let io = null;

const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        // Authenticated client joins their user-specific room
        socket.on("join", (userId) => {
            if (userId) {
                const room = `user_${userId}`;
                socket.join(room);
            }
        });

        socket.on("leave", (userId) => {
            if (userId) {
                socket.leave(`user_${userId}`);
            }
        });

        socket.on("disconnect", () => {
            // connection closed cleanly
        });
    });

    return io;
};

const getIO = () => io;

const emitToUser = (userId, event, data) => {
    if (!io || !userId) return;
    io.to(`user_${userId}`).emit(event, data);
};

const emitUnreadCount = (userId, count) => {
    if (!io || !userId) return;
    io.to(`user_${userId}`).emit("unread_notification_count", { unreadCount: count });
};

module.exports = {
    initSocket,
    getIO,
    emitToUser,
    emitUnreadCount,
};

