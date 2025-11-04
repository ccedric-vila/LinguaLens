// backend/routes/leaderboards.js - ENHANCED VERSION
const express = require('express');
const router = express.Router();
const LeaderboardsController = require('../controllers/LeaderboardsController');

// 🏆 Leaderboard Routes
router.get('/overall', LeaderboardsController.getOverallLeaderboard);
router.get('/weekly', LeaderboardsController.getWeeklyLeaderboard);
router.get('/monthly', LeaderboardsController.getMonthlyLeaderboard);
router.get('/engagement', LeaderboardsController.getEngagementLevels);

// 📊 Analytics Routes
router.get('/languages', LeaderboardsController.getLanguagePopularity);
router.get('/tts-engines', LeaderboardsController.getTTSEngineStats);
router.get('/user-statistics', LeaderboardsController.getUserStatistics);

module.exports = router;