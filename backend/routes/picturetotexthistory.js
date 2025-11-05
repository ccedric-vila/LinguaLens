const express = require('express');
const router = express.Router();
const { getHistory } = require('../controllers/PictureToTextHistoryController');

// Route to get history
router.get('/', getHistory);

module.exports = router;