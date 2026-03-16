const { createIV } = require("@excalidraw/excalidraw/data/encryption");
const Notification = require("../models/Notification");
const logger = require("../utils/logger");

const getNotification = async (req, res, next) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { page = 1, limit = 10, unreadOnly = "false" } = req.query;
        const skip = (page - 1) * limit;

        const filterOptions = { userId };
        if (unreadOnly === "true") {
            filterOptions.isRead = false;
        }

        const notifications = await Notification.find(filterOptions)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments(filterOptions);
        const unreadCount = await Notification.countDocuments({userId, isRead: false});

        res.status(200).json({
            success: true,
            data: notifications,
            unreadCount,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total/limit),
            },
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { getNotification };