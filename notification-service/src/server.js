require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");

const notificationRoutes = require("./routes/notificationRoutes");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const { connectToRabbitMQ } = require("./utils/rabbitmq");
const { startEventConsumer } = require("./events/consumer");

const app = express();
const PORT = process.env.PORT || 3007;

// Connect to MongoDB
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => logger.info("Connected to MongoDB for Notifications"))
    .catch((e) => logger.error("Mongo connection error", e));

const redisClient = new Redis(process.env.REDIS_URL);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
});

// DDOS Protection and rate limiting
const ddosLimiter = rateLimit({
    windowMs: 1000, // 1 second
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`DDOS protection triggered for IP: ${req.ip}`);
        res.status(429).json({ success: false, message: "Too many requests. Slow down." });
    },
    store: new RedisStore({ sendCommand: (...args) => redisClient.call(...args) }),
});
app.use(ddosLimiter);

// IP based Sensitive Endpoint Limiter 
const sensitiveEndpointsLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({ success: false, message: "Too many requests" });
    },
    store: new RedisStore({ sendCommand: (...args) => redisClient.call(...args) }),
});

// Routes mapped via API Gateway /v1/notifications -> /api/notifications
app.use(
    "/api/notifications",
    sensitiveEndpointsLimiter,
    (req, res, next) => {
        req.redisClient = redisClient;
        next();
    },
    notificationRoutes
);

app.use(errorHandler);

async function startServer() {
    try {
        await connectToRabbitMQ();
        await startEventConsumer(); // Initialize the consumer to start listening to events

        app.listen(PORT, () => {
            logger.info(`Notification service running on port ${PORT}`);
        });
    } catch (error) {
        logger.error("Failed to connect to server", error);
        process.exit(1);
    }
}

startServer();

process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at", promise, "reason:", reason);
});
