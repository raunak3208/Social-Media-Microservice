const amqp = require("amqplib");
const logger = require("./logger");

let connection = null;
let channel = null;

const connectToRabbitMQ = async () => {
    try {
        connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();
        logger.info("Connected to RabbitMQ for Notifications");
        return channel;
    } catch (error) {
        logger.error("Error connecting to RabbitMQ", error);
        throw error;
    }
};

const getChannel = () => channel;

module.exports = { connectToRabbitMQ, getChannel };
