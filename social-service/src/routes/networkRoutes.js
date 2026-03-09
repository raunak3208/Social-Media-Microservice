const express = require("express");
const { getFollowers, getFollowing, getRelationshipStats } = require("../controllers/networkController");

const router = express.Router();

router.get("/followers/:userId", getFollowers);
router.get("/following/:userId", getFollowing);
router.get("/stats/:userId", getRelationshipStats);

module.exports = router;
