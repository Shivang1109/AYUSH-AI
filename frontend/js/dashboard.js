// Dashboard functionality
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    if (!authManager.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    initializeDashboard();
    setupEventListeners();
});

function initializeDashboard() {
    const user = authManager.getUser();
    
    // Update user name displays
    document.getElementById('userName').textContent = user.name || user.email;
    document.getElementById('userNameDisplay').textContent = user.name || user.email.split('@')[0];
    
    // Load user stats
    loadUserStats();
    
    // Load recent activity
    loadRecentActivity();
}

function setupEventListeners() {
    // User menu toggle
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        userDropdown.classList.remove('show');
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        authManager.logout();
    });
}

function loadUserStats() {
    // Get consultation history from localStorage
    const history = JSON.parse(localStorage.getItem('consultation_history') || '[]');
    
    // Calculate stats
    const totalConsultations = history.length;
    const remediesUsed = new Set(history.map(item => item.remedy_name)).size;
    
    // Calculate days active
    const firstConsultation = history.length > 0 ? new Date(history[0].created_at) : new Date();
    const daysActive = Math.ceil((new Date() - firstConsultation) / (1000 * 60 * 60 * 24));
    
    // Update UI
    document.getElementById('totalConsultations').textContent = totalConsultations;
    document.getElementById('remediesUsed').textContent = remediesUsed;
    document.getElementById('daysActive').textContent = daysActive;
    
    // Animate numbers
    animateValue('totalConsultations', 0, totalConsultations, 1000);
    animateValue('remediesUsed', 0, remediesUsed, 1000);
    animateValue('daysActive', 0, daysActive, 1000);
}

function loadRecentActivity() {
    const history = JSON.parse(localStorage.getItem('consultation_history') || '[]');
    const activityList = document.getElementById('recentActivity');
    
    if (history.length === 0) {
        return; // Show empty state
    }
    
    // Clear empty state
    activityList.innerHTML = '';
    
    // Show last 5 consultations
    const recentItems = history.slice(-5).reverse();
    
    recentItems.forEach(item => {
        const activityCard = createActivityCard(item);
        activityList.appendChild(activityCard);
    });
}

function createActivityCard(item) {
    const card = document.createElement('div');
    card.className = 'activity-card';
    
    const date = new Date(item.created_at);
    const timeAgo = getTimeAgo(date);
    
    card.innerHTML = `
        <div class="activity-icon">
            ${item.source === 'dataset' ? 'DB' : 'AI'}
        </div>
        <div class="activity-content">
            <h4>${item.remedy_name}</h4>
            <p class="activity-symptom">${item.symptom}</p>
            <div class="activity-meta">
                <span class="activity-time">${timeAgo}</span>
                <span class="activity-source">${item.source === 'dataset' ? 'Database' : 'AI Generated'}</span>
            </div>
        </div>
        <button class="activity-action" onclick="viewConsultation('${item.id}')">
            View →
        </button>
    `;
    
    return card;
}

function viewConsultation(id) {
    // Store consultation ID and redirect to results page
    localStorage.setItem('view_consultation_id', id);
    window.location.href = 'index.html#results';
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
    }
    
    return 'Just now';
}

function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

// Save consultation to history
function saveConsultation(data) {
    const history = JSON.parse(localStorage.getItem('consultation_history') || '[]');
    
    const consultation = {
        id: 'consult_' + Date.now(),
        symptom: data.symptom || 'Unknown',
        remedy_name: data.remedy_name,
        source: data.source,
        created_at: new Date().toISOString(),
        user_id: authManager.getUserId()
    };
    
    history.push(consultation);
    localStorage.setItem('consultation_history', JSON.stringify(history));
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { saveConsultation };
}
