const mongoose = require("mongoose");

const feedItemSchema = new mongoose.Schema(
    {
        userId: {
            type: String, // The user whose feed this belongs to (string since we use x-user-id string matching)
            required: true,
            index: true,
        },
        postId: {
            type: String,
            required: true,
        },
        authorId: {
            type: String,
            required: true,
        },
        score: {
            type: Number,
            default: 0,
            index: true, // Index for efficiently sorting feeds by score
        },
        // We will store minimal post data so that we know some basic information 
        // without hitting post-service, or we can just fetch all post IDs from here
        // The requirements suggest prioritizing recency and engagement.
    },
    { timestamps: true }
);

// Compound index to quickly fetch paginated feed for a specific user, ordered by score descending
feedItemSchema.index({ userId: 1, score: -1, createdAt: -1 });

// Ensure we don't duplicate a post in a user's feed
feedItemSchema.index({ userId: 1, postId: 1 }, { unique: true });

const FeedItem = mongoose.model("FeedItem", feedItemSchema);
module.exports = FeedItem;
