const express = require("express");
const { 
    getNotification, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
} = require("../controllers/notificationController");


const router = express.Router();

router.get("/", getNotification);
router.patch("/:id/read", markAsRead);
router.patch("/mark-all-read", markAllAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;
