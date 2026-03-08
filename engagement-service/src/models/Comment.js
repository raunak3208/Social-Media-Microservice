const mongoose = require('mongoose');

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
            minLength: 1,
            maxLength: 500,
        },
    },
    { 
        timestamps: true 
    }
);