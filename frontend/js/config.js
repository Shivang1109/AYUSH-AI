// API Configuration
const CONFIG = {
    API_URL: 'https://ayush-ai.onrender.com',
    SUPABASE_URL: 'https://your-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key'
};

const API_CONFIG = {
    BASE_URL: 'https://ayush-ai.onrender.com',
    ENDPOINTS: {
        HEALTH: '/api/health',
        ASK: '/api/ask',
        HISTORY: '/api/history',
        REMEDIES: '/api/remedies'
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, API_CONFIG };
}
