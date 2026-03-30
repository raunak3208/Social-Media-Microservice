require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");

const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");
const { validateToken } = require("./middleware/authMiddleware");
const { connectRabbitMQ } = require("./utils/rabbitmq");
const { startEventConsumer } = require("./events/consumer");
const redisClient = require("./utils/redisClient");

const feedRoutes = require("./routes/feedRoutes");

const app = express();
const PORT = process.env.PORT || 3007;

// Database Connection
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/sm-feed-service")
    .then(() => logger.info("Connected to MongoDB for Feed Service"))
    .catch((err) => logger.error("MongoDB connection error:", err));

// RabbitMQ Connection & Consumer Initialization
connectRabbitMQ().then(() => {
    startEventConsumer();
});

app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({ success: false, message: "Too many requests" });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
});

app.use(limiter);

// Logging Middleware
app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    next();
});

// Routes
// Using validateToken on all feed routes
app.use("/api/feed", validateToken, feedRoutes);

// Error Handling Middleware
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Feed Service running on port ${PORT}`);
});
