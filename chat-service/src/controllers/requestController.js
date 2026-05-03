const MessageRequest = require("../models/MessageRequest");
const Conversation = require("../models/Conversation");
const logger = require("../utils/logger");
const { publishEvent } = require("../utils/rabbitmq");
const { checkMutualFollow } = require("../utils/serviceComm");

const sendRequest = async (req, res, next) => {
    try {
        const senderId = req.headers["x-user-id"];
        const { receiverId } = req.body;

        if (!senderId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (senderId === receiverId) {
            return res.status(400).json({ success: false, message: "Cannot send message request to self" });
        }

        // Check if mutual follow already exists
        const isMutual = await checkMutualFollow(senderId, receiverId);
        if (isMutual) {
            return res.status(400).json({
                success: false,
                message: "Users mutually follow each other. Message request not needed."
            });
        }

        // Check for existing request
        const existingRequest = await MessageRequest.findOne({ senderId, receiverId });
        if (existingRequest) {
            return res.status(400).json({ success: false, message: "Request already sent", data: existingRequest });
        }

        const request = new MessageRequest({ senderId, receiverId });
        await request.save();

        // Publish event to RabbitMQ for notification service
        await publishEvent("message.request.received", {
            senderId,
            receiverId,
            requestId: request._id,
            timestamp: new Date()
        });

        logger.info(`Message Request sent from ${senderId} to ${receiverId}`);
        res.status(201).json({ success: true, message: "Message request sent successfully", data: request });
    } catch (error) {
        next(error);
    }
};

const acceptRequest = async (req, res, next) => {
    try {
        const receiverId = req.headers["x-user-id"];
        const { requestId } = req.params;

        if (!receiverId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const request = await MessageRequest.findOne({ _id: requestId, receiverId });
        if (!request) {
            return res.status(404).json({ success: false, message: "Message request not found" });
        }

        if (request.status !== "pending") {
            return res.status(400).json({ success: false, message: `Request is already ${request.status}` });
        }

        request.status = "accepted";
        await request.save();

        // Ensure a conversation is created if it does not exist
        let conversation = await Conversation.findOne({
            participants: { $all: [request.senderId, receiverId] }
        });

        if (!conversation) {
            conversation = new Conversation({ participants: [request.senderId, receiverId] });
            await conversation.save();
        }

        logger.info(`Message request ${requestId} accepted by ${receiverId}`);
        res.status(200).json({ success: true, message: "Message request accepted", data: conversation });
    } catch (error) {
        next(error);
    }
};

const rejectRequest = async (req, res, next) => {
    try {
        const receiverId = req.headers["x-user-id"];
        const { requestId } = req.params;

        if (!receiverId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const request = await MessageRequest.findOne({ _id: requestId, receiverId });
        if (!request) {
            return res.status(404).json({ success: false, message: "Message request not found" });
        }

        if (request.status !== "pending") {
            return res.status(400).json({ success: false, message: `Request is already ${request.status}` });
        }

        request.status = "rejected";
        await request.save();

        logger.info(`Message request ${requestId} rejected by ${receiverId}`);
        res.status(200).json({ success: true, message: "Message request rejected" });
    } catch (error) {
        next(error);
    }
};

const getPendingRequests = async (req, res, next) => {
    try {
        const receiverId = req.headers["x-user-id"];

        if (!receiverId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const requests = await MessageRequest.find({ receiverId, status: "pending" })
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    sendRequest,
    acceptRequest,
    rejectRequest,
    getPendingRequests
};
