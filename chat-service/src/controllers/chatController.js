const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const logger = require("../utils/logger");
const { checkMutualFollow } = require("../utils/serviceComm");
const { publishEvent } = require("../utils/rabbitmq");

// Get conversation history (paginated)
const getConversationHistory = async (req, res, next) => {
    try {
        const userId = req.headers["x-user-id"];
        const { conversationId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId,
        });

        if (!conversation) {
            return res.status(404).json({ success: false, message: "Conversation not found" });
        }

        const skip = (page - 1) * limit;

        const messages = await Message.find({ conversationId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        next(error);
    }
};

// Send message (HTTP fallback for when socket isn't available)
const sendMessage = async (req, res, next) => {
    try {
        const senderId = req.headers["x-user-id"];
        const { receiverId, text, messageType, imageUrl } = req.body;

        if (!senderId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // Verify they can chat
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });

        if (!conversation) {
            // Need to check if they mutual follow to create a new one
            const isMutual = await checkMutualFollow(senderId, receiverId);
            if (!isMutual) {
                return res.status(403).json({
                    success: false,
                    message: "Users do not follow each other. Please send a message request first."
                });
            }
            // Create conversation
            conversation = new Conversation({ participants: [senderId, receiverId] });
            await conversation.save();
        }

        const message = new Message({
            conversationId: conversation._id,
            senderId,
            receiverId,
            text,
            messageType: messageType || "text",
            imageUrl
        });

        await message.save();

        // Update conversation lastMessage
        conversation.lastMessage = message._id;
        await conversation.save();

        // Publish event to RabbitMQ for notification service
        await publishEvent("message.received", {
            senderId,
            receiverId,
            messageId: message._id,
            text,
            messageType: message.messageType,
            timestamp: new Date()
        });

        logger.info(`Message sent from ${senderId} to ${receiverId} in conversation ${conversation._id}`);
        res.status(201).json({ success: true, data: message });
    } catch (error) {
        next(error);
    }
};

// Get unread message count
const getUnreadCount = async (req, res, next) => {
    try {
        const userId = req.headers["x-user-id"];

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const count = await Message.countDocuments({
            receiverId: userId,
            isRead: false
        });

        res.status(200).json({ success: true, data: { unreadCount: count } });
    } catch (error) {
        next(error);
    }
};

// Mark conversation messages as read
const markAsRead = async (req, res, next) => {
    try {
        const userId = req.headers["x-user-id"];
        const { conversationId } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        await Message.updateMany(
            { conversationId, receiverId: userId, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json({ success: true, message: "Messages marked as read" });
    } catch (error) {
        next(error);
    }
};

const deleteMessage = async (req, res, next) => {
    try {
        const userId = req.headers["x-user-id"];
        const { messageId } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const message = await Message.findOne({ _id: messageId, senderId: userId });

        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found or unauthorized to delete" });
        }

        await Message.deleteOne({ _id: messageId });

        res.status(200).json({ success: true, message: "Message deleted successfully" });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getConversationHistory,
    sendMessage,
    getUnreadCount,
    markAsRead,
    deleteMessage
};
