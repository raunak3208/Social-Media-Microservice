const logger = require("./logger");

const errorHandler = (err, req, res, next) => {
    logger.error(err.stack); // Log the error stack for debugging

    const statusCode = err.status || 500;

    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};

module.exports = errorHandler;