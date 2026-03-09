const express = require("express");
const Joi = require("joi");
const validateRequest = require("../middleware/validationMiddleware");
const { followUser, unfollowUser, checkFollowStatus } = require("../controllers/followController");

const router = express.Router();

const followSchema = Joi.object({
    followingId: Joi.string().required().messages({
        "string.empty": "UserId to follow/unfollow is required",
    }),
});

// Since proxy mapping usually drops the base URL prefix but here we inject it in server.js,
// Paths become relative to the router mapping `/api/social/follow`
router.post("/", validateRequest(followSchema), followUser);
router.post("/unfollow", validateRequest(followSchema), unfollowUser);
router.get("/status/:followingId", checkFollowStatus);

module.exports = router;
