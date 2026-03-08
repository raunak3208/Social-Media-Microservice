const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: true,
            index: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 500,
        },
    },
    { timestamps: true }
);

// Optional: Index on postId to optimize fetching all comments for a post
commentSchema.index({ postId: 1, createdAt: -1 });

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;
