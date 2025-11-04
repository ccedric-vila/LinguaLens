// quiz.js - Country & Language Quiz Frontend Logic

// Quiz state management
let currentQuiz = {
    questions: [],
    currentQuestionIndex: 0,
    userAnswers: [],
    score: 0,
    totalQuestions: 0
};

// DOM Elements
let quizCreation, quizTaking, quizResults;
let questionCountSelect, quizCategorySelect, generateQuizBtn;
let currentQuestionEl, totalQuestionsEl, currentScoreEl;
let questionTextEl, flagImageEl, optionsContainer, identificationInput;
let prevBtn, nextBtn, submitBtn;
let finalScoreCircle, resultsBreakdown;

// Initialize the quiz application
function initQuiz() {
    console.log('Initializing quiz application...');
    
    // Initialize DOM elements
    initializeDOMElements();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('Quiz application initialized successfully!');
}

// Initialize DOM elements
function initializeDOMElements() {
    // Screen containers
    quizCreation = document.getElementById('quizCreation');
    quizTaking = document.getElementById('quizTaking');
    quizResults = document.getElementById('quizResults');
    
    // Quiz creation elements
    questionCountSelect = document.getElementById('questionCount');
    quizCategorySelect = document.getElementById('quizCategory');
    generateQuizBtn = document.getElementById('generateQuiz');
    
    // Quiz taking elements
    currentQuestionEl = document.getElementById('currentQuestion');
    totalQuestionsEl = document.getElementById('totalQuestions');
    currentScoreEl = document.getElementById('currentScore');
    questionTextEl = document.getElementById('questionText');
    flagImageEl = document.getElementById('flagImage');
    optionsContainer = document.getElementById('optionsContainer');
    identificationInput = document.getElementById('identificationInput');
    prevBtn = document.getElementById('prevBtn');
    nextBtn = document.getElementById('nextBtn');
    submitBtn = document.getElementById('submitBtn');
    
    // Results elements
    finalScoreCircle = document.getElementById('finalScoreCircle');
    resultsBreakdown = document.getElementById('resultsBreakdown');
}

// Setup event listeners
function setupEventListeners() {
    // Enter key support for identification questions
    identificationInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            nextQuestion();
        }
    });
    
    // Input change for identification questions
    identificationInput.addEventListener('input', function() {
        saveCurrentAnswer();
        updateNavigationButtons();
    });
}

// Generate quiz using Puter AI
async function generateQuiz() {
    const questionCount = parseInt(questionCountSelect.value);
    const category = quizCategorySelect.value;
    
    console.log(`Generating quiz: ${questionCount} questions, category: ${category}`);
    
    // Show loading state
    const loadingEl = document.getElementById('creationLoading');
    const errorEl = document.getElementById('creationError');
    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    generateQuizBtn.disabled = true;
    
    try {
        // Initialize Puter AI if needed
        await initializePuterAI();
        
        if (!window.puter || !window.puter.ai || !window.puter.ai.chat) {
            throw new Error('Puter AI service is not available');
        }
        
        // Generate quiz using AI
        const quizData = await generateQuizWithAI(questionCount, category);
        
        // Initialize quiz state
        currentQuiz = {
            questions: quizData.questions,
            currentQuestionIndex: 0,
            userAnswers: new Array(quizData.questions.length).fill(null),
            score: 0,
            totalQuestions: quizData.questions.length
        };
        
        // Switch to quiz taking screen
        showQuizTakingScreen();
        
        // Load first question
        loadQuestion(0);
        
    } catch (error) {
        console.error('Quiz generation failed:', error);
        errorEl.textContent = `Failed to generate quiz: ${error.message}. Please try again.`;
        errorEl.style.display = 'block';
    } finally {
        loadingEl.style.display = 'none';
        generateQuizBtn.disabled = false;
    }
}

