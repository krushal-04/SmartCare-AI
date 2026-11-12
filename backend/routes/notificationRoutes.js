const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/protect");
const {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
} = require("../controllers/notificationController");

// Unread badge count
router.get("/unread-count", protect, getUnreadCount);

// Notifications list
router.get("/my", protect, getMyNotifications);

// Mark single as read (support both PATCH and PUT)
router.patch("/:id/read", protect, markAsRead);
router.put("/:id/read", protect, markAsRead);

// Mark all as read (support both PATCH and PUT)
router.patch("/read-all", protect, markAllAsRead);
router.put("/read-all", protect, markAllAsRead);

module.exports = router;
