const { getChannel } = require("../utils/rabbitmq");
const Notification = require("../models/Notification");
const logger = require("../utils/logger");

const startEventConsumer = async () => {
    try {
        const channel = getChannel();
        if (!channel) {
            throw new Error("RabbitMQ channel not available");
        }

        const SOCIAL_EXCHANGE = "social_events";
        const ENGAGEMENT_EXCHANGE = "engagement_events";
        const CHAT_EXCHANGE = "social_media_exchange"; // Exchange used by chat-service

        await channel.assertExchange(SOCIAL_EXCHANGE, "topic", { durable: false });
        await channel.assertExchange(ENGAGEMENT_EXCHANGE, "topic", { durable: false });
        await channel.assertExchange(CHAT_EXCHANGE, "topic", { durable: true });

        // Assert our notification queue
        const queueResult = await channel.assertQueue("notifications_queue", { durable: true });
        const queueName = queueResult.queue;

        // Bind the queue to listen to specific routing keys on these exchanges
        await channel.bindQueue(queueName, SOCIAL_EXCHANGE, "user.followed");
        await channel.bindQueue(queueName, ENGAGEMENT_EXCHANGE, "post.liked");
        await channel.bindQueue(queueName, ENGAGEMENT_EXCHANGE, "post.commented");
        await channel.bindQueue(queueName, CHAT_EXCHANGE, "message.received");

        logger.info(`Notification Service is listening for events on queue: ${queueName}`);

        channel.consume(queueName, async (msg) => {
            if (msg !== null) {
                try {
                    const routingKey = msg.fields.routingKey;
                    const data = JSON.parse(msg.content.toString());

                    logger.info(`Received event: ${routingKey}`);
                    await handleEvent(routingKey, data);

                    channel.ack(msg); // Acknowledge successful processing
                } catch (error) {
                    logger.error(`Error processing event ${msg.fields.routingKey}`, error);
                    // Decide if we should requeue (Nack) or drop it based on the error.
                    channel.nack(msg, false, false);
                }
            }
        });
    } catch (error) {
        logger.error("Failed to start event consumer", error);
    }
};

const handleEvent = async (routingKey, data) => {
    switch (routingKey) {
        case "user.followed":
            await Notification.create({
                userId: data.followingId,   // The person receiving the notification
                actorId: data.followerId,   // The person who followed
                type: "FOLLOW",
                message: "started following you",
                isRead: false
            });
            break;

        case "post.liked":
            await Notification.create({
                userId: data.postOwnerId, // Assuming engagement-service added postOwnerId to event payload
                actorId: data.actorId,
                postId: data.postId,
                type: "LIKE",
                message: "liked your post",
                isRead: false
            });
            break;

        case "post.commented":
            await Notification.create({
                userId: data.postOwnerId,
                actorId: data.actorId,
                postId: data.postId,
                type: "COMMENT",
                message: `commented on your post`, // Could inject snippet: `commented: "${data.text}"`
                isRead: false
            });
            break;

        case "message.received":
            await Notification.create({
                userId: data.receiverId, // The receiver of the chat message
                actorId: data.senderId,  // The sender of the chat message
                type: "CHAT_MESSAGE",
                message: `sent you a message`,
                isRead: false
            });
            break;

        default:
            logger.warn(`Unhandled routing key: ${routingKey}`);
    }
};

module.exports = { startEventConsumer };