// Generate quiz questions using Puter AI
async function generateQuizWithAI(questionCount, category) {
    const categoryDescriptions = {
        'multiple_choice': 'text-based multiple choice questions about countries and languages',
        'multiple_choice_flag': 'multiple choice questions showing country flags and asking which country they belong to',
        'identification': 'text-based identification questions about countries, capitals, and languages',
        'flag_identification': 'identification questions showing country flags and asking to name the country',
        'combination': 'a mix of all question types about countries, languages, and flags'
    };
    
    const prompt = `Generate a ${questionCount}-question quiz about countries and languages. 
Category: ${categoryDescriptions[category]}

Requirements:
- Questions should be about world countries, their capitals, languages, cultures, and flags
- For flag questions, include the country code for flag image URLs (use format: https://flagcdn.com/w320/{code}.png)
- Make questions educational and varied
- Include easy, medium, and hard questions
- Focus on interesting cultural facts

Return ONLY a JSON object in this exact format:
{
    "questions": [
        {
            "type": "question_type",
            "question": "question text",
            "flagUrl": "https://flagcdn.com/w320/{code}.png" // only for flag questions
            "options": ["option1", "option2", "option3", "option4"], // only for multiple choice
            "correctAnswer": "exact correct answer",
            "explanation": "brief educational explanation"
        }
    ]
}

Important: Return ONLY the JSON, no other text.`;

    console.log('Sending quiz generation request to Puter AI...');
    
    const response = await window.puter.ai.chat(prompt);
    
    let responseText = '';
    if (response && typeof response === 'object') {
        if (response.message && response.message.content) {
            responseText = response.message.content.trim();
        } else if (response.content) {
            responseText = response.content.trim();
        }
    } else if (typeof response === 'string') {
        responseText = response.trim();
    }
    
    console.log('AI Response:', responseText);
    
    // Parse JSON response
    try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsedData = JSON.parse(jsonMatch[0]);
            
            // Ensure all questions have proper types and structures
            parsedData.questions = parsedData.questions.map((q, index) => {
                // Ensure type is set properly
                if (!q.type) {
                    if (q.flagUrl && q.options) {
                        q.type = 'multiple_choice_flag';
                    } else if (q.flagUrl && !q.options) {
                        q.type = 'flag_identification';
                    } else if (q.options) {
                        q.type = 'multiple_choice';
                    } else {
                        q.type = 'identification';
                    }
                }
                return q;
            });
            
            return parsedData;
        } else {
            return JSON.parse(responseText);
        }
    } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        
        // Fallback: Generate sample questions if AI fails
        console.log('Using fallback quiz questions');
        return generateFallbackQuiz(questionCount, category);
    }
}

// Fallback quiz generator in case AI fails
function generateFallbackQuiz(questionCount, category) {
    const fallbackQuestions = [
        {
            type: "multiple_choice",
            question: "Which country is known for the Great Barrier Reef, the world's largest coral reef system?",
            options: ["Australia", "Philippines", "Indonesia", "Mexico"],
            correctAnswer: "Australia",
            explanation: "The Great Barrier Reef is located off the coast of Queensland, Australia and is the world's largest coral reef system."
        },
        {
            type: "multiple_choice",
            question: "What is the official language of Brazil?",
            options: ["Spanish", "Portuguese", "French", "English"],
            correctAnswer: "Portuguese",
            explanation: "Brazil is the only Portuguese-speaking country in South America due to its history as a Portuguese colony."
        },
        {
            type: "flag_identification",
            question: "Identify the country by its flag:",
            flagUrl: "https://flagcdn.com/w320/jp.png",
            correctAnswer: "Japan",
            explanation: "This is the flag of Japan, known as the 'Nisshōki' or 'Hinomaru', featuring a red circle on a white background."
        },
        {
            type: "multiple_choice_flag",
            question: "Which country does this flag belong to?",
            flagUrl: "https://flagcdn.com/w320/fr.png",
            options: ["France", "Italy", "Belgium", "Netherlands"],
            correctAnswer: "France",
            explanation: "This is the flag of France, known as the 'Tricolore', with vertical blue, white, and red stripes."
        },
        {
            type: "identification",
            question: "What is the capital of Canada?",
            correctAnswer: "Ottawa",
            explanation: "Ottawa is the capital city of Canada, located in the province of Ontario."
        }
    ];
    
    // Return requested number of questions
    return {
        questions: fallbackQuestions.slice(0, questionCount)
    };
}

