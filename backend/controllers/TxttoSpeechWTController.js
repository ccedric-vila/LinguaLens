// LinguaLens/backend/controllers/TxttoSpeechWTController.js
const connection = require('../config/db');

// ✅ Save TTS with translation analytics
exports.saveTtsWithTranslation = (req, res) => {
  const { user_id, input_text, source_language, target_language, translated_text, engine_used, character_count, processing_duration, audio_duration } = req.body;

  if (!user_id || !input_text || !target_language || !translated_text || !engine_used) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  const query = `
    INSERT INTO texttospeech 
    (user_id, input_text, source_language, target_language, translated_text, engine_used, character_count, processing_duration, audio_duration)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  connection.execute(
    query, 
    [user_id, input_text, source_language, target_language, translated_text, engine_used, character_count, processing_duration, audio_duration], 
    (err, results) => {
      if (err) {
        console.error('Error saving text-to-speech analytics:', err);
        return res.status(500).json({ message: 'Database error.' });
      }

      return res.status(201).json({
        message: 'Text-to-speech analytics saved successfully.',
        id: results.insertId
      });
    }
  );
};

// ✅ Save TTS history
exports.saveTtsHistory = (req, res) => {
    const { user_id, text_content, engine_used, language_used } = req.body;

    if (!user_id || !text_content || !engine_used) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }

    const query = `
        INSERT INTO tts_history (user_id, text_content, engine_used, language_used)
        VALUES (?, ?, ?, ?)
    `;

    connection.execute(query, [user_id, text_content, engine_used, language_used], (err, results) => {
        if (err) {
            console.error('Error saving TTS history:', err);
            return res.status(500).json({ message: 'Database error.' });
        }

        return res.status(201).json({
            message: 'TTS history saved successfully.'
        });
    });
};

// ✅ Get TTS history by user
exports.getTtsHistoryByUser = (req, res) => {
    const { user_id } = req.params;

    const query = `
        SELECT text_content, engine_used, language_used, created_at
        FROM tts_history
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;

    connection.execute(query, [user_id], (err, results) => {
        if (err) {
            console.error('Error fetching TTS history:', err);
            return res.status(500).json({ message: 'Database error.' });
        }

        res.json(results);
    });
};

// ✅ Get text-to-speech analytics by user
exports.getTextToSpeechAnalytics = (req, res) => {
    const { user_id } = req.params;

    const query = `
        SELECT input_text, source_language, target_language, engine_used, character_count, created_at
        FROM texttospeech
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;

    connection.execute(query, [user_id], (err, results) => {
        if (err) {
            console.error('Error fetching text-to-speech analytics:', err);
            return res.status(500).json({ message: 'Database error.' });
        }

        res.json(results);
    });
};