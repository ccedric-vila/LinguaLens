// quiz.js - Country & Language Quiz Frontend Logic

// Quiz state management
let currentQuiz = {
    questions: [],
    currentQuestionIndex: 0,
    userAnswers: [],
    score: 0,
    totalQuestions: 0,
    difficulty: 'medium'
};

// DOM Elements
let quizCreation, quizTaking, quizResults;
let questionCountSelect, quizCategorySelect, quizDifficultySelect, generateQuizBtn;
let currentQuestionEl, totalQuestionsEl, currentScoreEl, difficultyBadgeEl;
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
    quizDifficultySelect = document.getElementById('quizDifficulty');
    generateQuizBtn = document.getElementById('generateQuiz');
    
    // Quiz taking elements
    currentQuestionEl = document.getElementById('currentQuestion');
    totalQuestionsEl = document.getElementById('totalQuestions');
    currentScoreEl = document.getElementById('currentScore');
    difficultyBadgeEl = document.getElementById('difficultyBadge');
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
    const difficulty = quizDifficultySelect.value;
    
    console.log(`Generating quiz: ${questionCount} questions, category: ${category}, difficulty: ${difficulty}`);
    
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
        const quizData = await generateQuizWithAI(questionCount, category, difficulty);
        
        // Initialize quiz state
        currentQuiz = {
            questions: quizData.questions,
            currentQuestionIndex: 0,
            userAnswers: new Array(quizData.questions.length).fill(null),
            score: 0,
            totalQuestions: quizData.questions.length,
            difficulty: difficulty
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
async function generateQuizWithAI(questionCount, category, difficulty) {
    const categoryDescriptions = {
        'multiple_choice': 'text-based multiple choice questions about countries and languages',
        'multiple_choice_flag': 'multiple choice questions showing country flags and asking which country they belong to',
        'identification': 'text-based identification questions about countries, capitals, and languages',
        'flag_identification': 'identification questions showing country flags and asking to name the country',
        'combination': 'a mix of all question types about countries, languages, and flags'
    };
    
    const difficultyDescriptions = {
        'easy': 'basic questions about well-known countries and common languages',
        'medium': 'moderate difficulty questions including some less common countries and languages',
        'hard': 'challenging questions about less common countries, obscure languages, and detailed cultural facts',
        'superhard': 'very difficult questions about rarely known countries, extremely obscure languages, and highly specific cultural details'
    };
    
    const prompt = `Generate a ${questionCount}-question quiz about countries and languages. 
Category: ${categoryDescriptions[category]}
Difficulty: ${difficultyDescriptions[difficulty]}

Requirements:
- Questions should be about world countries, their capitals, languages, cultures, and flags
- For flag questions, include the country code for flag image URLs (use format: https://flagcdn.com/w320/{code}.png)
- Make questions appropriate for the ${difficulty} difficulty level
- Include interesting cultural facts and educational content
- For ${difficulty} difficulty, focus on ${getDifficultyFocus(difficulty)}

Return ONLY a JSON object in this exact format:
{
    "questions": [
        {
            "type": "question_type",
            "question": "question text",
            "flagUrl": "https://flagcdn.com/w320/{code}.png" // only for flag questions
            "options": ["option1", "option2", "option3", "option4"], // only for multiple choice
            "correctAnswer": "exact correct answer",
            "explanation": "brief educational explanation",
            "difficulty": "${difficulty}" // include difficulty level
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
                
                // Ensure difficulty is set
                if (!q.difficulty) {
                    q.difficulty = difficulty;
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
        return generateFallbackQuiz(questionCount, category, difficulty);
    }
}

// Helper function for difficulty focus
function getDifficultyFocus(difficulty) {
    const focusMap = {
        'easy': 'well-known countries and common languages',
        'medium': 'mix of common and some less common countries',
        'hard': 'less common countries and detailed cultural facts',
        'superhard': 'obscure countries and highly specific details'
    };
    return focusMap[difficulty] || 'general knowledge';
}

// Fallback quiz generator in case AI fails
function generateFallbackQuiz(questionCount, category, difficulty) {
    const fallbackQuestions = [
        {
            type: "multiple_choice",
            question: "Which country is known for the Great Barrier Reef, the world's largest coral reef system?",
            options: ["Australia", "Philippines", "Indonesia", "Mexico"],
            correctAnswer: "Australia",
            explanation: "The Great Barrier Reef is located off the coast of Queensland, Australia and is the world's largest coral reef system.",
            difficulty: "easy"
        },
        {
            type: "multiple_choice",
            question: "What is the official language of Brazil?",
            options: ["Spanish", "Portuguese", "French", "English"],
            correctAnswer: "Portuguese",
            explanation: "Brazil is the only Portuguese-speaking country in South America due to its history as a Portuguese colony.",
            difficulty: "easy"
        },
        {
            type: "flag_identification",
            question: "Identify the country by its flag:",
            flagUrl: "https://flagcdn.com/w320/jp.png",
            correctAnswer: "Japan",
            explanation: "This is the flag of Japan, known as the 'Nisshōki' or 'Hinomaru', featuring a red circle on a white background.",
            difficulty: "easy"
        },
        {
            type: "multiple_choice_flag",
            question: "Which country does this flag belong to?",
            flagUrl: "https://flagcdn.com/w320/fr.png",
            options: ["France", "Italy", "Belgium", "Netherlands"],
            correctAnswer: "France",
            explanation: "This is the flag of France, known as the 'Tricolore', with vertical blue, white, and red stripes.",
            difficulty: "easy"
        },
        {
            type: "identification",
            question: "What is the capital of Canada?",
            correctAnswer: "Ottawa",
            explanation: "Ottawa is the capital city of Canada, located in the province of Ontario.",
            difficulty: "easy"
        },
        {
            type: "multiple_choice",
            question: "Which of these countries has both Spanish and French as official languages?",
            options: ["Andorra", "Switzerland", "Belgium", "Luxembourg"],
            correctAnswer: "Andorra",
            explanation: "Andorra has Catalan as its official language, but Spanish and French are also widely spoken and used in administration.",
            difficulty: "medium"
        },
        {
            type: "identification",
            question: "What is the official language of Ethiopia?",
            correctAnswer: "Amharic",
            explanation: "Amharic is the official language of Ethiopia, though the country has many regional languages.",
            difficulty: "medium"
        },
        {
            type: "multiple_choice",
            question: "Which country's flag features a dragon?",
            options: ["Bhutan", "Wales", "Both Bhutan and Wales", "Malaysia"],
            correctAnswer: "Both Bhutan and Wales",
            explanation: "Both Bhutan and Wales have flags featuring dragons, making them unique in world flags.",
            difficulty: "medium"
        },
        {
            type: "multiple_choice",
            question: "In which country would you find the ancient city of Timbuktu?",
            options: ["Mali", "Niger", "Chad", "Sudan"],
            correctAnswer: "Mali",
            explanation: "Timbuktu is a historical city in Mali, West Africa, known for its role in trans-Saharan trade.",
            difficulty: "hard"
        },
        {
            type: "identification",
            question: "What is the official language of Suriname?",
            correctAnswer: "Dutch",
            explanation: "Suriname was a Dutch colony and Dutch remains its official language, though many other languages are spoken.",
            difficulty: "hard"
        },
        {
            type: "multiple_choice",
            question: "Which country has the most official languages?",
            options: ["India", "South Africa", "Bolivia", "Zimbabwe"],
            correctAnswer: "Bolivia",
            explanation: "Bolivia has 37 official languages, the most of any country, including Spanish and 36 indigenous languages.",
            difficulty: "superhard"
        },
        {
            type: "identification",
            question: "What is the capital of Eswatini (formerly Swaziland)?",
            correctAnswer: "Mbabane",
            explanation: "Mbabane is the administrative capital of Eswatini, while Lobamba is the royal and legislative capital.",
            difficulty: "superhard"
        }
    ];
    
    // Filter questions by difficulty if not combination
    let filteredQuestions = fallbackQuestions;
    if (difficulty !== 'combination') {
        filteredQuestions = fallbackQuestions.filter(q => q.difficulty === difficulty);
    }
    
    // Return requested number of questions
    return {
        questions: filteredQuestions.slice(0, questionCount)
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

// Load a specific question
function loadQuestion(questionIndex) {
    if (questionIndex < 0 || questionIndex >= currentQuiz.questions.length) return;
    
    const question = currentQuiz.questions[questionIndex];
    currentQuiz.currentQuestionIndex = questionIndex;
    
    console.log('Loading question:', question);
    
    // Update progress
    currentQuestionEl.textContent = questionIndex + 1;
    currentScoreEl.textContent = currentQuiz.score;
    
    // Update difficulty badge
    updateDifficultyBadge(question.difficulty || currentQuiz.difficulty);
    
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
    
    // Setup question type specific UI
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

// Update difficulty badge
function updateDifficultyBadge(difficulty) {
    const badgeClasses = {
        'easy': 'difficulty-badge difficulty-easy',
        'medium': 'difficulty-badge difficulty-medium',
        'hard': 'difficulty-badge difficulty-hard',
        'superhard': 'difficulty-badge difficulty-superhard'
    };
    
    const badgeText = {
        'easy': 'Easy',
        'medium': 'Medium',
        'hard': 'Hard',
        'superhard': 'Super Hard'
    };
    
    difficultyBadgeEl.className = badgeClasses[difficulty] || 'difficulty-badge difficulty-medium';
    difficultyBadgeEl.textContent = badgeText[difficulty] || 'Medium';
    difficultyBadgeEl.style.display = 'inline-block';
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

// Setup identification question
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
    if (percentage >= 80) return 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
    if (percentage >= 60) return 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)';
    return 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)';
}

// Generate results breakdown
function generateResultsBreakdown(correctAnswers) {
    const totalQuestions = currentQuiz.questions.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    let performanceMessage = '';
    if (percentage >= 90) performanceMessage = 'Outstanding! 🌟';
    else if (percentage >= 80) performanceMessage = 'Excellent! 🎯';
    else if (percentage >= 70) performanceMessage = 'Good job! 👍';
    else if (percentage >= 60) performanceMessage = 'Not bad! 💪';
    else performanceMessage = 'Keep practicing! 📚';
    
    resultsBreakdown.innerHTML = `
        <div style="text-align: center; margin-bottom: 15px; font-weight: 700; color: #2d3748;">
            ${performanceMessage}
        </div>
        <div class="breakdown-item">
            <span>Total Questions:</span>
            <span>${totalQuestions}</span>
        </div>
        <div class="breakdown-item">
            <span>Difficulty Level:</span>
            <span style="text-transform: capitalize; font-weight: 600;">${currentQuiz.difficulty}</span>
        </div>
        <div class="breakdown-item">
            <span>Correct Answers:</span>
            <span style="color: #48bb78; font-weight: 700;">${correctAnswers}</span>
        </div>
        <div class="breakdown-item">
            <span>Incorrect Answers:</span>
            <span style="color: #e53e3e; font-weight: 700;">${totalQuestions - correctAnswers}</span>
        </div>
        <div class="breakdown-item">
            <span>Success Rate:</span>
            <span style="font-weight: 700;">${percentage}%</span>
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
                difficulty: currentQuiz.difficulty,
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
        totalQuestions: 0,
        difficulty: 'medium'
    };
    
    // Show creation screen
    quizCreation.style.display = 'block';
    quizTaking.style.display = 'none';
    quizResults.style.display = 'none';
}

