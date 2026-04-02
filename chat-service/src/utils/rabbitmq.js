const amqp = require("amqplib");
const logger = require("./logger");

let channel, connection;

const connectRabbitMQ = async () => {
    try {
        const amqpServer = process.env.RABBITMQ_URL || "amqp://localhost:5672";
        connection = await amqp.connect(amqpServer);
        channel = await connection.createChannel();
        await channel.assertExchange("social_media_exchange", "topic", {
            durable: true,
        });
        logger.info("Chat-service connected to RabbitMQ");
    } catch (error) {
        logger.error("Failed to connect to RabbitMQ from chat-service:", error);
        // Retry connection logic could go here
    }
};

const publishEvent = async (routingKey, data) => {
    try {
        if (!channel) {
            await connectRabbitMQ();
        }
        channel.publish(
            "social_media_exchange",
            routingKey,
            Buffer.from(JSON.stringify(data)),
            { persistent: true }
        );
        logger.info(`Message published with routing key ${routingKey}`);
    } catch (error) {
        logger.error("Error publishing event to RabbitMQ:", error);
    }
};

module.exports = {
    connectRabbitMQ,
    publishEvent,
};
