// API Configuration
const API_CONFIG = {
    BASE_URL: 'https://ayush-ai.onrender.com',
    ENDPOINTS: {
        HEALTH: '/health',
        ANALYZE: '/api/analyze',
        HISTORY: '/api/history',
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
}
