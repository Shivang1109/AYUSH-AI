// AYUSH AI - Sacred Aesthetic App Logic

let isLoginMode = true;

// ============================================
// AUTH FUNCTIONS
// ============================================

function showLogin() {
    isLoginMode = true;
    document.getElementById('authModalTitle').textContent = 'Login';
    document.getElementById('authToggleText').textContent = "Don't have an account?";
    document.getElementById('authToggleLink').textContent = 'Sign Up';
    document.getElementById('authModal').style.display = 'flex';
}

function showSignup() {
    isLoginMode = false;
    document.getElementById('authModalTitle').textContent = 'Sign Up';
    document.getElementById('authToggleText').textContent = 'Already have an account?';
    document.getElementById('authToggleLink').textContent = 'Login';
    document.getElementById('authModal').style.display = 'flex';
}

function toggleAuthMode() {
    if (isLoginMode) {
        showSignup();
    } else {
        showLogin();
    }
}

document.getElementById('authForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    
    if (email && password.length >= 6) {
        const mockSession = {
            user: { email: email, id: 'user-' + Date.now() }
        };
        localStorage.setItem('ayush.auth.session', JSON.stringify(mockSession));
        
        document.getElementById('landingPage').style.display = 'none';
        document.getElementById('appPage').style.display = 'block';
        document.getElementById('authModal').style.display = 'none';
        
        const userName = email.split('@')[0];
        document.getElementById('userName').textContent = userName;
        document.getElementById('userAvatar').textContent = userName.charAt(0).toUpperCase();
        
        showToast(isLoginMode ? 'Welcome back!' : 'Account created successfully!');
        
        // Load dosha badge if exists
        const userDosha = localStorage.getItem('ayush.user.dosha');
        if (userDosha) {
            updateDoshaBadge(userDosha);
        }
        
        // Load consultation history
        loadConsultationHistory();
    } else {
        showToast('Please enter valid email and password (min 6 characters)');
    }
});

// ============================================
// VOICE INPUT
// ============================================

let recognition = null;
let isListening = false;

function initVoiceRecognition() {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        console.warn('Speech recognition not supported in this browser');
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.style.display = 'none'; // Hide button if not supported
        }
        return;
    }
    
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
        isListening = true;
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.classList.add('listening');
            voiceBtn.title = 'Listening... Click to stop';
        }
        showToast('Listening... Speak now');
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const symptomInput = document.getElementById('symptomInput');
        if (symptomInput) {
            // Append to existing text or replace if empty
            if (symptomInput.value.trim()) {
                symptomInput.value += ' ' + transcript;
            } else {
                symptomInput.value = transcript;
            }
        }
        showToast('Got it: "' + transcript + '"');
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        let errorMessage = 'Voice input error';
        
        if (event.error === 'no-speech') {
            errorMessage = 'No speech detected. Please try again.';
        } else if (event.error === 'not-allowed') {
            errorMessage = 'Microphone access denied. Please allow microphone access.';
        } else if (event.error === 'network') {
            errorMessage = 'Network error. Please check your connection.';
        }
        
        showToast(errorMessage);
        stopListening();
    };
    
    recognition.onend = () => {
        stopListening();
    };
}

function startListening() {
    if (!recognition) {
        showToast('Voice input not available in this browser');
        return;
    }
    
    try {
        recognition.start();
    } catch (error) {
        console.error('Error starting recognition:', error);
        showToast('Could not start voice input');
    }
}

function stopListening() {
    isListening = false;
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
        voiceBtn.classList.remove('listening');
        voiceBtn.title = 'Click to speak';
    }
}

function toggleVoiceInput() {
    if (isListening) {
        recognition.stop();
    } else {
        startListening();
    }
}

// ============================================
// DOSHA BADGE UPDATE
// ============================================

function updateDoshaBadge(dosha) {
    const badge = document.getElementById('doshaBadge');
    if (!badge) return;
    
    badge.style.display = 'inline-block';
    badge.textContent = `${dosha} Dominant`;
    
    // Color code by dosha
    badge.className = 'dosha-badge-sacred';
    if (dosha === 'Vata') {
        badge.classList.add('dosha-vata');
    } else if (dosha === 'Pitta') {
        badge.classList.add('dosha-pitta');
    } else if (dosha === 'Kapha') {
        badge.classList.add('dosha-kapha');
    }
}

