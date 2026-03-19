const jwt = require("jsonwebtoken");

const validateToken = (req, res, next) => {
    let token;

    // Support token in Authorization header
    let authHeader = req.headers.Authorization || req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: "User is not authorized or token is missing" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ success: false, message: "User is not authorized" });
    }
};

module.exports = { validateToken };
