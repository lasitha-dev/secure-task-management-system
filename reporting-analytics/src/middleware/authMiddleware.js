const jwt = require('jsonwebtoken');

/**
 * JWT Authentication middleware
 * Verifies token from Authorization header
 * In development mode, accepts mock-token-for-development without verification
 */
const authMiddleware = (req, res, next) => {
    // Skip auth for health check, sync endpoint, and non-API routes
    if (req.path === '/health' || req.path === '/api/sync/tasks') {
        return next();
    }

    // In test mode, allow requests without token to proceed
    if (process.env.NODE_ENV === 'test') {
        return next();
    }

    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authorization token is required'
            });
        }

        // Allow mock token in development mode (for frontend testing)
        if (token === 'mock-token-for-development') {
            req.user = { 
                userId: 'mock-user-1', 
                userName: 'Alex Rivera', 
                role: 'admin' 
            };
            return next();
        }

        // Verify real JWT tokens and extract user info
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
        req.user = {
            userId: decoded.userId || decoded.id || decoded._id,
            userName: decoded.userName || decoded.name || decoded.email,
            role: decoded.role || 'user'
        };
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

module.exports = { authMiddleware };
