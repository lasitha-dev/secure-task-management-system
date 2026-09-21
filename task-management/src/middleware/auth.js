const jwt = require('jsonwebtoken');

/**
 * Auth Middleware
 * -------------------------------------------------------------------
 * Validates the JWT token in the Authorization header.
 * Extracts user information from the JWT payload.
 * -------------------------------------------------------------------
 */
const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Access denied.',
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Use user data from JWT token
        req.user = {
            id: decoded.id,
            name: decoded.name || 'Unknown User',
            email: decoded.email || '',
            role: decoded.role || 'user',
        };

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired.' });
        }
        return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
};

/**
 * Role-based access control middleware
 * Usage: authorize('admin', 'developer')
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user?.role}' is not allowed to perform this action.`,
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
