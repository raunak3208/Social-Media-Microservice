const express = require("express");
const { getEngagementCounts } = require("../controllers/countController");

const router = express.Router();

router.get("/:postId", getEngagementCounts);

module.exports = router;
