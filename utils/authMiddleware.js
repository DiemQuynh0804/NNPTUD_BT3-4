const jwt = require("jsonwebtoken");

// Middleware kiểm tra token và quyền
const authMiddleware = (roles = []) => {
    return (req, res, next) => {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;

            // Kiểm tra quyền
            if (roles.length && !roles.includes(req.user.role)) {
                return res.status(403).json({ message: "Forbidden: No permission" });
            }

            next();
        } catch (error) {
            return res.status(401).json({ message: "Invalid token" });
        }
    };
};

module.exports = authMiddleware;