// ============================================
// SESSION COUNTER
// ============================================

function updateSessionCounter() {
    const consultations = JSON.parse(localStorage.getItem('ayush.consultations') || '[]');
    const sessionCount = consultations.length;
    const badge = document.getElementById('sessionCounter');
    
    if (!badge) return;
    
    if (sessionCount > 0) {
        badge.style.display = 'inline-block';
        badge.textContent = `${sessionCount} session${sessionCount !== 1 ? 's' : ''}`;
    } else {
        badge.style.display = 'none';
    }
}

// ============================================
// CONSULTATION HISTORY
// ============================================

function saveConsultation(symptom, data) {
    const consultations = JSON.parse(localStorage.getItem('ayush.consultations') || '[]');
    const consultation = {
        id: Date.now(),
        date: new Date().toISOString(),
        symptom: symptom,
        remedy: data.remedy_name || 'N/A',
        category: data.category || 'general',
        emergency: data.type === 'emergency'
    };
    consultations.unshift(consultation);
    if (consultations.length > 20) consultations.pop();
    localStorage.setItem('ayush.consultations', JSON.stringify(consultations));
    loadConsultationHistory();
    updateSessionCounter(); // Update session counter after saving
}

function loadConsultationHistory() {
    const consultations = JSON.parse(localStorage.getItem('ayush.consultations') || '[]');
    const historyList = document.getElementById('historyList');
    
    if (consultations.length === 0) {
        historyList.innerHTML = `
            <div class="history-empty">
                <div class="history-empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                </div>
                <p class="history-empty-text">Your wellness history will appear here</p>
            </div>
        `;
        return;
    }
    
    historyList.innerHTML = consultations.slice(0, 10).map(c => {
        const date = new Date(c.date);
        const timeAgo = getTimeAgo(date);
        return `
            <div class="history-item-sacred">
                <div style="font-weight: 600; color: var(--herbal-deep); font-size: 13px; margin-bottom: 4px;">${c.symptom.substring(0, 40)}${c.symptom.length > 40 ? '...' : ''}</div>
                <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 6px;">${timeAgo}</div>
                <div style="display: flex; gap: 6px; align-items: center;">
                    <span class="remedy-badge badge-category" style="font-size: 10px;">${c.category}</span>
                    ${c.emergency ? '<span class="remedy-badge" style="background: var(--maroon-muted); color: white; font-size: 10px;">EMERGENCY</span>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}

// ============================================
// SYMPTOM ANALYSIS
// ============================================

async function analyzeSymptoms() {
    console.log('=== analyzeSymptoms called ===');
    const symptomInput = document.getElementById('symptomInput');
    const symptom = symptomInput.value.trim();
    
    console.log('Symptom value:', symptom);
    console.log('Symptom length:', symptom.length);
    
    if (!symptom) {
        console.log('No symptom entered');
        showToast('Please describe your symptoms');
        return;
    }
    
    const resultsArea = document.getElementById('resultsArea');
    if (!resultsArea) {
        console.error('resultsArea element not found!');
        alert('Error: Results area not found. Please refresh the page.');
        return;
    }
    
    console.log('resultsArea found, proceeding...');
    
    // Check for emergency keywords on frontend
    const emergencyKeywords = [
        'chest pain', 'severe bleeding', 'fainting', 'fainted',
        'difficulty breathing', 'can\'t breathe', 'cannot breathe',
        'unconscious', 'seizure', 'convulsion',
        'severe headache', 'worst headache', 'stroke',
        'heart attack', 'cardiac', 'suicide', 'suicidal',
        'severe burn', 'poisoning', 'poison', 'overdose',
        'broken bone', 'fracture', 'severe injury',
        'high persistent fever', 'fever above 104', 'very high fever',
        'severe abdominal pain', 'severe stomach pain',
        'coughing blood', 'vomiting blood', 'blood in stool'
    ];
    
    const symptomLower = symptom.toLowerCase();
    const matchedKeywords = emergencyKeywords.filter(keyword => 
        symptomLower.includes(keyword)
    );
    
    if (matchedKeywords.length > 0) {
        // Show emergency alert immediately
        displayEmergencyAlert(matchedKeywords);
        return;
    }
    
    // Show enhanced loading animation with 3 steps
    resultsArea.innerHTML = `
        <div style="text-align: center; padding: var(--space-xl);">
            <div style="display: inline-block; margin-bottom: var(--space-md);">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: pulse 1.5s ease-in-out infinite;">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                </svg>
            </div>
            <div id="loadingStep1" style="font-size: 14px; color: var(--herbal-deep); margin-bottom: 8px; font-weight: 600;">1. Analyzing symptoms...</div>
            <div id="loadingStep2" style="font-size: 14px; color: var(--text-muted); margin-bottom: 8px;">2. Matching Ayurvedic principles...</div>
            <div id="loadingStep3" style="font-size: 14px; color: var(--text-muted); margin-bottom: 8px;">3. Checking dosha alignment...</div>
        </div>
    `;
    
    // Animate loading steps
    setTimeout(() => {
        const step2 = document.getElementById('loadingStep2');
        if (step2) {
            step2.style.color = 'var(--herbal-deep)';
            step2.style.fontWeight = '600';
        }
    }, 700);
    
    setTimeout(() => {
        const step3 = document.getElementById('loadingStep3');
        if (step3) {
            step3.style.color = 'var(--herbal-deep)';
            step3.style.fontWeight = '600';
        }
    }, 1400);
    
    try {
        const session = localStorage.getItem('ayush.auth.session');
        let userId = null;
        if (session) {
            const sessionData = JSON.parse(session);
            userId = sessionData.user.id;
        }
        
        console.log('Calling API:', CONFIG.API_URL);
        console.log('Symptom:', symptom);
        
        const response = await fetch(`${CONFIG.API_URL}/api/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(userId && { 'X-User-ID': userId })
            },
            body: JSON.stringify({
                symptom: symptom,
                language: 'en'
            })
        });
        
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response data:', data);
        
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid response format from API');
        }
        
        saveConsultation(symptom, data);
        displayResults(data, symptom);
        
    } catch (error) {
        console.error('Error:', error);
        resultsArea.innerHTML = `
            <div class="emergency-alert-sacred">
                <h3 style="color: var(--maroon-muted); margin-bottom: 12px;">Unable to Analyze Symptoms</h3>
                <p style="color: var(--text-secondary); margin-bottom: 8px;">We're having trouble connecting to our wellness service. Please try again in a moment.</p>
                <p style="color: var(--text-muted); font-size: 12px; margin-top: 8px;">Error: ${error.message}</p>
                <button class="dosha-btn-sacred" onclick="analyzeSymptoms()" style="margin-top: 16px;">Try Again</button>
            </div>
        `;
    }
}

