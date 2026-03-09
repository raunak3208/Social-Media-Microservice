const amqp = require("amqplib");
const logger = require("./logger");

let connection = null;
let channel = null;

const EXCHANGE_NAME = "social_events";

const connectToRabbitMQ = async () => {
    try {
        connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();

        // Assert exchange for publishing events
        await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });

        logger.info("Connected to RabbitMQ");
        return channel;
    } catch (error) {
        logger.error("Error connecting to RabbitMQ", error);
        throw error;
    }
};

const publishEvent = async (routingKey, message) => {
    if (!channel) {
        logger.warn("RabbitMQ channel not established, event not published");
        return;
    }

    try {
        channel.publish(
            EXCHANGE_NAME,
            routingKey,
            Buffer.from(JSON.stringify(message))
        );
        logger.info(`Event published: ${routingKey}`);
    } catch (error) {
        logger.error("Error publishing event", error);
    }
};

module.exports = { connectToRabbitMQ, publishEvent };
