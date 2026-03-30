const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    emoji: {
        type: String,
        required: true,
    },
}, { _id: false });

const messageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
            index: true,
        },
        senderId: {
            type: String,
            required: true,
            index: true,
        },
        receiverId: {
            type: String,
            required: true,
            index: true,
        },
        text: {
            type: String,
            default: "",
        },
        messageType: {
            type: String,
            enum: ["text", "image"],
            default: "text",
        },
        imageUrl: {
            type: String,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        reactions: [reactionSchema],
    },
    { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
