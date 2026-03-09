const Follow = require("../models/Follow");
const { publishEvent } = require("../utils/rabbitmq");
const logger = require("../utils/logger");

const followUser = async (req, res, next) => {
    try {
        const followerId = req.headers["x-user-id"];
        const { followingId } = req.body;

        if (!followerId) {
            return res.status(401).json({ 
                success: false, message: "Unauthorized" 
            });
        }

        if (followerId === followingId) {
            return res.status(400).json({ 
                success: false, message: "A user cannot follow themselves" 
            });
        }

        try {
            const follow = new Follow({ followerId, followingId });
            await follow.save();

            // Publish the follow event to RabbitMQ!
            await publishEvent("user.followed", {
                followerId,
                followingId,
                timestamp: new Date()
            });

            logger.info(`User ${followerId} followed User ${followingId}`);
            res.status(201).json({ success: true, message: "Successfully followed user" });

        } catch (dbError) {
            // 11000 is MongoDB's duplicate key error code (means already following)
            if (dbError.code === 11000) {
                return res.status(400).json({ 
                    success: false, 
                    message: "You are already following this user" 
                });
            }
            throw dbError;
        }

    } catch (error) {
        next(error);
    }
};

const unfollowUser = async (req, res, next) => {
    try {
        const followerId = req.headers["x-user-id"];
        const { followingId } = req.body;

        if (!followerId) {
            return res.status(401).json({ 
                success: false, 
                message: "Unauthorized" 
            });
        }

        const removedFollow = await Follow.findOneAndDelete({ followerId, followingId });

        if (!removedFollow) {
            return res.status(404).json({ 
                success: false, 
                message: "Follow relationship not found" 
            });
        }

        logger.info(`User ${followerId} unfollowed User ${followingId}`);
        res.status(200).json({ success: true, message: "Successfully unfollowed user" });
    } catch (error) {
        next(error);
    }
};

const checkFollowStatus = async (req, res, next) => {
    try {
        const followerId = req.headers["x-user-id"];
        const { followingId } = req.params;

        if (!followerId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const follow = await Follow.findOne({ followerId, followingId });

        res.status(200).json({
            success: true,
            data: { isFollowing: !!follow },
        });
    } catch (error) {
        next(error);
    }
};


module.exports = { followUser, unfollowUser, checkFollowStatus };
