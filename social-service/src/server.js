require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");

const followRoutes = require("./routes/followRoutes");
const networkRoutes = require("./routes/networkRoutes");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const { connectToRabbitMQ } = require("./utils/rabbitmq");

const app = express();
const PORT = process.env.PORT || 3006;

//connect to mongodb
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => logger.info("Connected to mongodb"))
    .catch((e) => logger.error("Mongo connection error", e));

const redisClient = new Redis(process.env.REDIS_URL);

//middleware
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

//IP based Sensitive Endpoint Limiter 
const sensitiveEndpointsLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({ success: false, message: "Too many requests" });
    },
    store: new RedisStore({ sendCommand: (...args) => redisClient.call(...args) }),
});

// Routes matched to Gateway Proxy '/v1/social' re-written as needed
// Meaning API Gateway -> proxyReqPathResolver -> req.originalUrl.replace(/^\/v1/, "/api") -> '/api/social/...'
app.use(
    "/api/social/follow",
    sensitiveEndpointsLimiter,
    (req, res, next) => {
        req.redisClient = redisClient;
        next();
    },
    followRoutes
);

app.use(
    "/api/social/network",
    (req, res, next) => {
        req.redisClient = redisClient;
        next();
    },
    networkRoutes
);

app.use(errorHandler);

async function startServer() {
    try {
        await connectToRabbitMQ();
        app.listen(PORT, () => {
            logger.info(`Social service running on port ${PORT}`);
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
