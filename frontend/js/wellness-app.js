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
    document.getElementById('headerUserName').textContent = user.name || user.email.split('@')[0];
    
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
    avatar.textContent = type === 'user' ? '👤' : '🌿';
    
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
    
    card.innerHTML = `
        <div class="remedy-header">
            <div>
                <h3 class="remedy-title">${data.remedy_name}</h3>
            </div>
            <span class="remedy-badge ${badgeClass}">${remedyType}</span>
        </div>
        
        <div class="remedy-section">
            <h4 class="section-title">🌿 Primary Remedy</h4>
            <div class="section-content">
                <strong>${data.herb}</strong>
                ${data.herb_scientific ? `<em>(${data.herb_scientific})</em>` : ''}
            </div>
        </div>
        
        <div class="remedy-section">
            <h4 class="section-title">📋 Usage Instructions</h4>
            <div class="section-content">${data.dosage}</div>
        </div>
        
        ${data.yoga && data.yoga !== 'N/A' ? `
        <div class="remedy-section">
            <h4 class="section-title">🧘 Yoga Practice</h4>
            <div class="section-content">${data.yoga}</div>
        </div>
        ` : ''}
        
        ${data.diet && data.diet !== 'N/A' ? `
        <div class="remedy-section">
            <h4 class="section-title">🍽️ Dietary Recommendations</h4>
            <div class="section-content">${data.diet}</div>
        </div>
        ` : ''}
        
        <div class="explainability-box">
            <h4>💡 Why this helps</h4>
            <p><strong>Matches symptoms:</strong> ${symptom}</p>
            <p>${data.explanation}</p>
            <p><strong>Dosha balance:</strong> ${data.dosha}</p>
            <p><strong>Source:</strong> ${data.source === 'dataset' ? 'Traditional AYUSH Database' : 'AI-Generated Recommendation'}</p>
        </div>
        
        <div class="safety-box">
            <h4>⚠️ Safety & Precautions</h4>
            <ul>
                <li>${data.warning}</li>
                <li>Consult a certified AYUSH practitioner before starting treatment</li>
                <li>Discontinue if you experience adverse reactions</li>
                <li>Not a substitute for professional medical advice</li>
            </ul>
        </div>
        
        <div class="remedy-actions">
            <button class="action-btn primary" onclick="saveRemedy('${data.remedy_name}')">
                ⭐ Save Remedy
            </button>
            <button class="action-btn" onclick="window.open('https://www.ayush.gov.in/', '_blank')">
                🏥 Find Practitioner
            </button>
        </div>
    `;
    
    message.appendChild(card);
    chatContainer.appendChild(message);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function saveRemedy(remedyName) {
    const saved = JSON.parse(localStorage.getItem('saved_remedies') || '[]');
    if (!saved.includes(remedyName)) {
        saved.push(remedyName);
        localStorage.setItem('saved_remedies', JSON.stringify(saved));
        alert('✅ Remedy saved to your profile!');
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

// Export functions for global access
window.saveRemedy = saveRemedy;
window.openDoshaModal = openDoshaModal;
window.closeDoshaModal = closeDoshaModal;
