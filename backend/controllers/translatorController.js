// translatorController.js - FIXED VERSION WITH USER ID EXEMPTIONS
const translatte = require('translatte');
const connection = require('../config/db');

/**
 * Extract user ID from request with exemptions for missing IDs
 */
function extractUserId(req) {
    console.log('🔍 Extracting user ID from request...');
    
    // Method 1: Check request body
    if (req.body && req.body.userId) {
        const userId = parseInt(req.body.userId);
        if (!isNaN(userId) && userId > 0) {
            console.log('✅ User ID from request body:', userId);
            return userId;
        }
    }

    // Method 2: Check X-User-ID header
    if (req.headers['x-user-id']) {
        const userId = parseInt(req.headers['x-user-id']);
        if (!isNaN(userId) && userId > 0) {
            console.log('✅ User ID from X-User-ID header:', userId);
            return userId;
        }
    }
    
    // Method 3: Check cookies
    if (req.cookies && req.cookies.userId) {
        const userId = parseInt(req.cookies.userId);
        if (!isNaN(userId) && userId > 0) {
            console.log('✅ User ID from cookie:', userId);
            return userId;
        }
    }
    
    // EXEMPTION: Return null for missing user IDs (will use NULL in database)
    console.log('⚠️ No valid user ID found - using NULL (exemption applied)');
    return null;
}

exports.translateText = async (req, res) => {
    const { text, to, filename, processingTime, confidenceScore, objectsData } = req.body;

    console.log('🌍 Translation request received');
    console.log('📝 Text length:', text?.length || 0);
    console.log('🎯 Target language:', to);
    console.log('📄 Filename:', filename);

    if (!text || !to) {
        return res.status(400).json({ error: 'Text and target language are required.' });
    }

    try {
        console.log(`🌍 Translating text to: ${to}`);
        console.log(`📝 Text length: ${text.length} characters`);
        
        const startTime = Date.now();
        
        const result = await translatte(text, { to });
        
        const translationTime = ((Date.now() - startTime) / 1000).toFixed(1);
        
        const responseData = {
            translated: result.text,
            detected: result.from.language.iso
        };

        // ✅ PROCEED WITH DATABASE SAVE EVEN IF USER ID IS NULL
        const userId = extractUserId(req);
        
        console.log('💾 Attempting to save translation with user ID:', userId);
        
        const insertQuery = `
            INSERT INTO image_analysis_translator 
            (user_id, filename, extracted_text, translated_text, source_language, target_language, 
            processing_time, confidence_score, analysis_type, objects_json) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        connection.query(
            insertQuery,
            [
                userId, // This can be NULL now - database should allow NULL
                filename || 'text_translation',
                text,
                result.text,
                result.from.language.iso,
                to,
                processingTime || `${translationTime}s`,
                confidenceScore || 0,
                "text_translation",
                objectsData ? JSON.stringify(objectsData) : null
            ],
            (insertErr, insertResults) => {
                if (insertErr) {
                    console.error('❌ Failed to insert translation record:', insertErr);
                    // ✅ EXEMPTION: Don't fail the request if DB insert fails
                    console.log('⚠️ Database insert failed but translation completed successfully');
                } else {
                    console.log('✅ Inserted translation record ID:', insertResults.insertId);
                    console.log('✅ Translation saved with user ID:', userId);
                }
            }
        );
        
        // ✅ ALWAYS RETURN SUCCESS RESPONSE EVEN IF USER ID MISSING OR DB FAILS
        res.json(responseData);
        
    } catch (err) {
        console.error('Translation error:', err);
        res.status(500).json({ error: 'Translation failed.' });
    }
};

// Additional exemption: Allow translations without saving to database if needed
exports.translateTextOnly = async (req, res) => {
    const { text, to } = req.body;

    if (!text || !to) {
        return res.status(400).json({ error: 'Text and target language are required.' });
    }

    try {
        console.log(`🌍 Translation-only request (no save): ${to}`);
        
        const result = await translatte(text, { to });
        
        res.json({
            translated: result.text,
            detected: result.from.language.iso
        });
        
    } catch (err) {
        console.error('Translation error:', err);
        res.status(500).json({ error: 'Translation failed.' });
    }
};