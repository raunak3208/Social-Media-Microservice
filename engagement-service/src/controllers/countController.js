const Like = require("../models/Like");
const Dislike = require("../models/Dislike");
const Comment = require("../models/Comment");
const logger = require("../utils/logger");

const getEngagementCounts = async (req, res, next) => {
    try {
        const { postId } = req.params;

        // Execute multiple count queries in parallel for efficiency
        const [likesCount, dislikesCount, commentsCount] = await Promise.all([
            Like.countDocuments({ postId }),
            Dislike.countDocuments({ postId }),
            Comment.countDocuments({ postId }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                postId,
                totalLikes: likesCount,
                totalDislikes: dislikesCount,
                totalComments: commentsCount,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getEngagementCounts };
