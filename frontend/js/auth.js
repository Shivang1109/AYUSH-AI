// Authentication Module
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.loadUser();
    }

    // Load user from localStorage
    loadUser() {
        const userData = localStorage.getItem('ayush_user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.updateUI();
        }
    }

    // Save user to localStorage
    saveUser(user) {
        this.currentUser = user;
        localStorage.setItem('ayush_user', JSON.stringify(user));
        this.updateUI();
    }

    // Logout
    logout() {
        this.currentUser = null;
        localStorage.removeItem('ayush_user');
        localStorage.removeItem('ayush_token');
        this.updateUI();
        window.location.href = 'index.html';
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Get current user
    getUser() {
        return this.currentUser;
    }

    // Get user ID for API calls
    getUserId() {
        return this.currentUser ? this.currentUser.id : null;
    }

    // Update UI based on auth state
    updateUI() {
        const authButtons = document.getElementById('authButtons');
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');

        if (this.isLoggedIn()) {
            if (authButtons) authButtons.style.display = 'none';
            if (userMenu) userMenu.style.display = 'flex';
            if (userName) userName.textContent = this.currentUser.name || this.currentUser.email;
        } else {
            if (authButtons) authButtons.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
        }
    }

    // Simple login (for demo - in production use Supabase Auth)
    async login(email, password) {
        try {
            // For demo purposes - in production, call Supabase auth
            const user = {
                id: 'user_' + Date.now(),
                email: email,
                name: email.split('@')[0],
                createdAt: new Date().toISOString()
            };
            
            this.saveUser(user);
            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Simple signup (for demo - in production use Supabase Auth)
    async signup(name, email, password) {
        try {
            // For demo purposes - in production, call Supabase auth
            const user = {
                id: 'user_' + Date.now(),
                email: email,
                name: name,
                createdAt: new Date().toISOString()
            };
            
            this.saveUser(user);
            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = authManager;
}
