// Dosha Assessment Quiz Module

const DOSHA_QUESTIONS = [
    {
        id: 1,
        question: "Do you feel cold easily?",
        options: [
            { text: "Yes, often - I'm always cold", value: "vata" },
            { text: "Sometimes - Moderate sensitivity", value: "pitta" },
            { text: "Rarely - I stay warm easily", value: "kapha" }
        ]
    },
    {
        id: 2,
        question: "How is your skin?",
        options: [
            { text: "Dry and rough", value: "vata" },
            { text: "Warm and oily, prone to rashes", value: "pitta" },
            { text: "Smooth and moist", value: "kapha" }
        ]
    },
    {
        id: 3,
        question: "Your energy levels are:",
        options: [
            { text: "Variable, comes in bursts", value: "vata" },
            { text: "Moderate, steady throughout day", value: "pitta" },
            { text: "High and consistent", value: "kapha" }
        ]
    },
    {
        id: 4,
        question: "Your digestion is:",
        options: [
            { text: "Irregular, gas and bloating", value: "vata" },
            { text: "Strong and quick", value: "pitta" },
            { text: "Slow and heavy", value: "kapha" }
        ]
    },
    {
        id: 5,
        question: "Your sleep pattern:",
        options: [
            { text: "Light, interrupted easily", value: "vata" },
            { text: "Moderate, sound sleep", value: "pitta" },
            { text: "Deep and long", value: "kapha" }
        ]
    },
    {
        id: 6,
        question: "Your body frame is:",
        options: [
            { text: "Thin, light, hard to gain weight", value: "vata" },
            { text: "Medium build, athletic", value: "pitta" },
            { text: "Large, solid, easy to gain weight", value: "kapha" }
        ]
    },
    {
        id: 7,
        question: "Your mental state:",
        options: [
            { text: "Quick mind, anxious, creative", value: "vata" },
            { text: "Sharp intellect, focused, intense", value: "pitta" },
            { text: "Calm, steady, slow to anger", value: "kapha" }
        ]
    },
    {
        id: 8,
        question: "Your appetite is:",
        options: [
            { text: "Variable, sometimes forget to eat", value: "vata" },
            { text: "Strong, get irritable when hungry", value: "pitta" },
            { text: "Steady, can skip meals easily", value: "kapha" }
        ]
    }
];

class DoshaQuiz {
    constructor() {
        this.currentQuestion = 0;
        this.answers = [];
        this.modal = null;
    }

    open() {
        this.currentQuestion = 0;
        this.answers = [];
        this.createModal();
        this.renderQuestion();
    }

    createModal() {
        // Remove existing modal if any
        const existing = document.getElementById('doshaQuizModal');
        if (existing) existing.remove();

        // Create modal
        this.modal = document.createElement('div');
        this.modal.id = 'doshaQuizModal';
        this.modal.className = 'dosha-modal';
        this.modal.innerHTML = `
            <div class="dosha-modal-overlay" onclick="doshaQuiz.close()"></div>
            <div class="dosha-modal-content">
                <div class="dosha-modal-header">
                    <h2>Discover Your Dosha</h2>
                    <p class="dosha-subtitle">Answer these questions to understand your Ayurvedic constitution</p>
                    <button class="dosha-close-btn" onclick="doshaQuiz.close()">✕</button>
                </div>
                <div class="dosha-progress">
                    <div class="dosha-progress-bar" id="doshaProgressBar"></div>
                    <span class="dosha-progress-text" id="doshaProgressText">Question 1 of ${DOSHA_QUESTIONS.length}</span>
                </div>
                <div class="dosha-modal-body" id="doshaQuizBody">
                    <!-- Questions will be rendered here -->
                </div>
            </div>
        `;
        document.body.appendChild(this.modal);
        
        // Animate in
        setTimeout(() => this.modal.classList.add('active'), 10);
    }

