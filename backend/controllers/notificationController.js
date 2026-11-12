const Notification = require("../models/Notification");
const { emitUnreadCount } = require("../services/socketService");

exports.getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            userId: req.user._id,
        })
            .sort({
                createdAt: -1,
            })
            .limit(100)
            .lean();

        const unreadCount = notifications.filter((item) => !item.isRead).length;

        res.status(200).json({
            success: true,
            notifications,
            unreadCount,
        });
    } catch (error) {
        console.error("getMyNotifications:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load notifications.",
        });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const unreadCount = await Notification.countDocuments({
            userId: req.user._id,
            isRead: false,
        });

        res.status(200).json({
            success: true,
            unreadCount,
        });
    } catch (error) {
        console.error("getUnreadCount error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to retrieve unread notification count.",
        });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.user._id,
            },
            {
                isRead: true,
            },
            {
                new: true,
            }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found.",
            });
        }

        // Compute updated unread count and emit in real-time
        const unreadCount = await Notification.countDocuments({
            userId: req.user._id,
            isRead: false,
        });
        emitUnreadCount(req.user._id, unreadCount);

        res.status(200).json({
            success: true,
            notification,
            unreadCount,
        });
    } catch (error) {
        console.error("markAsRead:", error);
        res.status(500).json({
            success: false,
            message: "Unable to update notification.",
        });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            {
                userId: req.user._id,
                isRead: false,
            },
            {
                isRead: true,
            }
        );

        // Emit 0 unread count in real-time
        emitUnreadCount(req.user._id, 0);

        res.status(200).json({
            success: true,
            message: "All notifications marked as read.",
            unreadCount: 0,
        });
    } catch (error) {
        console.error("markAllAsRead:", error);
        res.status(500).json({
            success: false,
            message: "Unable to update notifications.",
        });
    }
};
