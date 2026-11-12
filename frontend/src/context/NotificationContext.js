import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext({
    unreadCount: 0,
    refreshUnreadCount: () => {},
    markAsRead: async () => {},
    markAllAsRead: async () => {},
});

const SOCKET_URL = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace(/\/api\/?$/, "")
    : "http://localhost:5000";

export function NotificationProvider({ children }) {
    const { user, isAuthenticated } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const socketRef = useRef(null);

    const refreshUnreadCount = useCallback(async () => {
        if (!isAuthenticated || !user) {
            setUnreadCount(0);
            return;
        }
        try {
            const res = await api.get("/notifications/unread-count");
            if (res.data?.success && typeof res.data.unreadCount === "number") {
                setUnreadCount(res.data.unreadCount);
            }
        } catch (err) {
            // Silently handle if unauthenticated or network issue
        }
    }, [isAuthenticated, user]);

    // Initial fetch on login / user change
    useEffect(() => {
        if (isAuthenticated && user?._id) {
            refreshUnreadCount();
        } else {
            setUnreadCount(0);
        }
    }, [isAuthenticated, user, refreshUnreadCount]);

    // Real-time Socket.IO connection
    useEffect(() => {
        if (!isAuthenticated || !user?._id) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            return;
        }

        const socket = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit("join", user._id);
        });

        // Listen for real-time count updates
        socket.on("unread_notification_count", (data) => {
            if (data && typeof data.unreadCount === "number") {
                setUnreadCount(data.unreadCount);
            }
        });

        // Listen for new incoming notification
        socket.on("new_notification", () => {
            setUnreadCount((prev) => prev + 1);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [isAuthenticated, user]);

    const markAsRead = useCallback(async (id) => {
        try {
            const res = await api.patch(`/notifications/${id}/read`);
            if (res.data?.success) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
            return res.data;
        } catch (err) {
            // Fallback to PUT
            try {
                const res = await api.put(`/notifications/${id}/read`);
                if (res.data?.success) {
                    setUnreadCount((prev) => Math.max(0, prev - 1));
                }
                return res.data;
            } catch (putErr) {
                throw putErr;
            }
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            const res = await api.patch("/notifications/read-all");
            setUnreadCount(0);
            return res.data;
        } catch (err) {
            // Fallback to PUT
            try {
                const res = await api.put("/notifications/read-all");
                setUnreadCount(0);
                return res.data;
            } catch (putErr) {
                throw putErr;
            }
        }
    }, []);

    const value = {
        unreadCount,
        refreshUnreadCount,
        markAsRead,
        markAllAsRead,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    return useContext(NotificationContext);
}

