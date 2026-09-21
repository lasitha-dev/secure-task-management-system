const axios = require('axios');

/**
 * User Service
 * -----------------------------------------------------------------
 * Fetches real user data from the User Management microservice
 * via API Gateway
 * -----------------------------------------------------------------
 */

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://api-gateway:8000';

/**
 * Get all users from user management service
 * @param {string} authToken - JWT token for authentication
 */
async function getAllUsers(authToken = null) {
    try {
        const headers = {};
        if (authToken) {
            headers.Authorization = `Bearer ${authToken}`;
        }
        
        const response = await axios.get(`${API_GATEWAY_URL}/api/users/search`, {
            timeout: 5000,
            params: { limit: 50 },
            headers
        });
        
        if (response.data && response.data.users) {
            return response.data.users.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role || 'user',
                avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=144bb8&color=fff`
            }));
        }
        return [];
    } catch (error) {
        console.error('Error fetching users from user management:', error.message);
        return [];
    }
}

/**
 * Find user by ID
 */
async function getUserById(id) {
    try {
        const response = await axios.get(`${API_GATEWAY_URL}/api/users/${id}`, {
            timeout: 5000
        });
        
        if (response.data && response.data.user) {
            const user = response.data.user;
            return {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role || 'user',
                avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=144bb8&color=fff`
            };
        }
        return null;
    } catch (error) {
        console.error(`Error fetching user ${id}:`, error.message);
        return null;
    }
}

/**
 * Find user by email
 */
async function getUserByEmail(email) {
    try {
        const users = await getAllUsers();
        return users.find(u => u.email === email) || null;
    } catch (error) {
        console.error(`Error finding user by email ${email}:`, error.message);
        return null;
    }
}

/**
 * Validate that a userId exists
 */
async function isValidUser(id) {
    try {
        const user = await getUserById(id);
        return user !== null;
    } catch (error) {
        return false;
    }
}

/**
 * Search users by name or email (case-insensitive)
 * @param {string} query - Search query
 * @param {number} limit - Max results to return
 * @param {string} authToken - JWT token for authentication
 */
async function searchUsers(query = '', limit = 10, authToken = null) {
    try {
        const users = await getAllUsers(authToken);
        
        if (!query || query.trim() === '') {
            return users.slice(0, limit);
        }
        
        const q = query.toLowerCase();
        const filtered = users.filter(user =>
            user.name.toLowerCase().includes(q) ||
            user.email.toLowerCase().includes(q)
        );
        
        return filtered.slice(0, limit);
    } catch (error) {
        console.error('Error searching users:', error.message);
        return [];
    }
}

module.exports = {
    getAllUsers,
    getUserById,
    getUserByEmail,
    isValidUser,
    searchUsers,
};
