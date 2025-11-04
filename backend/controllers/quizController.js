// controllers/quizController.js

const quizController = {
    // Generate quiz questions
    generateQuiz: async (req, res) => {
        try {
            const { questionCount, category, userId } = req.body;
            
            console.log('Generating quiz:', { questionCount, category, userId });
            
            // Validate input
            if (!questionCount || !category) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: questionCount and category'
                });
            }

            // Generate unique quiz ID
            const quizId = generateQuizId();
            
            // Store quiz session (in a real app, you'd save to database)
            const quizSession = {
                quizId,
                userId: userId || 'anonymous',
                questionCount: parseInt(questionCount),
                category,
                createdAt: new Date(),
                status: 'generated'
            };

            res.json({
                success: true,
                quizId,
                message: 'Quiz ready for frontend AI generation',
                session: quizSession
            });
            
        } catch (error) {
            console.error('Quiz generation error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate quiz',
                details: error.message
            });
        }
    },

    // Submit quiz and calculate score
    submitQuiz: async (req, res) => {
        try {
            const { quizId, answers, questions, userId } = req.body;
            
            console.log('Submitting quiz:', { quizId, answerCount: answers?.length });
            
            // Validate input
            if (!quizId || !answers || !questions) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: quizId, answers, and questions'
                });
            }

            // Calculate score
            const scoreResult = calculateScore(questions, answers);
            
            // Create quiz result object
            const quizResult = {
                quizId,
                userId: userId || 'anonymous',
                score: scoreResult.score,
                totalQuestions: scoreResult.totalQuestions,
                percentage: scoreResult.percentage,
                correctAnswers: scoreResult.correctAnswers,
                incorrectAnswers: scoreResult.incorrectAnswers,
                submittedAt: new Date(),
                category: questions[0]?.type || 'unknown',
                detailedResults: scoreResult.detailedResults
            };

            // In a real app, save to database here
            console.log('Quiz result:', quizResult);

            res.json({
                success: true,
                ...quizResult,
                message: 'Quiz submitted successfully'
            });
            
        } catch (error) {
            console.error('Quiz submission error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to submit quiz',
                details: error.message
            });
        }
    },

    // Get user's quiz history
    getQuizHistory: async (req, res) => {
        try {
            const { userId } = req.params;
            
            console.log('Getting quiz history for user:', userId);
            
            // In a real app, fetch from database
            // For now, return empty array or mock data
            const quizHistory = [];
            
            res.json({
                success: true,
                history: quizHistory,
                message: 'Quiz history retrieved successfully'
            });
            
        } catch (error) {
            console.error('Get quiz history error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve quiz history',
                details: error.message
            });
        }
    },

    // Get quiz statistics
    getQuizStats: async (req, res) => {
        try {
            const { userId } = req.params;
            
            console.log('Getting quiz stats for user:', userId);
            
            // In a real app, calculate from database
            const stats = {
                totalQuizzes: 0,
                averageScore: 0,
                bestScore: 0,
                favoriteCategory: 'None',
                totalQuestions: 0,
                correctAnswers: 0
            };
            
            res.json({
                success: true,
                stats,
                message: 'Quiz statistics retrieved successfully'
            });
            
        } catch (error) {
            console.error('Get quiz stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve quiz statistics',
                details: error.message
            });
        }
    }
};

// Helper functions
function generateQuizId() {
    return 'quiz_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function calculateScore(questions, userAnswers) {
    let correctCount = 0;
    const detailedResults = [];
    
    questions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer && 
                         userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
        
        if (isCorrect) {
            correctCount++;
        }
        
        detailedResults.push({
            question: question.question,
            userAnswer: userAnswer || 'No answer',
            correctAnswer: question.correctAnswer,
            isCorrect,
            explanation: question.explanation,
            type: question.type
        });
    });
    
    const totalQuestions = questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    
    return {
        score: correctCount,
        totalQuestions,
        percentage,
        correctAnswers: correctCount,
        incorrectAnswers: totalQuestions - correctCount,
        detailedResults
    };
}

module.exports = quizController;