// Professional Wellness App Logic
let currentLanguage = 'en';
let consultationHistory = [];

// Emergency keywords for detection
const EMERGENCY_KEYWORDS = [
    'chest pain', 'severe bleeding', 'high fever', 'difficulty breathing',
    'unconscious', 'seizure', 'severe headache', 'stroke', 'heart attack',
    'suicide', 'severe burn', 'poisoning', 'broken bone'
];

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadHistory();
});

function initializeApp() {
    // Check authentication
    if (!authManager.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    const user = authManager.getUser();
    const userName = user.name || user.email.split('@')[0];
    document.getElementById('headerUserName').textContent = userName;
    
    // Set user avatar initial
    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar) {
        const initial = user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();
        userAvatar.textContent = initial;
    }
    
    // Load consultation history
    consultationHistory = JSON.parse(localStorage.getItem('consultation_history') || '[]');
}

function setupEventListeners() {
    // Language toggle
    document.querySelectorAll('.lang-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.lang-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLanguage = btn.dataset.lang;
            updateLanguage();
        });
    });
    
    // Logout
    document.getElementById('headerLogout').addEventListener('click', () => {
        authManager.logout();
    });
    
    // Quick action buttons
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const symptom = btn.dataset.symptom;
            document.getElementById('symptomInput').value = symptom;
            analyzeSymptoms();
        });
    });
    
    // Symptom tags
    document.querySelectorAll('.symptom-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const currentInput = document.getElementById('symptomInput').value;
            const tagText = tag.dataset.tag;
            document.getElementById('symptomInput').value = currentInput ? 
                `${currentInput}, ${tagText}` : tagText;
        });
    });
    
    // Send button
    document.getElementById('sendBtn').addEventListener('click', analyzeSymptoms);
    
    // Enter key to send
    document.getElementById('symptomInput').addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            analyzeSymptoms();
        }
    });
    
    // History toggle (mobile)
    document.getElementById('historyToggleBtn')?.addEventListener('click', () => {
        document.getElementById('historySidebar').classList.toggle('open');
    });
    
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
        document.getElementById('historySidebar').classList.remove('open');
    });
}

function updateLanguage() {
    // Update UI text based on language
    if (currentLanguage === 'hi') {
        document.querySelector('.welcome-text').textContent = 'आज आपकी सेहत में कैसे मदद कर सकता हूं?';
        document.getElementById('symptomInput').placeholder = 'अपने लक्षणों का विस्तार से वर्णन करें...';
        document.querySelector('.send-text').textContent = 'विश्लेषण करें';
    } else {
        document.querySelector('.welcome-text').textContent = 'How can I help your wellness today?';
        document.getElementById('symptomInput').placeholder = 'Describe your symptoms in detail...';
        document.querySelector('.send-text').textContent = 'Analyze';
    }
}

async function analyzeSymptoms() {
    const input = document.getElementById('symptomInput');
    const symptom = input.value.trim();
    
    if (!symptom || symptom.length < 5) {
        alert('Please describe your symptoms in more detail');
        return;
    }
    
    // Check for emergency keywords
    if (detectEmergency(symptom)) {
        showEmergencyAlert();
    }
    
    // Add user message to chat
    addMessage(symptom, 'user');
    
    // Clear input
    input.value = '';
    
    // Show loading
    showLoading();
    
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': authManager.getUserId()
            },
            body: JSON.stringify({
                symptom: symptom,
                language: currentLanguage
            })
        });
        
        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        const data = await response.json();
        
        // Remove loading
        removeLoading();
        
        // Display structured remedy card
        displayRemedyCard(data, symptom);
        
        // Save to history
        saveToHistory(symptom, data);
        
    } catch (error) {
        removeLoading();
        addMessage('Sorry, I encountered an error. Please try again.', 'ai');
        console.error('Error:', error);
    }
}