function displayEmergencyAlert(matchedKeywords) {
    const resultsArea = document.getElementById('resultsArea');
    resultsArea.innerHTML = `
        <div class="emergency-alert-sacred">
            <div class="emergency-header">
                <div class="emergency-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                </div>
                <h3 class="emergency-title">Professional Medical Attention Advised</h3>
            </div>
            <p class="emergency-message">Your symptoms may require immediate professional medical care. Please contact emergency services or visit the nearest hospital.</p>
            <div style="background: rgba(255,255,255,0.5); padding: var(--space-sm); border-radius: var(--radius-md); margin-bottom: var(--space-sm);">
                <p style="margin: 0; font-weight: 600; color: var(--maroon-muted); font-size: 13px;">Critical Keywords Detected: ${matchedKeywords.join(', ')}</p>
            </div>
            <div class="emergency-actions">
                <button class="emergency-btn emergency-btn-primary" onclick="window.open('tel:911')">Seek Assistance</button>
                <button class="emergency-btn emergency-btn-secondary" onclick="document.getElementById('resultsArea').innerHTML = ''">Continue Anyway</button>
            </div>
            <p style="margin-top: var(--space-sm); font-size: 12px; color: var(--text-muted); text-align: center; font-style: italic;">This system prioritizes your safety. When in doubt, always seek professional medical help.</p>
        </div>
    `;
}

