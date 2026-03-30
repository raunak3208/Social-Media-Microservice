const express = require("express");
const { getFeed, getTrendingPosts, getUserPosts, getRecommendedPosts } = require("../controllers/feedController");

const router = express.Router();

router.get("/", getFeed);
router.get("/trending", getTrendingPosts);
router.get("/recommended", getRecommendedPosts);
router.get("/user/:userId", getUserPosts);

module.exports = router;
