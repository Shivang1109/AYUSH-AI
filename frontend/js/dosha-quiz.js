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
            // Get user ID from session
            const session = localStorage.getItem('ayush.auth.session');
            let userId = 'guest-' + Date.now();
            if (session) {
                try {
                    const sessionData = JSON.parse(session);
                    userId = sessionData.user.id;
                } catch (e) {
                    console.error('Session parse error:', e);
                }
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}/api/dosha/assess`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': userId
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
            
            // Fallback: Calculate dosha locally if API fails
            const localResult = this.calculateDoshaLocally();
            this.showResults(localResult);
        }
    }

    calculateDoshaLocally() {
        // Count dosha answers
        const counts = { vata: 0, pitta: 0, kapha: 0 };
        this.answers.forEach(answer => {
            if (answer.answer) {
                counts[answer.answer.toLowerCase()]++;
            }
        });

        // Calculate percentages
        const total = this.answers.length;
        const percentages = {
            vata: Math.round((counts.vata / total) * 100),
            pitta: Math.round((counts.pitta / total) * 100),
            kapha: Math.round((counts.kapha / total) * 100)
        };

        // Find primary and secondary
        const sorted = Object.entries(percentages).sort((a, b) => b[1] - a[1]);
        const primary = sorted[0][0].charAt(0).toUpperCase() + sorted[0][0].slice(1);
        const secondary = sorted[1][0].charAt(0).toUpperCase() + sorted[1][0].slice(1);

        return {
            primary: primary,
            primary_percentage: sorted[0][1],
            secondary: secondary,
            secondary_percentage: sorted[1][1],
            description: this.getDoshaDescription(primary),
            characteristics: this.getDoshaCharacteristics(primary),
            recommendations: this.getDoshaRecommendations(primary)
        };
    }

    getDoshaDescription(dosha) {
        const descriptions = {
            'Vata': 'Vata is the energy of movement, composed of air and space. People with dominant Vata tend to be creative, energetic, and quick-thinking.',
            'Pitta': 'Pitta is the energy of transformation, composed of fire and water. People with dominant Pitta tend to be intelligent, focused, and goal-oriented.',
            'Kapha': 'Kapha is the energy of structure, composed of earth and water. People with dominant Kapha tend to be calm, stable, and nurturing.'
        };
        return descriptions[dosha] || '';
    }

    getDoshaCharacteristics(dosha) {
        const characteristics = {
            'Vata': [
                'Light, thin build',
                'Quick mind and creativity',
                'Variable energy levels',
                'Tendency toward dry skin',
                'Light, interrupted sleep'
            ],
            'Pitta': [
                'Medium build and strength',
                'Sharp intellect and focus',
                'Strong digestion',
                'Warm body temperature',
                'Moderate, sound sleep'
            ],
            'Kapha': [
                'Solid, heavier build',
                'Calm and steady nature',
                'Strong endurance',
                'Smooth, moist skin',
                'Deep, long sleep'
            ]
        };
        return characteristics[dosha] || [];
    }

    getDoshaRecommendations(dosha) {
        const recommendations = {
            'Vata': [
                'Maintain regular routines',
                'Eat warm, cooked foods',
                'Practice grounding activities',
                'Get adequate rest',
                'Stay warm and avoid cold'
            ],
            'Pitta': [
                'Avoid excessive heat',
                'Eat cooling foods',
                'Practice moderation',
                'Manage stress effectively',
                'Stay cool and calm'
            ],
            'Kapha': [
                'Stay active and exercise',
                'Eat light, warm foods',
                'Avoid oversleeping',
                'Seek variety and stimulation',
                'Stay warm and dry'
            ]
        };
        return recommendations[dosha] || [];
    }

    showResults(result) {
        const body = document.getElementById('doshaQuizBody');
        
        // Save dosha to localStorage
        localStorage.setItem('ayush.user.dosha', result.primary);
        localStorage.setItem('ayush.user.dosha.full', JSON.stringify(result));
        
        // Update badge in header if function exists
        if (typeof updateDoshaBadge === 'function') {
            updateDoshaBadge(result.primary);
        }
        
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
                
                <div style="background: linear-gradient(135deg, #E8F5E9, #C8E6C9); padding: 1rem; border-radius: 12px; margin: 1.5rem 0; text-align: center;">
                    <p style="margin: 0; color: #2E7D32; font-weight: 600;">✨ Your dosha will now personalize all remedy recommendations!</p>
                </div>

                <div class="dosha-actions">
                    <button class="dosha-done-btn" onclick="doshaQuiz.close();">
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
