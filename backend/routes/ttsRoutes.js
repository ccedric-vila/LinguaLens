const express = require('express');
const router = express.Router();
const TxttoSpeechWTController = require('../controllers/TxttoSpeechWTController');

// TTS Analytics routes
router.post('/tts-analytics', TxttoSpeechWTController.saveTtsWithTranslation);
router.get('/tts-analytics/:user_id', TxttoSpeechWTController.getTextToSpeechAnalytics);

// TTS History routes
router.post('/tts-history', TxttoSpeechWTController.saveTtsHistory);
router.get('/tts-history/:user_id', TxttoSpeechWTController.getTtsHistoryByUser);

module.exports = router;