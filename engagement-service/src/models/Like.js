const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema(
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
            
    },
    { timestamps: true }
);

// Prevent duplicate likes by the same user on the same post


likeSchema.index({ userId: 1, postId: 1 }, { unique: true });

const Like = mongoose.model('Like', likeSchema);

module.exports = Like;