const express = require('express');
const router = express.Router();
const { getHistory } = require('../controllers/PictureToTextHistoryController');

// Route to get history for specific user
router.get('/:userId', getHistory);

module.exports = router;