// routes/translationUpdate.js
const express = require('express');
const router = express.Router();
const connection = require('../config/db');

/**
 * Update translation in database when user translates text
 */
router.post('/updatetranslation', async (req, res) => {
  const { filename, translatedText, targetLanguage, sourceLanguage } = req.body;
  
  if (!filename || !translatedText || !targetLanguage) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const updateQuery = `
      UPDATE image_analysis_translator 
      SET translated_text = ?, 
          target_language = ?,
          source_language = COALESCE(?, source_language),
          updated_at = NOW()
      WHERE filename = ? AND (translated_text = '' OR translated_text IS NULL)
    `;

    connection.query(
      updateQuery,
      [translatedText, targetLanguage, sourceLanguage, filename],
      (err, results) => {
        if (err) {
          console.error('❌ Database update failed:', err);
          return res.status(500).json({ error: 'Failed to update translation' });
        }

        if (results.affectedRows === 0) {
          console.log('⚠️ No record updated - may already have translation');
          return res.json({ message: 'No update needed - translation may already exist' });
        }

        console.log(`✅ Updated translation for ${filename}: ${targetLanguage}`);
        res.json({ 
          success: true, 
          message: 'Translation updated in database',
          affectedRows: results.affectedRows 
        });
      }
    );
  } catch (error) {
    console.error('Translation update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;