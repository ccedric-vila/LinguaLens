// backend/index.js - FIXED VERSION

require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const cors = require('cors');



// ✅ Enable CORS
app.use(cors({
  origin: 'http://localhost', // Your frontend origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID'],
  exposedHeaders: ['Content-Type']
}));

// ✅ Connect to database
require('./config/db');

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// ✅ Serve static files
app.use('/frontend', express.static(path.join(__dirname, '..', 'frontend')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/uploads', express.static(uploadsDir));

// ✅ Import routes (make sure each file exists and exports properly)
const userRoutes = require('./routes/user');
const homeRoutes = require('./routes/home');
const pictureToTextRoutes = require('./routes/picturetotext');
const pictureToTextHistoryRoutes = require('./routes/picturetotexthistory');
const profileRoutes = require('./routes/profile');
const translateRoutes = require('./routes/translatewsRoutes');
const translatorRoutes = require('./routes/translatorRoutes');
const pictureToTextTranslatorRoutes = require('./routes/pictureToTextTranslatorRoutes');
const quizRoutes = require('./routes/quizRoutes');
const txtToSpeechWTRoutes = require('./routes/txttospeechwt');
const leaderboardsRoutes = require('./routes/leaderboards');
const ttsRoutes = require('./routes/ttsRoutes'); // Remove duplicate registration
const translationUpdateRoutes = require('./routes/translationUpdate');

// ✅ Register routes
app.use('/api/v1', userRoutes);
app.use('/api/v1', homeRoutes);
app.use('/api/picturetotext', pictureToTextRoutes);
app.use('/api/picturetotexthistory', pictureToTextHistoryRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api', translateRoutes);
app.use('/translator', translatorRoutes);
app.use('/api/picturetotexttranslator', pictureToTextTranslatorRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api', txtToSpeechWTRoutes);
app.use('/api/leaderboards', leaderboardsRoutes);
// app.use('/api', ttsRoutes); // ✅ Only register once
app.use('/api', translationUpdateRoutes);

// ✅ Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// ✅ Handle other errors
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message
  });
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("\n===========================================");
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ Frontend: http://localhost:${PORT}/frontend/User/html/leaderboards.html`);
    console.log(`✅ Leaderboards API: http://localhost:${PORT}/api/leaderboards/most-active-users`);
    console.log("===========================================\n");
});