function detectEmergency(text) {
    const lowerText = text.toLowerCase();
    return EMERGENCY_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

function showEmergencyAlert() {
    const alert = document.getElementById('emergencyAlert');
    alert.style.display = 'flex';
    alert.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function addMessage(text, type) {
    const chatContainer = document.getElementById('chatContainer');
    
    // Hide empty state on first message
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    
    if (type === 'user') {
        const user = authManager.getUser();
        const initial = user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();
        avatar.textContent = initial;
    } else {
        avatar.textContent = 'A';
    }
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = text;
    
    message.appendChild(avatar);
    message.appendChild(bubble);
    chatContainer.appendChild(message);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showLoading() {
    const chatContainer = document.getElementById('chatContainer');
    const loading = document.createElement('div');
    loading.className = 'message ai';
    loading.id = 'loadingMessage';
    
    loading.innerHTML = `
        <div class="message-bubble">
            <div class="loading-indicator">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            </div>
        </div>
    `;
    
    chatContainer.appendChild(loading);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoading() {
    const loading = document.getElementById('loadingMessage');
    if (loading) loading.remove();
}

function displayRemedyCard(data, symptom) {
    const chatContainer = document.getElementById('chatContainer');
    const message = document.createElement('div');
    message.className = 'message ai';
    
    // Determine remedy type
    let remedyType = 'Ayurveda';
    let badgeClass = 'badge-ayurveda';
    
    if (data.yoga && data.yoga !== 'N/A') {
        remedyType = 'Yoga';
        badgeClass = 'badge-yoga';
    }
    
    // Create structured card
    const card = document.createElement('div');
    card.className = 'remedy-card';
    
    // Check if remedy has an ID (from dataset)
    const canSave = data.remedy_id && data.remedy_id !== null;
    
    card.innerHTML = `
        <div class="remedy-header">
            <div>
                <h3 class="remedy-title">${data.remedy_name}</h3>
                ${data.match_score ? `<span class="match-score">Match: ${data.match_score}%</span>` : ''}
            </div>
            <div class="remedy-header-right">
                <span class="remedy-badge ${badgeClass}">${remedyType}</span>
                ${canSave ? `
                    <button class="save-remedy-btn" onclick="toggleSaveRemedy('${data.remedy_id}', '${data.remedy_name.replace(/'/g, "\\'")}', this)" title="Save remedy">
                        <span class="save-icon">☆</span>
                    </button>
                ` : ''}
            </div>
        </div>
        
        <div class="remedy-section">
            <h4 class="section-title">Primary Remedy</h4>
            <div class="section-content">
                <strong>${data.herb}</strong>
                ${data.herb_scientific ? `<em>(${data.herb_scientific})</em>` : ''}
            </div>
        </div>
        
        <div class="remedy-section">
            <h4 class="section-title">Usage Instructions</h4>
            <div class="section-content">${data.dosage}</div>
        </div>
        
        ${data.yoga && data.yoga !== 'N/A' ? `
        <div class="remedy-section">
            <h4 class="section-title">Yoga Practice</h4>
            <div class="section-content">${data.yoga}</div>
        </div>
        ` : ''}
        
        ${data.diet && data.diet !== 'N/A' ? `
        <div class="remedy-section">
            <h4 class="section-title">Dietary Recommendations</h4>
            <div class="section-content">${data.diet}</div>
        </div>
        ` : ''}
        
        <div class="explainability-box">
            <h4>Why this helps</h4>
            <p><strong>Matches symptoms:</strong> ${symptom}</p>
            ${data.matched_symptoms && data.matched_symptoms.length > 0 ? `
                <p><strong>Matched keywords:</strong> ${data.matched_symptoms.join(', ')}</p>
            ` : ''}
            <p>${data.explanation}</p>
            <p><strong>Dosha balance:</strong> ${data.dosha}</p>
            ${data.dosha_adjusted ? '<p><strong>✨ Personalized for your dosha</strong></p>' : ''}
            <p><strong>Source:</strong> ${data.source === 'dataset' ? 'Traditional AYUSH Database' : 'AI-Generated Recommendation'}</p>
        </div>
        
        <div class="safety-box">
            <h4>Safety & Precautions</h4>
            <ul>
                <li>${data.warning}</li>
                <li>Consult a certified AYUSH practitioner before starting treatment</li>
                <li>Discontinue if you experience adverse reactions</li>
                <li>Not a substitute for professional medical advice</li>
            </ul>
        </div>
        
        <div class="remedy-actions">
            <button class="action-btn" onclick="window.open('https://www.ayush.gov.in/', '_blank')">
                Find Practitioner
            </button>
        </div>
    `;
    
    message.appendChild(card);
    chatContainer.appendChild(message);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Check if already saved
    if (canSave) {
        checkIfSaved(data.remedy_id);
    }
}

function saveRemedy(remedyName) {
    const saved = JSON.parse(localStorage.getItem('saved_remedies') || '[]');
    if (!saved.includes(remedyName)) {
        saved.push(remedyName);
        localStorage.setItem('saved_remedies', JSON.stringify(saved));
        alert('Remedy saved to your profile!');
    } else {
        alert('This remedy is already saved');
    }
}

function saveToHistory(symptom, data) {
    const consultation = {
        id: 'consult_' + Date.now(),
        symptom: symptom,
        remedy_name: data.remedy_name,
        source: data.source,
        created_at: new Date().toISOString(),
        user_id: authManager.getUserId()
    };
    
    consultationHistory.unshift(consultation);
    localStorage.setItem('consultation_history', JSON.stringify(consultationHistory));
    
    // Update history sidebar
    loadHistory();
}

function loadHistory() {
    const historyList = document.getElementById('historyList');
    const history = JSON.parse(localStorage.getItem('consultation_history') || '[]');
    
    if (history.length === 0) {
        historyList.innerHTML = '<div class="empty-history"><p>No consultations yet</p></div>';
        return;
    }
    
    historyList.innerHTML = '';
    
    history.slice(0, 10).forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-item-title">${item.remedy_name}</div>
            <div class="history-item-time">${getTimeAgo(new Date(item.created_at))}</div>
        `;
        historyList.appendChild(historyItem);
    });
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

// Dosha Assessment Functions
function openDoshaModal() {
    document.getElementById('doshaModal').style.display = 'flex';
}

function closeDoshaModal() {
    document.getElementById('doshaModal').style.display = 'none';
}

// Save Remedy Functions
async function toggleSaveRemedy(remedyId, remedyName, buttonElement) {
    const icon = buttonElement.querySelector('.save-icon');
    const isSaved = icon.textContent === '★';
    
    if (isSaved) {
        // Unsave
        await unsaveRemedy(remedyId, buttonElement);
    } else {
        // Save
        await saveRemedyToDatabase(remedyId, remedyName, buttonElement);
    }
}

async function saveRemedyToDatabase(remedyId, remedyName, buttonElement) {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/remedies/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': authManager.getUserId()
            },
            body: JSON.stringify({
                remedy_id: remedyId,
                remedy_name: remedyName
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const icon = buttonElement.querySelector('.save-icon');
            icon.textContent = '★';
            buttonElement.classList.add('saved');
            buttonElement.title = 'Unsave remedy';
            
            // Show success message
            showToast('Remedy saved successfully!', 'success');
        } else if (data.already_saved) {
            const icon = buttonElement.querySelector('.save-icon');
            icon.textContent = '★';
            buttonElement.classList.add('saved');
            showToast('Remedy already saved', 'info');
        }
    } catch (error) {
        console.error('Save remedy error:', error);
        showToast('Failed to save remedy', 'error');
    }
}

async function unsaveRemedy(remedyId, buttonElement) {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/remedies/saved/${remedyId}`, {
            method: 'DELETE',
            headers: {
                'X-User-ID': authManager.getUserId()
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const icon = buttonElement.querySelector('.save-icon');
            icon.textContent = '☆';
            buttonElement.classList.remove('saved');
            buttonElement.title = 'Save remedy';
            
            showToast('Remedy removed from saved', 'info');
        }
    } catch (error) {
        console.error('Unsave remedy error:', error);
        showToast('Failed to remove remedy', 'error');
    }
}

async function checkIfSaved(remedyId) {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/remedies/is-saved/${remedyId}`, {
            headers: {
                'X-User-ID': authManager.getUserId()
            }
        });
        
        const data = await response.json();
        
        if (data.is_saved) {
            // Find the button and update it
            const buttons = document.querySelectorAll('.save-remedy-btn');
            buttons.forEach(btn => {
                if (btn.onclick.toString().includes(remedyId)) {
                    const icon = btn.querySelector('.save-icon');
                    icon.textContent = '★';
                    btn.classList.add('saved');
                    btn.title = 'Unsave remedy';
                }
            });
        }
    } catch (error) {
        console.error('Check saved error:', error);
    }
}

function showToast(message, type = 'info') {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Export functions for global access
window.saveRemedy = saveRemedyToDatabase;
window.toggleSaveRemedy = toggleSaveRemedy;
window.openDoshaModal = openDoshaModal;
window.closeDoshaModal = closeDoshaModal;