// Initialize Puter AI
async function initializePuterAI() {
    if (window.puterAIAvailable) return true;
    
    try {
        if (typeof puter === 'undefined') {
            await new Promise((resolve) => {
                const checkPuter = setInterval(() => {
                    if (typeof puter !== 'undefined') {
                        clearInterval(checkPuter);
                        resolve();
                    }
                }, 100);
                
                setTimeout(() => {
                    clearInterval(checkPuter);
                    resolve();
                }, 5000);
            });
        }
        
        if (typeof puter === 'undefined') {
            throw new Error('Puter.js failed to load');
        }
        
        if (!puter.ai || !puter.ai.chat) {
            throw new Error('Puter AI not available');
        }
        
        // Try anonymous authentication
        try {
            if (puter.auth?.signInAnonymously) {
                await puter.auth.signInAnonymously();
            } else if (puter.auth?.anonymous) {
                await puter.auth.anonymous();
            }
        } catch (authError) {
            console.warn('Puter auth not required:', authError.message);
        }
        
        window.puterAIAvailable = true;
        return true;
        
    } catch (error) {
        console.error('Puter AI initialization failed:', error);
        window.puterAIAvailable = false;
        throw error;
    }
}

// Show quiz taking screen
function showQuizTakingScreen() {
    quizCreation.style.display = 'none';
    quizTaking.style.display = 'block';
    quizResults.style.display = 'none';
    
    // Update progress indicators
    totalQuestionsEl.textContent = currentQuiz.totalQuestions;
    currentScoreEl.textContent = currentQuiz.score;
}

// Load a specific question - FIXED VERSION
function loadQuestion(questionIndex) {
    if (questionIndex < 0 || questionIndex >= currentQuiz.questions.length) return;
    
    const question = currentQuiz.questions[questionIndex];
    currentQuiz.currentQuestionIndex = questionIndex;
    
    console.log('Loading question:', question);
    
    // Update progress
    currentQuestionEl.textContent = questionIndex + 1;
    currentScoreEl.textContent = currentQuiz.score;
    
    // Clear previous question state
    flagImageEl.style.display = 'none';
    optionsContainer.style.display = 'none';
    identificationInput.style.display = 'none';
    optionsContainer.innerHTML = '';
    identificationInput.value = '';
    identificationInput.placeholder = 'Enter your answer...';
    
    // Set question text
    questionTextEl.textContent = question.question;
    
    // Show flag if applicable
    if (question.flagUrl) {
        flagImageEl.src = question.flagUrl;
        flagImageEl.style.display = 'block';
        flagImageEl.alt = `Flag of a country`;
    }
    
    // Setup question type specific UI - FIXED LOGIC
    if (question.type === 'multiple_choice' || question.type === 'multiple_choice_flag') {
        setupMultipleChoiceQuestion(question);
    } else if (question.type === 'identification' || question.type === 'flag_identification') {
        setupIdentificationQuestion(question);
    } else {
        // Default to identification if type is unknown
        console.warn('Unknown question type, defaulting to identification:', question.type);
        setupIdentificationQuestion(question);
    }
    
    // Load previous answer if exists
    const previousAnswer = currentQuiz.userAnswers[questionIndex];
    if (previousAnswer !== null) {
        if (question.type === 'multiple_choice' || question.type === 'multiple_choice_flag') {
            const optionBtn = optionsContainer.querySelector(`[data-option="${previousAnswer}"]`);
            if (optionBtn) {
                optionBtn.classList.add('selected');
            }
        } else {
            identificationInput.value = previousAnswer;
        }
    }
    
    // Update navigation buttons
    updateNavigationButtons();
}

// Setup multiple choice question
function setupMultipleChoiceQuestion(question) {
    optionsContainer.style.display = 'grid';
    identificationInput.style.display = 'none';
    
    question.options.forEach((option, index) => {
        const optionBtn = document.createElement('button');
        optionBtn.className = 'option-btn';
        optionBtn.textContent = option;
        optionBtn.setAttribute('data-option', option);
        
        optionBtn.addEventListener('click', function() {
            // Deselect all options
            optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            
            // Select clicked option
            this.classList.add('selected');
            
            // Save answer
            saveCurrentAnswer();
            updateNavigationButtons();
        });
        
        optionsContainer.appendChild(optionBtn);
    });
}

