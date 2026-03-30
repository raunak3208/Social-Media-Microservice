const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: String, // Storing userId as string based on x-user-id pattern
                required: true,
            },
        ],
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
    },
    { timestamps: true }
);

// Index for efficient querying by participants
conversationSchema.index({ participants: 1 });

const Conversation = mongoose.model("Conversation", conversationSchema);
module.exports = Conversation;
