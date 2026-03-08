const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
    logger.error(err.stack); // Log the error stack for debugging

    // Determine the status code based on error structure (you can refine this)
    const statusCode = err.status || 500;

    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        // Optionally include stack trace in development mode only
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};

module.exports = errorHandler;
