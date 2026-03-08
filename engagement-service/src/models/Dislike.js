const mongoose = require('mongoose');

const disLikeSchema = new mongoose.Schema(
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
    {
        timestamps: true
    }
);

// Prevent duplicate dislikes by the same user on the same post
disLikeSchema.index({ userId: 1, postId: 1 }, { unique: true });

const Dislike = mongoose.model('Dislike', disLikeSchema);

module.exports = Dislike;