    renderQuestion() {
        const question = DOSHA_QUESTIONS[this.currentQuestion];
        const body = document.getElementById('doshaQuizBody');
        
        body.innerHTML = `
            <div class="dosha-question-container">
                <h3 class="dosha-question">${question.question}</h3>
                <div class="dosha-options">
                    ${question.options.map((option, index) => `
                        <button class="dosha-option" onclick="doshaQuiz.selectAnswer('${option.value}')">
                            <span class="dosha-option-letter">${String.fromCharCode(65 + index)}</span>
                            <span class="dosha-option-text">${option.text}</span>
                        </button>
                    `).join('')}
                </div>
                ${this.currentQuestion > 0 ? `
                    <button class="dosha-back-btn" onclick="doshaQuiz.previousQuestion()">
                        ← Previous Question
                    </button>
                ` : ''}
            </div>
        `;

        // Update progress
        const progress = ((this.currentQuestion + 1) / DOSHA_QUESTIONS.length) * 100;
        document.getElementById('doshaProgressBar').style.width = `${progress}%`;
        document.getElementById('doshaProgressText').textContent = 
            `Question ${this.currentQuestion + 1} of ${DOSHA_QUESTIONS.length}`;
    }

    selectAnswer(value) {
        // Save answer
        this.answers[this.currentQuestion] = {
            question_id: DOSHA_QUESTIONS[this.currentQuestion].id,
            answer: value
        };

        // Move to next question or submit
        if (this.currentQuestion < DOSHA_QUESTIONS.length - 1) {
            this.currentQuestion++;
            this.renderQuestion();
        } else {
            this.submitQuiz();
        }
    }

    previousQuestion() {
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            this.renderQuestion();
        }
    }

    async submitQuiz() {
        const body = document.getElementById('doshaQuizBody');
        body.innerHTML = `
            <div class="dosha-loading">
                <div class="loading-spinner"></div>
                <p>Analyzing your constitution...</p>
            </div>
        `;

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/dosha/assess`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': authManager.getUserId()
                },
                body: JSON.stringify({ answers: this.answers })
            });

            if (!response.ok) {
                throw new Error('Failed to assess dosha');
            }

            const result = await response.json();
            this.showResults(result);

        } catch (error) {
            console.error('Dosha assessment error:', error);
            body.innerHTML = `
                <div class="dosha-error">
                    <p>Sorry, we couldn't complete the assessment. Please try again.</p>
                    <button class="dosha-retry-btn" onclick="doshaQuiz.open()">Retry</button>
                </div>
            `;
        }
    }

    showResults(result) {
        const body = document.getElementById('doshaQuizBody');
        
        const doshaIcons = {
            'Vata': '💨',
            'Pitta': '🔥',
            'Kapha': '🌊'
        };

        const doshaColors = {
            'Vata': '#9333EA',
            'Pitta': '#DC2626',
            'Kapha': '#059669'
        };

        body.innerHTML = `
            <div class="dosha-results">
                <div class="dosha-result-header">
                    <div class="dosha-icon-large" style="background: ${doshaColors[result.primary]}">
                        ${doshaIcons[result.primary]}
                    </div>
                    <h3>Your Primary Dosha</h3>
                    <h2 class="dosha-result-name" style="color: ${doshaColors[result.primary]}">${result.primary}</h2>
                    <p class="dosha-percentage">${result.primary_percentage}%</p>
                    ${result.secondary ? `
                        <p class="dosha-secondary">Secondary: ${result.secondary} (${result.secondary_percentage}%)</p>
                    ` : ''}
                </div>

                <div class="dosha-description">
                    <h4>About Your Dosha</h4>
                    <p>${result.description}</p>
                </div>

                <div class="dosha-characteristics">
                    <h4>Your Characteristics</h4>
                    <ul>
                        ${result.characteristics.map(char => `<li>${char}</li>`).join('')}
                    </ul>
                </div>

                <div class="dosha-recommendations">
                    <h4>Recommendations for Balance</h4>
                    <ul>
                        ${result.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>

                <div class="dosha-actions">
                    <button class="dosha-done-btn" onclick="doshaQuiz.close(); location.reload();">
                        Done
                    </button>
                    <button class="dosha-retake-btn" onclick="doshaQuiz.open()">
                        Retake Quiz
                    </button>
                </div>
            </div>
        `;
    }

    close() {
        if (this.modal) {
            this.modal.classList.remove('active');
            setTimeout(() => this.modal.remove(), 300);
        }
    }
}

// Create global instance
const doshaQuiz = new DoshaQuiz();

// Export for use in other files
window.doshaQuiz = doshaQuiz;