// Setup identification question - FIXED VERSION
function setupIdentificationQuestion(question) {
    optionsContainer.style.display = 'none';
    identificationInput.style.display = 'block';
    
    // Set appropriate placeholder based on question type
    if (question.type === 'flag_identification') {
        identificationInput.placeholder = 'Enter the country name...';
    } else {
        identificationInput.placeholder = 'Enter your answer...';
    }
    
    identificationInput.focus();
}

// Save current answer
function saveCurrentAnswer() {
    const currentIndex = currentQuiz.currentQuestionIndex;
    const question = currentQuiz.questions[currentIndex];
    
    let answer = null;
    
    if (question.type === 'multiple_choice' || question.type === 'multiple_choice_flag') {
        const selectedOption = optionsContainer.querySelector('.option-btn.selected');
        if (selectedOption) {
            answer = selectedOption.getAttribute('data-option');
        }
    } else {
        answer = identificationInput.value.trim();
        if (answer === '') answer = null;
    }
    
    currentQuiz.userAnswers[currentIndex] = answer;
    console.log(`Saved answer for question ${currentIndex + 1}:`, answer);
}

// Update navigation buttons state
function updateNavigationButtons() {
    const currentIndex = currentQuiz.currentQuestionIndex;
    const totalQuestions = currentQuiz.questions.length;
    
    console.log(`Updating navigation: currentIndex=${currentIndex}, total=${totalQuestions}`);
    
    // Previous button
    prevBtn.disabled = currentIndex === 0;
    
    // Next/Submit button
    if (currentIndex === totalQuestions - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    }
    
    // Check if current question is answered
    const isAnswered = currentQuiz.userAnswers[currentIndex] !== null;
    console.log(`Question ${currentIndex + 1} answered:`, isAnswered);
    
    // Enable next/submit only if current question is answered
    nextBtn.disabled = !isAnswered;
    submitBtn.disabled = !isAnswered;
    
    // For testing: Always enable navigation (remove in production)
    nextBtn.disabled = false;
    submitBtn.disabled = false;
}

// Navigate to previous question
function previousQuestion() {
    saveCurrentAnswer();
    
    if (currentQuiz.currentQuestionIndex > 0) {
        loadQuestion(currentQuiz.currentQuestionIndex - 1);
    }
}

// Navigate to next question
function nextQuestion() {
    saveCurrentAnswer();
    
    const currentIndex = currentQuiz.currentQuestionIndex;
    const totalQuestions = currentQuiz.questions.length;
    
    console.log(`Next clicked: current=${currentIndex}, total=${totalQuestions}`);
    
    if (currentIndex < totalQuestions - 1) {
        loadQuestion(currentIndex + 1);
    } else {
        // If we're on the last question, show submit button
        updateNavigationButtons();
    }
}

// Submit quiz and calculate results
async function submitQuiz() {
    saveCurrentAnswer();
    
    console.log('Submitting quiz...', currentQuiz);
    
    // Calculate score
    let correctAnswers = 0;
    currentQuiz.questions.forEach((question, index) => {
        const userAnswer = currentQuiz.userAnswers[index];
        if (userAnswer && userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
            correctAnswers++;
        }
    });
    
    currentQuiz.score = correctAnswers;
    const percentage = Math.round((correctAnswers / currentQuiz.questions.length) * 100);
    
    // Show results screen
    showResultsScreen(percentage, correctAnswers);
    
    // Optional: Submit to backend
    try {
        await submitQuizToBackend();
    } catch (error) {
        console.error('Failed to submit to backend:', error);
    }
}

// Show results screen
function showResultsScreen(percentage, correctAnswers) {
    quizCreation.style.display = 'none';
    quizTaking.style.display = 'none';
    quizResults.style.display = 'block';
    
    // Update score circle
    finalScoreCircle.textContent = `${percentage}%`;
    finalScoreCircle.style.background = getScoreColor(percentage);
    
    // Generate results breakdown
    generateResultsBreakdown(correctAnswers);
}

