// routes/quizRoutes.js

const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

// Generate new quiz
router.post('/generate', quizController.generateQuiz);

// Submit quiz answers
router.post('/submit', quizController.submitQuiz);

// Get user's quiz history
router.get('/history/:userId', quizController.getQuizHistory);

// Get quiz statistics
router.get('/stats/:userId', quizController.getQuizStats);

module.exports = router;