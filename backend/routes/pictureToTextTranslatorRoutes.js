// routes/pictureToTextTranslatorRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');
const { extractTranslateAndDetect, getAvailableLanguages } = require('../controllers/PictureToTextTranslatorController');

router.post('/upload', upload.single('image'), extractTranslateAndDetect);
router.get('/languages', getAvailableLanguages);

module.exports = router;