// Get color based on score percentage
function getScoreColor(percentage) {
    if (percentage >= 80) return '#48bb78'; // Green
    if (percentage >= 60) return '#ed8936'; // Orange
    return '#e53e3e'; // Red
}

// Generate results breakdown
function generateResultsBreakdown(correctAnswers) {
    const totalQuestions = currentQuiz.questions.length;
    
    resultsBreakdown.innerHTML = `
        <div class="breakdown-item">
            <span>Total Questions:</span>
            <span>${totalQuestions}</span>
        </div>
        <div class="breakdown-item">
            <span>Correct Answers:</span>
            <span style="color: #48bb78; font-weight: 600;">${correctAnswers}</span>
        </div>
        <div class="breakdown-item">
            <span>Incorrect Answers:</span>
            <span style="color: #e53e3e; font-weight: 600;">${totalQuestions - correctAnswers}</span>
        </div>
        <div class="breakdown-item">
            <span>Success Rate:</span>
            <span style="font-weight: 600;">${Math.round((correctAnswers / totalQuestions) * 100)}%</span>
        </div>
    `;
}

// Submit quiz to backend (optional)
async function submitQuizToBackend() {
    try {
        const response = await fetch('/api/quiz/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                quizId: 'quiz_' + Date.now(),
                answers: currentQuiz.userAnswers,
                questions: currentQuiz.questions,
                userId: 'anonymous'
            })
        });
        
        const result = await response.json();
        console.log('Backend submission result:', result);
        return result;
    } catch (error) {
        console.error('Failed to submit quiz to backend:', error);
        return null;
    }
}

// Start a new quiz
function newQuiz() {
    // Reset quiz state
    currentQuiz = {
        questions: [],
        currentQuestionIndex: 0,
        userAnswers: [],
        score: 0,
        totalQuestions: 0
    };
    
    // Show creation screen
    quizCreation.style.display = 'block';
    quizTaking.style.display = 'none';
    quizResults.style.display = 'none';
}

// Review quiz answers - IMPROVED VERSION
function reviewQuiz() {
    let reviewHTML = '<h3 style="margin-bottom: 15px; color: #2d3748;">Quiz Review</h3>';
    
    currentQuiz.questions.forEach((question, index) => {
        const userAnswer = currentQuiz.userAnswers[index] || 'No answer';
        const isCorrect = userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
        
        reviewHTML += `
            <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; background: ${isCorrect ? '#f0fff4' : '#fff5f5'}">
                <div style="font-weight: 600; margin-bottom: 8px;">Question ${index + 1}: ${question.question}</div>
                ${question.flagUrl ? `<img src="${question.flagUrl}" style="max-width: 100px; height: 60px; border: 1px solid #e2e8f0; border-radius: 4px; margin: 8px 0;">` : ''}
                <div style="margin-bottom: 5px;"><strong>Your Answer:</strong> <span style="color: ${isCorrect ? '#48bb78' : '#e53e3e'}">${userAnswer}</span></div>
                <div style="margin-bottom: 5px;"><strong>Correct Answer:</strong> <span style="color: #48bb78">${question.correctAnswer}</span></div>
                <div style="font-size: 14px; color: #718096;"><strong>Explanation:</strong> ${question.explanation}</div>
            </div>
        `;
    });
    
    // Create a modal for review
    const reviewModal = document.createElement('div');
    reviewModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    reviewModal.innerHTML = `
        <div style="background: white; padding: 25px; border-radius: 12px; max-width: 600px; max-height: 80vh; overflow-y: auto; width: 90%;">
            ${reviewHTML}
            <button onclick="this.parentElement.parentElement.remove()" style="margin-top: 15px; padding: 10px 20px; background: #4299e1; color: white; border: none; border-radius: 6px; cursor: pointer; width: 100%;">
                Close Review
            </button>
        </div>
    `;
    
    document.body.appendChild(reviewModal);
    
    // Close modal when clicking outside
    reviewModal.addEventListener('click', function(e) {
        if (e.target === reviewModal) {
            reviewModal.remove();
        }
    });
}

// Go back to translator
function goBackToTranslator() {
    window.location.href = 'translator.html';
}

// Initialize quiz when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing quiz...');
    initQuiz();
});