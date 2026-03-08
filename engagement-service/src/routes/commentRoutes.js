const express = require("express");
const Joi = require("joi");
const validateRequest = require("../middleware/validationMiddleware");
const {
    addComment,
    deleteComment,
    getCommentsByPostId,
} = require("../controllers/commentController");

const router = express.Router();

const addCommentSchema = Joi.object({
    postId: Joi.string().required().messages({
        "string.empty": "Post ID is required",
    }),
    postOwnerId: Joi.string().optional(),
    text: Joi.string().min(1).max(500).required().messages({
        "string.empty": "Comment text cannot be empty",
        "string.min": "Comment must be at least 1 character long",
        "string.max": "Comment cannot exceed 500 characters",
    }),
});

// Since proxy path may map `/v1/engagement/comments` to this router
router.post("/", validateRequest(addCommentSchema), addComment);
router.delete("/:id", deleteComment);
router.get("/post/:postId", getCommentsByPostId);

module.exports = router;
