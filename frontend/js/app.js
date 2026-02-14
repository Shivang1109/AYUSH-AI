// State Management
let currentLanguage = 'en';
let currentUserId = null;

// DOM Elements
const symptomsInput = document.getElementById('symptoms');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsSection = document.getElementById('results');
const errorMessage = document.getElementById('errorMessage');
const langButtons = document.querySelectorAll('.lang-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkAPIHealth();
});

// Setup Event Listeners
function setupEventListeners() {
    // Analyze button
    analyzeBtn.addEventListener('click', analyzeSymptoms);
    
    // Enter key in textarea
    symptomsInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            analyzeSymptoms();
        }
    });
    
    // Language toggle
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            langButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLanguage = btn.dataset.lang;
            updatePlaceholder();
        });
    });
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href').substring(1);
            navigateTo(target);
        });
    });
}

// Update placeholder based on language
function updatePlaceholder() {
    if (currentLanguage === 'hi') {
        symptomsInput.placeholder = 'उदाहरण: मुझे सिरदर्द है, थकान महसूस हो रही है, और हल्का बुखार है...';
    } else {
        symptomsInput.placeholder = 'E.g., I have a headache, feeling tired, and have a mild fever...';
    }
}

// Check API Health
async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`);
        if (response.ok) {
            console.log('✅ API is healthy');
        }
    } catch (error) {
        console.warn('⚠️ API health check failed:', error);
        showError('Unable to connect to the server. Please try again later.');
    }
}

// Analyze Symptoms
async function analyzeSymptoms() {
    const symptoms = symptomsInput.value.trim();
    
    // Validation
    if (!symptoms) {
        showError('Please describe your symptoms');
        return;
    }
    
    if (symptoms.length < 10) {
        showError('Please provide more details about your symptoms');
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    hideError();
    hideResults();
    
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ANALYZE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                symptoms: symptoms,
                language: currentLanguage,
                user_id: currentUserId
            })
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        displayResults(data);
        
    } catch (error) {
        console.error('Error analyzing symptoms:', error);
        showError('Failed to analyze symptoms. Please try again.');
    } finally {
        setLoadingState(false);
    }
}

// Display Results
function displayResults(data) {
    // Condition
    document.getElementById('conditionName').textContent = data.condition;
    
    // Severity badge
    const severityBadge = document.getElementById('severityBadge');
    severityBadge.textContent = data.severity || 'moderate';
    severityBadge.className = `severity-badge severity-${data.severity || 'moderate'}`;
    
    // Explanation
    document.getElementById('explanation').textContent = data.explanation;
    
    // Recommendations
    const recommendationsList = document.getElementById('recommendationsList');
    recommendationsList.innerHTML = '';
    
    data.recommendations.forEach(rec => {
        const card = createRecommendationCard(rec);
        recommendationsList.appendChild(card);
    });
    
    // Safety Warnings
    const warningsList = document.getElementById('warningsList');
    warningsList.innerHTML = '';
    
    if (data.safety_warnings && data.safety_warnings.length > 0) {
        data.safety_warnings.forEach(warning => {
            const li = document.createElement('li');
            li.textContent = warning;
            warningsList.appendChild(li);
        });
    }
    
    // Disclaimer
    document.getElementById('disclaimerText').textContent = data.disclaimer;
    
    // Show results
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Create Recommendation Card
function createRecommendationCard(rec) {
    const card = document.createElement('div');
    card.className = 'recommendation-card';
    
    const icon = getTreatmentIcon(rec.treatment_type);
    
    card.innerHTML = `
        <div class="rec-header">
            <span class="rec-icon">${icon}</span>
            <h4 class="rec-type">${rec.treatment_type}</h4>
        </div>
        <div class="rec-body">
            <div class="rec-item">
                <strong>Remedy:</strong> ${rec.remedy}
            </div>
            <div class="rec-item">
                <strong>Dosage:</strong> ${rec.dosage}
            </div>
            <div class="rec-item">
                <strong>Duration:</strong> ${rec.duration}
            </div>
            ${rec.precautions && rec.precautions.length > 0 ? `
                <div class="rec-precautions">
                    <strong>Precautions:</strong>
                    <ul>
                        ${rec.precautions.map(p => `<li>${p}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
    
    return card;
}

// Get Treatment Icon
function getTreatmentIcon(type) {
    const icons = {
        'Ayurveda': '🌱',
        'Yoga': '🧘',
        'Unani': '🌿',
        'Siddha': '💊',
        'Homeopathy': '⚗️'
    };
    return icons[type] || '💚';
}

// Loading State
function setLoadingState(isLoading) {
    const btnText = analyzeBtn.querySelector('.btn-text');
    const btnLoader = analyzeBtn.querySelector('.btn-loader');
    
    if (isLoading) {
        btnText.style.display = 'none';
        btnLoader.style.display = 'flex';
        analyzeBtn.disabled = true;
        symptomsInput.disabled = true;
    } else {
        btnText.style.display = 'block';
        btnLoader.style.display = 'none';
        analyzeBtn.disabled = false;
        symptomsInput.disabled = false;
    }
}

// Show Error
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        hideError();
    }, 5000);
}

// Hide Error
function hideError() {
    errorMessage.style.display = 'none';
}

// Hide Results
function hideResults() {
    resultsSection.style.display = 'none';
}

// Navigation
function navigateTo(section) {
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${section}`) {
            link.classList.add('active');
        }
    });
    
    // Show/hide sections
    if (section === 'home') {
        document.querySelector('.hero').style.display = 'block';
        document.querySelector('.app-section').style.display = 'block';
        document.querySelector('.about-section').style.display = 'none';
        document.querySelector('.history-section').style.display = 'none';
    } else if (section === 'about') {
        document.querySelector('.hero').style.display = 'none';
        document.querySelector('.app-section').style.display = 'none';
        document.querySelector('.about-section').style.display = 'block';
        document.querySelector('.history-section').style.display = 'none';
    } else if (section === 'history') {
        document.querySelector('.hero').style.display = 'none';
        document.querySelector('.app-section').style.display = 'none';
        document.querySelector('.about-section').style.display = 'none';
        document.querySelector('.history-section').style.display = 'block';
    }
}
