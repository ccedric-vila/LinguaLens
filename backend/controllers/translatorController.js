// translatorController.js - INSERT ONLY VERSION
const translatte = require('translatte');
const connection = require('../config/db');

exports.translateText = async (req, res) => {
    const { text, to, filename, processingTime, confidenceScore, objectsData } = req.body;

    if (!text || !to) {
        return res.status(400).json({ error: 'Text and target language are required.' });
    }

    try {
        console.log(`🌐 Translating text to: ${to}`);
        console.log(`📝 Text length: ${text.length} characters`);
        
        const startTime = Date.now();
        
        // Translatte will automatically detect the input language if 'from' is not provided
        const result = await translatte(text, { to });
        
        const translationTime = ((Date.now() - startTime) / 1000).toFixed(1);
        
        const responseData = {
            translated: result.text,
            detected: result.from.language.iso // detected language code
        };

        // ✅ OPTIONAL DATABASE INSERTION - ONLY IF filename PROVIDED
        // This allows translation to work without database operations
        // In the translateText function, modify the database insertion part:

        // ✅ OPTIONAL DATABASE INSERTION - ONLY IF filename PROVIDED
        if (filename && connection) {
            const userId = req.extractedUserId || null; // ✅ Enhanced user ID extraction
            
            const insertQuery = `
                INSERT INTO image_analysis_translator 
                (user_id, filename, extracted_text, translated_text, source_language, target_language, 
                processing_time, confidence_score, analysis_type, objects_json) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            connection.query(
                insertQuery,
                [
                    userId, // ✅ Now properly checks multiple sources
                    filename,
                    text, // original extracted text
                    result.text, // translated text
                    result.from.language.iso, // detected source language
                    to, // target language
                    processingTime || `${translationTime}s`,
                    confidenceScore || 0,
                    "extraction_with_translation",
                    objectsData ? JSON.stringify(objectsData) : null
                ],
                (insertErr, insertResults) => {
                    if (insertErr) {
                        console.error('❌ Failed to insert translation record:', insertErr);
                    } else {
                        console.log('✅ Inserted translation record ID:', insertResults.insertId);
                        console.log('👤 User ID used:', userId); // ✅ Log the user ID for debugging
                    }
                }
            );
        } else {
            console.log('📝 Translation completed without database insertion');
        }
        res.json(responseData);
        
    } catch (err) {
        console.error('Translation error:', err);
        res.status(500).json({ error: 'Translation failed.' });
    }
};