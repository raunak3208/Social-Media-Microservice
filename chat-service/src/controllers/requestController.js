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
