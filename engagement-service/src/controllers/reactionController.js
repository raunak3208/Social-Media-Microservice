const Like = require("../models/Like");
const Dislike = require("../models/Dislike");
const logger = require("../utils/logger");
const { publishEvent } = require("../utils/rabbitmq");

const toggleLike = async (req, res, next) => {
    try {
        const userId = req.headers["x-user-id"];
        const { postId, postOwnerId } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (!postOwnerId && req.path === "/like") {
            // Making it required specifically for tracking notification ownership if missing
            logger.warn("postOwnerId not provided for like.");
        }

        // Check if like exists
        const existingLike = await Like.findOne({ userId, postId });

        if (existingLike) {
            // Remove the like
            await Like.findOneAndDelete({ userId, postId });
            logger.info(`User ${userId} removed like from post ${postId}`);
            return res.status(200).json({ success: true, message: "Like removed" });
        }

        // Since they are liking the post, verify and remove a dislike if it exists
        await Dislike.findOneAndDelete({ userId, postId });

        // Add new like
        const newLike = new Like({ userId, postId });
        await newLike.save();

        logger.info(`User ${userId} liked post ${postId}`);

        // Publish event if user is not liking their own post
        if (postOwnerId && postOwnerId !== userId) {
            await publishEvent("post.liked", {
                postId,
                actorId: userId,
                postOwnerId,
                timestamp: new Date()
            });
        }

        res.status(201).json({ success: true, message: "Post liked" });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Duplicate like" });
        }
        next(error);
    }
};

const toggleDislike = async (req, res, next) => {
    try {
        const userId = req.headers["x-user-id"];
        const { postId } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // Check if dislike exists
        const existingDislike = await Dislike.findOne({ userId, postId });

        if (existingDislike) {
            // Remove the dislike
            await Dislike.findOneAndDelete({ userId, postId });
            logger.info(`User ${userId} removed dislike from post ${postId}`);
            return res.status(200).json({ success: true, message: "Dislike removed" });
        }

        // Since they are disliking the post, verify and remove a like if it exists
        await Like.findOneAndDelete({ userId, postId });

        // Add new dislike
        const newDislike = new Dislike({ userId, postId });
        await newDislike.save();

        logger.info(`User ${userId} disliked post ${postId}`);
        res.status(201).json({ success: true, message: "Post disliked" });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Duplicate dislike" });
        }
        next(error);
    }
};

module.exports = { toggleLike, toggleDislike };
