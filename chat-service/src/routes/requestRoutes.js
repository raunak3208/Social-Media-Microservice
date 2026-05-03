const express = require("express");
const Joi = require("joi");
const validateRequest = require("../middleware/validationMiddleware");
const { sendRequest, acceptRequest, rejectRequest, getPendingRequests } = require("../controllers/requestController");

const router = express.Router();

const sendRequestSchema = Joi.object({
    receiverId: Joi.string().required().messages({
        "string.empty": "receiverId is required"
    })
});

// Paths will be /api/chat/requests/...
router.post("/send", validateRequest(sendRequestSchema), sendRequest);
router.post("/accept/:requestId", acceptRequest);
router.post("/reject/:requestId", rejectRequest);
router.get("/pending", getPendingRequests); // To view pending messages for the current user

module.exports = router;