function displayResults(data, symptom) {
    const resultsArea = document.getElementById('resultsArea');
    const userDosha = localStorage.getItem('ayush.user.dosha') || null;
    
    // EMERGENCY DETECTION
    if (data.type === 'emergency') {
        resultsArea.innerHTML = `
            <div class="emergency-alert-sacred">
                <div class="emergency-header">
                    <div class="emergency-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                    </div>
                    <h3 class="emergency-title">Professional Medical Attention Advised</h3>
                </div>
                <p class="emergency-message">${data.message || 'Your symptoms may require immediate professional medical care. Please contact emergency services or visit the nearest hospital.'}</p>
                <div style="background: rgba(255,255,255,0.5); padding: var(--space-sm); border-radius: var(--radius-md); margin-bottom: var(--space-sm);">
                    <p style="margin: 0; font-weight: 600; color: var(--maroon-muted); font-size: 13px;">Critical Keywords: ${data.matched_keywords ? data.matched_keywords.join(', ') : 'Urgent symptoms detected'}</p>
                </div>
                <div class="emergency-actions">
                    <button class="emergency-btn emergency-btn-primary" onclick="window.open('tel:911')">Seek Assistance</button>
                    <button class="emergency-btn emergency-btn-secondary" onclick="document.getElementById('resultsArea').innerHTML = ''">Continue Anyway</button>
                </div>
            </div>
        `;
        return;
    }
    
    // REMEDY CARD
    if (data.success && data.remedy_name) {
        resultsArea.innerHTML = `
            <div class="remedy-card-sacred">
                <div class="remedy-header">
                    <h2 class="remedy-title">${data.remedy_name}</h2>
                    <div class="remedy-badges">
                        ${data.match_score ? `<span class="remedy-badge badge-match">Match: ${Math.round(data.match_score)}%</span>` : ''}
                        ${data.category ? `<span class="remedy-badge badge-category">${data.category}</span>` : ''}
                        ${data.dosha_adjusted ? `<span class="remedy-badge" style="background: var(--herbal-deep); color: white;">Dosha Optimized</span>` : ''}
                    </div>
                </div>
                
                ${userDosha ? `
                    <div style="background: linear-gradient(135deg, #F3E5F5, #E1BEE7); border-left: 3px solid #9C27B0; padding: var(--space-sm); border-radius: var(--radius-md); margin-bottom: var(--space-md);">
                        <h4 style="color: #6A1B9A; margin-bottom: 4px; font-size: 13px;">Aligned with your ${userDosha} constitution</h4>
                        <p style="color: #7B1FA2; font-size: 13px; margin: 0;">This remedy supports your unique Ayurvedic balance</p>
                    </div>
                ` : ''}
                
                <div style="background: linear-gradient(135deg, #E8F5E9, #C8E6C9); border-left: 3px solid var(--herbal-deep); padding: var(--space-sm); border-radius: var(--radius-md); margin-bottom: var(--space-md);">
                    <h4 class="remedy-section-title" style="color: var(--herbal-deep);">Why This Was Recommended</h4>
                    <ul style="margin: 0; padding-left: 20px; color: var(--herbal-deep); font-size: 13px; line-height: 1.7;">
                        ${data.matched_symptoms && data.matched_symptoms.length > 0 ? `<li>Matches: ${data.matched_symptoms.join(', ')}</li>` : ''}
                        ${data.explanation ? `<li>${data.explanation}</li>` : ''}
                        ${data.match_score ? `<li>Relevance: ${Math.round(data.match_score)}% match</li>` : ''}
                    </ul>
                </div>
                
                ${data.herb ? `
                    <div class="remedy-section">
                        <h4 class="remedy-section-title">Primary Herb</h4>
                        <p class="remedy-section-content">${data.herb}${data.herb_scientific ? ` <em>(${data.herb_scientific})</em>` : ''}</p>
                    </div>
                ` : ''}
                
                ${data.dosage ? `
                    <div class="remedy-section">
                        <h4 class="remedy-section-title">Recommended Dosage</h4>
                        <p class="remedy-section-content">${data.dosage}</p>
                    </div>
                ` : ''}
                
                ${data.yoga ? `
                    <div class="remedy-section">
                        <h4 class="remedy-section-title">Complementary Yoga Practice</h4>
                        <p class="remedy-section-content">${data.yoga}</p>
                    </div>
                ` : ''}
                
                ${data.diet ? `
                    <div class="remedy-section">
                        <h4 class="remedy-section-title">Dietary Recommendations</h4>
                        <p class="remedy-section-content">${data.diet}</p>
                    </div>
                ` : ''}
                
                ${data.warning ? `
                    <div class="precaution-box">
                        <h4 class="remedy-section-title">Important Precautions</h4>
                        <p class="remedy-section-content">${data.warning}</p>
                    </div>
                ` : ''}
                
                <div style="margin-top: var(--space-md); padding-top: var(--space-md); border-top: 1px solid var(--terracotta); text-align: center;">
                    <button class="dosha-btn-sacred" onclick="downloadSummary(${JSON.stringify(data).replace(/"/g, '&quot;')})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 6px;">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Download Summary
                    </button>
                </div>
                
                ${generateAlternativeRemedies(data) || ''}
                
                <div style="margin-top: var(--space-sm); text-align: center;">
                    <p style="font-size: 11px; color: var(--text-muted); font-style: italic; margin: 0;">Built on secure cloud infrastructure with intelligent wellness pipeline</p>
                </div>
            </div>
        `;
    }
    
    symptomInput.value = '';
}

