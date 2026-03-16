const Joi = require("joi");

const validateRequest = (schema) => {
    return (req, res, next) => {
        // Only validate if a body or query schema is passed (useful for extendability)
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const errors = error.details.map((detail) => detail.message);
            return res.status(400).json({
                success: false,
                message: "Validation Error",
                errors,
            });
        }
        next();
    };
};

module.exports = validateRequest;
