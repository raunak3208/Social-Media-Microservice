const mongoose = require("mongoose");

const messageRequestSchema = new mongoose.Schema(
    {
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
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending",
        },
    },
    { timestamps: true }
);

// Prevent duplicate pending requests between the same users
messageRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });

const MessageRequest = mongoose.model("MessageRequest", messageRequestSchema);
module.exports = MessageRequest;
