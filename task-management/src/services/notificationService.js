const axios = require('axios');

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://api-gateway:8000';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

function buildHeaders(authToken) {
    const headers = {
        'Content-Type': 'application/json',
        'x-service-name': 'task-management',
    };

    if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
    }

    if (INTERNAL_SERVICE_TOKEN) {
        headers['x-internal-service-token'] = INTERNAL_SERVICE_TOKEN;
    }

    return headers;
}

async function createNotification(notification, authToken = null) {
    const response = await axios.post(
        `${API_GATEWAY_URL}/api/notifications/internal`,
        notification,
        {
            timeout: 5000,
            headers: buildHeaders(authToken),
        }
    );

    return response.data?.data || null;
}

async function createBulkNotifications(notifications, authToken = null) {
    if (!Array.isArray(notifications) || notifications.length === 0) {
        return [];
    }

    return Promise.all(notifications.map((notification) => createNotification(notification, authToken)));
}

module.exports = {
    createNotification,
    createBulkNotifications,
};