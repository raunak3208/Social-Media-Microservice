const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            requied: true,
            index: true,
        },
        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            requied: true,
        },
        type: {
            type: String,
            enum: ["LIKE", "COMMENT", "FOLLOW", "CHAT_MESSAGE"],
            required: true,
        },
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            requied: function () {
                // PostID is only required if the notification is Like or a comment
                return this.type === 'LIKE' || this.type === 'COMMENT';
            }
        },
        message: {
            type: String,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true
    }
);

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
