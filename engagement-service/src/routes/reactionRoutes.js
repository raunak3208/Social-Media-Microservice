const express = require("express");
const Joi = require("joi");
const validateRequest = require("../middleware/validationMiddleware");
const { toggleLike, toggleDislike } = require("../controllers/reactionController");

const router = express.Router();

const reactionSchema = Joi.object({
    postId: Joi.string().required().messages({
        "string.empty": "Post ID is required",
    }),
    postOwnerId: Joi.string().optional(),
});

router.post("/like", validateRequest(reactionSchema), toggleLike);
router.post("/dislike", validateRequest(reactionSchema), toggleDislike);

module.exports = router;
