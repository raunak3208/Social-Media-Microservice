const axios = require("axios");
const logger = require("./logger");

const SOCIAL_SERVICE_URL = process.env.SOCIAL_SERVICE_URL || "http://localhost:3005";
const POST_SERVICE_URL = process.env.POST_SERVICE_URL || "http://localhost:3002";
const ENGAGEMENT_SERVICE_URL = process.env.ENGAGEMENT_SERVICE_URL || "http://localhost:3004";

// Fetch the list of users that the given userId is following
 
const getFollowings = async (userId) => {
    try {
        // Assuming a standard endpoint in social-service that returns array of { followingId: string } or strings
        const response = await axios.get(`${SOCIAL_SERVICE_URL}/api/social/following`, {
            headers: { "x-user-id": userId }
        });
        const data = response.data?.data || [];
        // Extract string IDs if it's an array of objects
        return data.map(follow => typeof follow === 'object' ? follow.followingId : follow);
    } catch (error) {
        logger.error(`Error fetching followings for user ${userId}: ${error.message}`);
        return [];
    }
};

/**
 * Fetch post details directly from post-service
 */
const getPostsByIds = async (postIds, userId) => {
    if (!postIds || postIds.length === 0) return [];
    try {
        // Utilizing a hypothetical batch endpoint, or fetching them one by one if necessary
        // Assuming a POST /batch or similar exists, but we can do Promise.all for simplicity if batch doesn't exist
        const response = await axios.post(`${POST_SERVICE_URL}/api/posts/batch`, { postIds }, {
            headers: { "x-user-id": userId }
        });
        return response.data?.data || [];
    } catch (error) {
        logger.error(`Error fetching batch posts: ${error.message}`);
        return [];
    }
};

module.exports = {
    getFollowings,
    getPostsByIds
};
