const axios = require("axios");
const logger = require("./logger");

/**
 * Checks if the current user (senderId) mutually follows the target user (receiverId)
 */
const checkMutualFollow = async (senderId, receiverId) => {
    try {
        const socialServiceUrl = process.env.SOCIAL_SERVICE_URL || "http://localhost:3005"; // Ensure correct port

        // Check if sender follows receiver
        const response1 = await axios.get(`${socialServiceUrl}/api/social/follow/status/${receiverId}`, {
            headers: { "x-user-id": senderId }
        });
        const isSenderFollowingReceiver = response1.data?.data?.isFollowing;

        // Check if receiver follows sender
        const response2 = await axios.get(`${socialServiceUrl}/api/social/follow/status/${senderId}`, {
            headers: { "x-user-id": receiverId }
        });
        const isReceiverFollowingSender = response2.data?.data?.isFollowing;

        return isSenderFollowingReceiver && isReceiverFollowingSender;
    } catch (error) {
        logger.error(`Error checking mutual follow status: ${error.message}`);
        // Default to false so we enforce message requests on failure
        return false;
    }
};

module.exports = {
    checkMutualFollow
};