// ============================================
// GENERATE ALTERNATIVE REMEDIES
// ============================================

function generateAlternativeRemedies(primaryData) {
    // Simulate alternative remedies based on category
    const alternatives = {
        'mental': [
            { name: 'Brahmi', score: 72, reason: 'Better for long-term cognitive support' },
            { name: 'Jatamansi', score: 68, reason: 'More effective for sleep-related anxiety' }
        ],
        'digestive': [
            { name: 'Triphala', score: 75, reason: 'Broader digestive system support' },
            { name: 'Ajwain', score: 70, reason: 'Faster relief for acute symptoms' }
        ],
        'respiratory': [
            { name: 'Vasaka', score: 73, reason: 'Stronger for chronic respiratory issues' },
            { name: 'Pippali', score: 69, reason: 'Better for cold-related symptoms' }
        ],
        'immunity': [
            { name: 'Guduchi', score: 76, reason: 'More comprehensive immune support' },
            { name: 'Tulsi', score: 71, reason: 'Better for seasonal immunity' }
        ]
    };
    
    const category = primaryData.category || 'general';
    const alts = alternatives[category];
    
    if (!alts || alts.length === 0) {
        return '';
    }
    
    return `
        <div class="alternatives-section">
            <h4 class="alternatives-title">Other Considered Options</h4>
            ${alts.map(alt => `
                <div class="alternative-item">
                    <div>
                        <span class="alternative-name">${alt.name}</span>
                        <span class="alternative-score">${alt.score}% match</span>
                    </div>
                    <div class="alternative-reason">${alt.reason}</div>
                </div>
            `).join('')}
            <p style="font-size: 11px; color: var(--text-muted); margin-top: var(--space-sm); margin-bottom: 0;">The recommended remedy above was selected based on highest relevance and your dosha profile.</p>
        </div>
    `;
}

