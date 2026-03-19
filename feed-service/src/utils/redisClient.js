const Redis = require("ioredis");
const logger = require("./logger");

// Initialize Redis client
const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

redisClient.on("connect", () => {
    logger.info("Connected to Redis for Feed Service");
});

redisClient.on("error", (error) => {
    logger.error("Redis connection error:", error);
});

module.exports = redisClient;