// Review quiz answers
function reviewQuiz() {
    let reviewHTML = '<h3 style="margin-bottom: 20px; color: #2d3748; text-align: center;">Quiz Review</h3>';
    
    currentQuiz.questions.forEach((question, index) => {
        const userAnswer = currentQuiz.userAnswers[index] || 'No answer';
        const isCorrect = userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
        
        reviewHTML += `
            <div style="margin-bottom: 25px; padding: 20px; border: 2px solid ${isCorrect ? '#c6f6d5' : '#fed7d7'}; border-radius: 12px; background: ${isCorrect ? '#f0fff4' : '#fff5f5'};">
                <div style="font-weight: 700; margin-bottom: 10px; color: #2d3748; font-size: 17px;">
                    Question ${index + 1}: ${question.question}
                    <span class="difficulty-badge difficulty-${question.difficulty || 'medium'}" style="margin-left: 10px; font-size: 11px;">
                        ${question.difficulty || 'Medium'}
                    </span>
                </div>
                ${question.flagUrl ? `<img src="${question.flagUrl}" style="max-width: 120px; height: 70px; border: 2px solid #e2e8f0; border-radius: 6px; margin: 10px 0; display: block;">` : ''}
                <div style="margin-bottom: 8px; font-size: 15px;">
                    <strong>Your Answer:</strong> 
                    <span style="color: ${isCorrect ? '#48bb78' : '#e53e3e'}; font-weight: 600;">${userAnswer}</span>
                    ${isCorrect ? ' ✓' : ' ✗'}
                </div>
                <div style="margin-bottom: 8px; font-size: 15px;">
                    <strong>Correct Answer:</strong> 
                    <span style="color: #48bb78; font-weight: 600;">${question.correctAnswer}</span>
                </div>
                <div style="font-size: 14px; color: #4a5568; background: white; padding: 12px; border-radius: 8px; border-left: 4px solid #4299e1;">
                    <strong>Explanation:</strong> ${question.explanation}
                </div>
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
        background: rgba(0,0,0,0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        padding: 20px;
    `;
    
    reviewModal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 16px; max-width: 700px; max-height: 85vh; overflow-y: auto; width: 100%; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: #2d3748;">Quiz Review - ${currentQuiz.difficulty.charAt(0).toUpperCase() + currentQuiz.difficulty.slice(1)} Difficulty</h3>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: #e53e3e; color: white; border: none; border-radius: 8px; padding: 8px 16px; cursor: pointer; font-weight: 600;">
                    Close
                </button>
            </div>
            ${reviewHTML}
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
    window.location.href = 'home.html';
}

// Go to home page
function goToHome() {
    window.location.href = '../User/html/home.html';
}

// Initialize quiz when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing quiz...');
    initQuiz();
});