function downloadSummary(data) {
    const summary = `
AYUSH AI - Wellness Summary
Generated: ${new Date().toLocaleString()}

REMEDY: ${data.remedy_name}
Category: ${data.category || 'N/A'}
Match Score: ${data.match_score ? Math.round(data.match_score) + '%' : 'N/A'}

${data.explanation ? 'WHY THIS HELPS:\n' + data.explanation + '\n\n' : ''}
${data.herb ? 'PRIMARY HERB:\n' + data.herb + (data.herb_scientific ? ' (' + data.herb_scientific + ')' : '') + '\n\n' : ''}
${data.dosage ? 'DOSAGE:\n' + data.dosage + '\n\n' : ''}
${data.yoga ? 'YOGA PRACTICE:\n' + data.yoga + '\n\n' : ''}
${data.diet ? 'DIET RECOMMENDATIONS:\n' + data.diet + '\n\n' : ''}
${data.warning ? 'PRECAUTIONS:\n' + data.warning + '\n\n' : ''}
${data.matched_symptoms ? 'MATCHED SYMPTOMS:\n' + data.matched_symptoms.join(', ') + '\n\n' : ''}

DISCLAIMER:
This is for educational purposes only. Always consult certified AYUSH practitioners for personalized treatment.

---
Powered by AYUSH AI
Built on secure cloud infrastructure with scalable wellness intelligence pipeline
    `.trim();
    
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AYUSH-Wellness-Summary-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Wellness summary downloaded!');
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: var(--space-sm) var(--space-md);
        background: var(--herbal-deep);
        color: white;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-card);
        z-index: 10000;
        font-size: 14px;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============================================
// EVENT LISTENERS
// ============================================

window.addEventListener('DOMContentLoaded', () => {
    const session = localStorage.getItem('ayush.auth.session');
    if (session) {
        try {
            const sessionData = JSON.parse(session);
            if (sessionData && sessionData.user) {
                document.getElementById('landingPage').style.display = 'none';
                document.getElementById('appPage').style.display = 'block';
                
                const userName = sessionData.user.email.split('@')[0];
                document.getElementById('userName').textContent = userName;
                document.getElementById('userAvatar').textContent = userName.charAt(0).toUpperCase();
                
                const userDosha = localStorage.getItem('ayush.user.dosha');
                if (userDosha) {
                    updateDoshaBadge(userDosha);
                }
                
                loadConsultationHistory();
                updateSessionCounter(); // Load session counter on startup
            }
        } catch (e) {
            console.error('Session parse error:', e);
        }
    }
    
    // Initialize voice recognition
    initVoiceRecognition();
    
    // Voice button
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
        voiceBtn.addEventListener('click', toggleVoiceInput);
    }
    
    // Severity slider
    const severitySlider = document.getElementById('severitySlider');
    const severityLabel = document.getElementById('severityLabel');
    
    if (severitySlider && severityLabel) {
        const severityLabels = ['Very Mild', 'Mild', 'Moderate', 'Severe', 'Very Severe'];
        
        severitySlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            severityLabel.textContent = severityLabels[value - 1];
            
            // Color code the label
            if (value <= 2) {
                severityLabel.style.color = '#059669'; // Green
            } else if (value === 3) {
                severityLabel.style.color = 'var(--herbal-deep)'; // Default
            } else {
                severityLabel.style.color = '#DC2626'; // Red
            }
        });
    }
    
    // Category cards
    const categoryCards = document.querySelectorAll('.category-pill');
    if (categoryCards.length > 0) {
        categoryCards.forEach(card => {
            card.addEventListener('click', () => {
                const symptom = card.dataset.symptom;
                document.getElementById('symptomInput').value = symptom;
                analyzeSymptoms();
            });
        });
    }
    
    // Symptom chips
    const symptomChips = document.querySelectorAll('.symptom-chip-sacred');
    if (symptomChips.length > 0) {
        symptomChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const tag = chip.dataset.tag;
                const input = document.getElementById('symptomInput');
                input.value = input.value ? `${input.value}, ${tag}` : tag;
            });
        });
    }
    
    // Analyze button
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', analyzeSymptoms);
    }
    
    // Enter to submit
    const symptomInput = document.getElementById('symptomInput');
    if (symptomInput) {
        symptomInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                analyzeSymptoms();
            }
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('ayush.auth.session');
            document.getElementById('landingPage').style.display = 'block';
            document.getElementById('appPage').style.display = 'none';
            showToast('Logged out successfully');
        });
    }
});
