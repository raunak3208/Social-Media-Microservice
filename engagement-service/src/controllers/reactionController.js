const Like = require('../models/Like');
const Dislike = require('../models/Dislike');
const logger = require('../utils/logger');
const { publishEvent } = require('../utils/rabbitmq');

const toggleLike = async (req, res,next) => {
    try {
        const userId = req.user.userId;
        const { postId, postOwnerId } = req.body;

        if(!userId) {
            return res.status(401).json({ 
                success: false, 
                message: "Unauthorized" 
            });
        }

        if (!postOwnerId && req.path === '/like') {
            logger.warn("Post owner ID is missing in the request body for like action");
        }

        // check if like already exists
        const existingLike = await Like.findOne({ userId, postId });

        if (existingLike) {
            // If like exists, remove it (toggle off)
            await Like.findOneAndDelete({ userId, postId });
            logger.info(`Like removed for user ${userId} on post ${postId}`);
            return res.status(200).json({
                success: true,
                message: "Like removed",
            }); 
        }

        // if liking , verfy and remove dislike if exists

        await Dislike.findOneAndDelete({ userId, postId });

        // Add new like
        const newLike = new Like({ userId, postId });
        await newLike.save();
        logger.info(`Like added for user ${userId} on post ${postId}`);

        // Publish event if user is not liking their own post
        if(postOwnerId && postOwnerId != userId) {
            await publishEvent('post_liked', {
                postId,
                actorId: userId,
                postOwnerId,
                timestamp: new Date()
            });
            logger.info(`Published post_liked event for post ${postId} liked by user ${userId}`);
        }

        res.status(200).json({
            success: true,
            message: "Post liked",
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, message: "Duplicate like" 
            });
        }
        next(error);
    }
};