const winston = require("winston");

// Create logger
const logger = winston.createLogger({
  // Log level based on environment
  level: process.env.NODE_ENV === "production" ? "info" : "debug",

  // Log format
  format: winston.format.combine(
    winston.format.timestamp(), // add time
    winston.format.errors({ stack: true }), // show error stack
    winston.format.splat(), // support string formatting
    winston.format.json() // store logs in JSON
  ),

  // Metadata added to every log
  defaultMeta: { service: "identity-service" },

  // Where logs will be stored
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // colored logs in terminal
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: "error.log", level: "error" }), // only errors
    new winston.transports.File({ filename: "combined.log" }), // all logs
  ],
});

module.exports = logger; // export logger