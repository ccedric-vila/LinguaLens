const express = require('express');
const router = express.Router();
const TxttoSpeechWTController = require('../controllers/TxttoSpeechWTController');

// ✅ FIXED: Remove /api from all routes and the misleading comment
router.post('/tts-analytics', TxttoSpeechWTController.saveTtsWithTranslation);
router.post('/tts-history', TxttoSpeechWTController.saveTtsHistory);
router.get('/tts-history/:user_id', TxttoSpeechWTController.getTtsHistoryByUser);
router.get('/tts-analytics/:user_id', TxttoSpeechWTController.getTextToSpeechAnalytics);

module.exports = router;