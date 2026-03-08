const Comment = require("../models/Comment");
const logger = require("../utils/logger");
const { publishEvent } = require("../utils/rabbitmq");

const addComment = async (req, res, next) => {
    try {
        const userId = req.headers["x-user-id"];
        const { postId, text, postOwnerId } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const comment = new Comment({ userId, postId, text });
        await comment.save();

        logger.info(`User ${userId} commented on post ${postId}`);

        if (postOwnerId && postOwnerId !== userId) {
            await publishEvent("post.commented", {
                postId,
                actorId: userId,
                postOwnerId,
                text,
                timestamp: new Date()
            });
        }

        res.status(201).json({ success: true, comment });
    } catch (error) {
        next(error);
    }
};

const deleteComment = async (req, res, next) => {
    try {
        const userId = req.headers["x-user-id"];
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const comment = await Comment.findOne({ _id: id });

        if (!comment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        if (comment.userId.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        await Comment.findOneAndDelete({ _id: id });
        logger.info(`User ${userId} deleted comment ${id}`);
        res.status(200).json({ success: true, message: "Comment deleted successfully" });
    } catch (error) {
        next(error);
    }
};

const getCommentsByPostId = async (req, res, next) => {
    try {
        const { postId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const skip = (page - 1) * limit;

        const comments = await Comment.find({ postId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Comment.countDocuments({ postId });

        res.status(200).json({
            success: true,
            data: comments,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { addComment, deleteComment, getCommentsByPostId };
