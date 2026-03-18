
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
        const unreadCount = await Notification.countDocuments({ userId, isRead: false });

        res.status(200).json({
            success: true,
            data: notifications,
            unreadCount,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
            },
        });

    } catch (error) {
        next(error);
    }
};

const markAsRead = async (req, res, next) => {
    try {
        const userId = req.headers["x-user-id"];
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false, message: "Notification not found or access denied"
            });
        }
        logger.info(`User ${userId} marked notification ${id} as read`);
        res.status(200).json({ success: true, notification });
    } catch (error) {
        next(error);
    }
};

const markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.headers["x-user-id"];

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        await Notification.updateMany({ userId, isRead: false }, { isRead: true });

        logger.info(`User ${userId} marked all notifications as read`);
        res.status(200).json({
            success: true,
            message: "All notifications marked as read"
        });

    } catch (error) {
        next(error);
    }
};

const deleteNotification = async (req, res, next) => {
    try {
        const userId = req.headers["x-user-id"];
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

         const notification = await Notification.findOneAndDelete({ _id: id, userId });

        if (!notification) {
            return res.status(404).json({ 
                success: false, 
                message: "Notification not found or access denied" 
            });
        }

        logger.info(`User ${userId} deleted notification ${id}`);
        res.status(200).json({ 
            success: true,
            message: "Notification deleted" 
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { getNotification, markAsRead, markAllAsRead, deleteNotification };