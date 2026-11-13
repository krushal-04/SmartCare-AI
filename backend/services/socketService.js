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
        // Authenticated client joins user-specific room
        socket.on("join", (userId) => {
            if (userId) {
                socket.join(`user_${userId}`);
            }
        });

        // Join role room (e.g. "admin", "hospital", "driver", "patient")
        socket.on("join_role", (role) => {
            if (role) {
                socket.join(`role_${role}`);
            }
        });

        // Hospital joins its dedicated hospital room
        socket.on("join_hospital", (hospitalId) => {
            if (hospitalId) {
                socket.join(`hospital_${hospitalId}`);
            }
        });

        // Driver joins their driver room
        socket.on("join_driver", (driverId) => {
            if (driverId) {
                socket.join(`driver_${driverId}`);
            }
        });

        // Patient, driver, hospital, or admin joins specific emergency room for live tracking
        socket.on("join_emergency", (emergencyId) => {
            if (emergencyId) {
                socket.join(`emergency_${emergencyId}`);
            }
        });

        socket.on("leave_emergency", (emergencyId) => {
            if (emergencyId) {
                socket.leave(`emergency_${emergencyId}`);
            }
        });

        socket.on("disconnect", () => {
            // Connection closed cleanly
        });
    });

    return io;
};

const getIO = () => io;

const emitToUser = (userId, event, data) => {
    if (!io || !userId) return;
    io.to(`user_${userId}`).emit(event, data);
};

const emitToRole = (role, event, data) => {
    if (!io || !role) return;
    io.to(`role_${role}`).emit(event, data);
};

const emitToHospital = (hospitalId, event, data) => {
    if (!io || !hospitalId) return;
    io.to(`hospital_${hospitalId}`).emit(event, data);
};

const emitToDriver = (driverId, event, data) => {
    if (!io || !driverId) return;
    io.to(`driver_${driverId}`).emit(event, data);
    io.to(`user_${driverId}`).emit(event, data);
};

const emitToEmergency = (emergencyId, event, data) => {
    if (!io || !emergencyId) return;
    io.to(`emergency_${emergencyId}`).emit(event, data);
};

const emitUnreadCount = (userId, count) => {
    if (!io || !userId) return;
    io.to(`user_${userId}`).emit("unread_notification_count", { unreadCount: count });
};

/**
 * Universal broadcast for emergency state changes across all interested participants:
 * - Specific emergency tracking room
 * - Target hospital room
 * - Target driver
 * - Patient user room
 * - Admin supervision room
 */
const broadcastEmergencyEvent = (event, data, targets = {}) => {
    if (!io) return;
    const { emergencyId, hospitalId, driverId, patientId } = targets;

    if (emergencyId) {
        io.to(`emergency_${emergencyId}`).emit(event, data);
    }
    if (hospitalId) {
        io.to(`hospital_${hospitalId}`).emit(event, data);
    }
    if (driverId) {
        io.to(`driver_${driverId}`).emit(event, data);
        io.to(`user_${driverId}`).emit(event, data);
    }
    if (patientId) {
        io.to(`user_${patientId}`).emit(event, data);
    }
    // Always notify the admin monitoring room
    io.to("role_admin").emit(event, data);
};

module.exports = {
    initSocket,
    getIO,
    emitToUser,
    emitToRole,
    emitToHospital,
    emitToDriver,
    emitToEmergency,
    emitUnreadCount,
    broadcastEmergencyEvent,
};
