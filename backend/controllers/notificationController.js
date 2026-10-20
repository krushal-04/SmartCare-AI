const Notification = require("../models/Notification");

exports.getMyNotifications =
    async (req, res) => {
        try {
            const notifications =
                await Notification.find({
                    userId:
                        req.user._id,
                })
                    .sort({
                        createdAt: -1,
                    })
                    .limit(100)
                    .lean();

            const unreadCount =
                notifications.filter(
                    (item) =>
                        !item.isRead
                ).length;

            res.status(200).json({
                success: true,
                notifications,
                unreadCount,
            });
        } catch (error) {
            console.error(
                "getMyNotifications:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load notifications.",
            });
        }
    };

exports.markAsRead =
    async (req, res) => {
        try {
            const notification =
                await Notification.findOneAndUpdate(
                    {
                        _id:
                            req.params.id,
                        userId:
                            req.user._id,
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
                    message:
                        "Notification not found.",
                });
            }

            res.status(200).json({
                success: true,
                notification,
            });
        } catch (error) {
            console.error(
                "markAsRead:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to update notification.",
            });
        }
    };

exports.markAllAsRead =
    async (req, res) => {
        try {
            await Notification.updateMany(
                {
                    userId:
                        req.user._id,
                    isRead: false,
                },
                {
                    isRead: true,
                }
            );

            res.status(200).json({
                success: true,
                message:
                    "All notifications marked as read.",
            });
        } catch (error) {
            console.error(
                "markAllAsRead:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to update notifications.",
            });
        }
    };