const amqp = require("amqplib");
const logger = require("./logger");

let channel, connection;

const connectRabbitMQ = async () => {
    try {
        const amqpServer = process.env.RABBITMQ_URL || "amqp://localhost:5672";
        connection = await amqp.connect(amqpServer);
        channel = await connection.createChannel();

        logger.info("Feed-service connected to RabbitMQ");
        return channel;
    } catch (error) {
        logger.error("Failed to connect to RabbitMQ from feed-service:", error);
        throw error;
    }
};

const getChannel = () => {
    return channel;
}

module.exports = {
    connectRabbitMQ,
    getChannel
};
