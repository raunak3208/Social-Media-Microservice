const express = require("express");
const Joi = require("joi");
const validateRequest = require("../middleware/validationMiddleware");
const { getConversationHistory, sendMessage, getUnreadCount, markAsRead, deleteMessage } = require("../controllers/chatController");

const router = express.Router();

const sendMessageSchema = Joi.object({
    receiverId: Joi.string().required().messages({
        "string.empty": "receiverId is required"
    }),
    text: Joi.string().allow("").optional(),
    messageType: Joi.string().valid("text", "image").optional(),
    imageUrl: Joi.string().uri().optional()
});

// Assuming mounted on /api/chat/...
router.post("/message", validateRequest(sendMessageSchema), sendMessage);
router.get("/conversation/:conversationId", getConversationHistory);
router.get("/unread-count", getUnreadCount);
router.put("/conversation/:conversationId/read", markAsRead);
router.delete("/message/:messageId", deleteMessage);

module.exports = router;