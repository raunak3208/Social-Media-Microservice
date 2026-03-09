const Follow = require("../models/Follow");
const logger = require("../utils/logger");

const getFollowers = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const skip = (page - 1) * limit;

        const followers = await Follow.find({ followingId: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Follow.countDocuments({ followingId: userId });

        res.status(200).json({
            success: true,
            data: followers,
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

const getFollowing = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const skip = (page - 1) * limit;

        const following = await Follow.find({ followerId: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Follow.countDocuments({ followerId: userId });

        res.status(200).json({
            success: true,
            data: following,
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

const getRelationshipStats = async (req, res, next) => {
    try {
        const { userId } = req.params;

        // Run parallel aggregation query for speed mapping to the requested totalFollowers/totalFollowing
        const [totalFollowers, totalFollowing] = await Promise.all([
            Follow.countDocuments({ followingId: userId }),
            Follow.countDocuments({ followerId: userId })
        ]);

        res.status(200).json({
            success: true,
            data: {
                userId,
                totalFollowers,
                totalFollowing
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { getFollowers, getFollowing, getRelationshipStats };
