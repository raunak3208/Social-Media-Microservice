const { getChannel } = require("../utils/rabbitmq");
const FeedItem = require("../models/FeedItem");
const redisClient = new require("../utils/redisClient"); // assuming client is exported directly
const logger = require("../utils/logger");

const startEventConsumer = async () => {
    try {
        const channel = getChannel();
        if (!channel) {
            throw new Error("RabbitMQ channel not available");
        }

        const SOCIAL_EXCHANGE = "social_events";
        const ENGAGEMENT_EXCHANGE = "engagement_events";
        const POST_EXCHANGE = "post_events"; // Adjust based on where post.created comes from

        await channel.assertExchange(POST_EXCHANGE, "topic", { durable: false });
        await channel.assertExchange(ENGAGEMENT_EXCHANGE, "topic", { durable: false });

        // Assert our feed queue
        const queueResult = await channel.assertQueue("feed_updates_queue", { durable: true });
        const queueName = queueResult.queue;

        // Bind the queue
        await channel.bindQueue(queueName, POST_EXCHANGE, "post.created");
        await channel.bindQueue(queueName, POST_EXCHANGE, "post.deleted");
        await channel.bindQueue(queueName, ENGAGEMENT_EXCHANGE, "post.liked");
        await channel.bindQueue(queueName, ENGAGEMENT_EXCHANGE, "post.commented");

        logger.info(`Feed Service is listening for events on queue: ${queueName}`);

        channel.consume(queueName, async (msg) => {
            if (msg !== null) {
                try {
                    const routingKey = msg.fields.routingKey;
                    const data = JSON.parse(msg.content.toString());

                    logger.info(`Feed service received event: ${routingKey}`);
                    await handleEvent(routingKey, data);

                    channel.ack(msg);
                } catch (error) {
                    logger.error(`Error processing event ${msg.fields.routingKey} in feed-service`, error);
                    channel.nack(msg, false, false);
                }
            }
        });
    } catch (error) {
        logger.error("Failed to start event consumer in feed-service", error);
    }
};

const handleEvent = async (routingKey, data) => {
    switch (routingKey) {
        case "post.created":
            break;

        case "post.deleted":
            // Remove the post from all generated feeds
            if (data.postId) {
                await FeedItem.deleteMany({ postId: data.postId });
                // We should technically invalidate caches where this post existed,
                // but for simplicity, we let cache expire.
            }
            break;

        case "post.liked":
            // Increase score
            // data should have { postId }
            if (data.postId) {
                // Like = +3 points
                await FeedItem.updateMany(
                    { postId: data.postId },
                    { $inc: { score: 3 } }
                );
            }
            break;

        case "post.commented":
            // Increase score
            // data should have { postId }
            if (data.postId) {
                // Comment = +2 points
                await FeedItem.updateMany(
                    { postId: data.postId },
                    { $inc: { score: 2 } }
                );
            }
            break;

        default:
            logger.warn(`Unhandled routing key in feed service: ${routingKey}`);
    }
};

module.exports = { startEventConsumer };
