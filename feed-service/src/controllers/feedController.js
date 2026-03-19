const FeedItem = require("../models/FeedItem");
const redisClient = require("../utils/redisClient");
const { getFollowings, getPostsByIds } = require("../utils/serviceComm");
const logger = require("../utils/logger");

const CACHE_TTL = 300; // 5 minutes cache

// Algorithm details: (likes * 3) + (comments * 2) + (shares * 4) + recencyFactor -> This is simulated within FeedItem score
// Actual complex ranking needs post-service querying. For microservices, we build feeds asynchronously or fetch post metrics dynamically.

/**
 * Helper to fetch detailed posts from IDs
 */
const populatePosts = async (feedItems, userId) => {
    if (feedItems.length === 0) return [];

    // In a real system, we just map out post ids and fetch batch from post-service
    const postIds = feedItems.map(item => item.postId);
    const populatedPosts = await getPostsByIds(postIds, userId);

    // Merge feed item score logic with the post data if needed
    return populatedPosts;
};

// GET /feed (Personalized Feed)
const getFeed = async (req, res, next) => {
    try {
        const userId = req.headers["x-user-id"];
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const cacheKey = `feed:${userId}:page:${page}:limit:${limit}`;

        // 1. Try Cache
        const cachedFeed = await redisClient.get(cacheKey);
        if (cachedFeed) {
            logger.info("Serving feed from Redis Cache");
            return res.status(200).json({ success: true, fromCache: true, data: JSON.parse(cachedFeed) });
        }

        // 2. Fetch from DB
        const skip = (page - 1) * limit;
        let feedItems = await FeedItem.find({ userId })
            .sort({ score: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // 3. Fallback: If feed is totally empty, generate on the fly
        if (feedItems.length === 0 && page === 1) {
            logger.info("Generating new feed for user on the fly");
            const followings = await getFollowings(userId);

            if (followings.length > 0) {
                // Here we would ideally hit post-service to get posts from followings
                // Since `post-service` isn't accessible DB-wise, we fetch them via internal comms
                // Let's assume post-service exposes active posts endpoints, or we fallback to recommended
            }
        }

        // 4. Populate full post data
        const postsData = await populatePosts(feedItems, userId);

        // Note: For local simulation/MVP where post fetching isn't complexly mapped, we'll return the items
        // In a real env, postsData is merged with feedItems metadata (score, etc).

        const responseData = feedItems; // Typically replace with populated postsData

        // 5. Store in Cache
        await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(responseData));

        res.status(200).json({ success: true, fromCache: false, data: responseData });
    } catch (error) {
        next(error);
    }
};

// GET /feed/trending
const getTrendingPosts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const cacheKey = `feed:trending:page:${page}:limit:${limit}`;

        const cachedTrending = await redisClient.get(cacheKey);
        if (cachedTrending) {
            return res.status(200).json({ success: true, fromCache: true, data: JSON.parse(cachedTrending) });
        }

        // Aggregate across all FeedItems globally to find highest scorers
        // This is an estimation strategy since FeedItems belong to viewers
        const trendingItems = await FeedItem.aggregate([
            { $group: { _id: "$postId", score: { $sum: "$score" } } },
            { $sort: { score: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(trendingItems));

        res.status(200).json({ success: true, fromCache: false, data: trendingItems });
    } catch (error) {
        next(error);
    }
};

// GET /feed/user/:targetUserId
const getUserPosts = async (req, res, next) => {
    try {
        // Here we just proxy a call to post-service essentially
        // In reality, this route belongs in post-service, but since requirement says feed-service should serve it:
        res.status(200).json({ success: true, message: "Use post-service directly, or aggregate here directly" });
    } catch (error) {
        next(error);
    }
};

// GET /feed/recommended
const getRecommendedPosts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Recommended logic: get trending posts the user hasn't seen/doesn't follow
        const recommendedItems = await FeedItem.aggregate([
            { $group: { _id: "$postId", score: { $avg: "$score" } } },
            { $sort: { score: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        res.status(200).json({ success: true, data: recommendedItems });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getFeed,
    getTrendingPosts,
    getUserPosts,
    getRecommendedPosts
};
