const jwt = require('jsonwebtoken');

function protect(req, res, next) {
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

        req.user = {
            id: decoded.id,
            name: decoded.name || 'Unknown User',
            email: decoded.email || '',
            role: decoded.role || 'user',
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired.' });
        }

        return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
}

function protectInternalService(req, res, next) {
    const configuredToken = process.env.INTERNAL_SERVICE_TOKEN;
    const providedToken = req.headers['x-internal-service-token'];
    const serviceName = req.headers['x-service-name'];

    if (!configuredToken) {
        return res.status(500).json({
            success: false,
            message: 'Internal service authentication is not configured.',
        });
    }

    if (!serviceName || !providedToken || providedToken !== configuredToken) {
        return res.status(403).json({
            success: false,
            message: 'Invalid internal service credentials.',
        });
    }

    req.internalService = { name: serviceName };
    next();
}

module.exports = { protect, protectInternalService };