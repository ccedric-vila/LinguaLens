// routes/picturetotext.js - BACKEND ROUTES
const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');
const { extractText } = require('../controllers/PictureToTextController');
// const verifyToken = require('../middlewares/auth'); // JWT middleware

/**
 * @route POST /api/picturetotext/upload
 * @desc Upload image for OCR text extraction AND object detection
 * @access Public (or Protected with verifyToken if needed)
 */
router.post('/upload', upload.single('image'), extractText);

/**
 * @route GET /api/picturetotext/history
 * @desc Get user's analysis history
 * @access Protected
 */
router.get('/history', /* verifyToken, */ async (req, res) => {
  try {
    const connection = require('../config/db');
    const userId = req.user?.id || 1; // Temporary for testing
    
    connection.query(
      `SELECT * FROM image_analysis 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId],
      (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        // Parse JSON objects
        const history = results.map(item => ({
          id: item.id,
          filename: item.filename,
          extracted_text: item.extracted_text,
          image_description: item.image_description,
          objects_json: item.objects_json ? JSON.parse(item.objects_json) : [],
          ocr_engine: item.ocr_engine,
          detection_engine: item.detection_engine,
          processing_time: item.processing_time,
          language_used: item.language_used,
          confidence_score: item.confidence_score,
          created_at: item.created_at
        }));
        
        res.json({ 
          success: true,
          count: history.length,
          history 
        });
      }
    );
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * @route GET /api/picturetotext/analysis/:id
 * @desc Get specific analysis by ID
 * @access Protected
 */
router.get('/analysis/:id', /* verifyToken, */ async (req, res) => {
  try {
    const connection = require('../config/db');
    const analysisId = req.params.id;
    const userId = req.user?.id || 1; // Temporary for testing
    
    // Get main analysis
    connection.query(
      `SELECT ia.* 
       FROM image_analysis ia
       WHERE ia.id = ? AND ia.user_id = ?`,
      [analysisId, userId],
      (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
          return res.status(404).json({ 
            success: false,
            error: 'Analysis not found' 
          });
        }
        
        const analysis = results[0];
        
        // Get detected objects
        connection.query(
          `SELECT * FROM detected_objects 
           WHERE analysis_id = ? 
           ORDER BY confidence DESC`,
          [analysisId],
          (objErr, objects) => {
            if (objErr) {
              console.error('Objects fetch error:', objErr);
              return res.status(500).json({ 
                success: false,
                error: 'Error fetching objects' 
              });
            }
            
            res.json({
              success: true,
              analysis: {
                id: analysis.id,
                filename: analysis.filename,
                extracted_text: analysis.extracted_text,
                image_description: analysis.image_description,
                objects_json: analysis.objects_json ? JSON.parse(analysis.objects_json) : [],
                objects: objects,
                ocr_engine: analysis.ocr_engine,
                detection_engine: analysis.detection_engine,
                processing_time: analysis.processing_time,
                language_used: analysis.language_used,
                confidence_score: analysis.confidence_score,
                created_at: analysis.created_at
              }
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Analysis fetch error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * @route GET /api/picturetotext/stats
 * @desc Get user's analysis statistics
 * @access Protected
 */
router.get('/stats', /* verifyToken, */ async (req, res) => {
  try {
    const connection = require('../config/db');
    const userId = req.user?.id || 1; // Temporary for testing
    
    connection.query(
      `SELECT 
        COUNT(*) as total_analyses,
        AVG(confidence_score) as avg_confidence,
        SUM(LENGTH(extracted_text)) as total_text_chars,
        COUNT(DISTINCT language_used) as languages_used
       FROM image_analysis 
       WHERE user_id = ?`,
      [userId],
      (err, results) => {
        if (err) {
          console.error('Stats error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        const stats = results[0];
        
        // Get most detected objects
        connection.query(
          `SELECT object_name, COUNT(*) as count
           FROM detected_objects 
           WHERE analysis_id IN (SELECT id FROM image_analysis WHERE user_id = ?)
           GROUP BY object_name 
           ORDER BY count DESC 
           LIMIT 10`,
          [userId],
          (objErr, objects) => {
            if (objErr) {
              console.error('Objects stats error:', objErr);
            }
            
            res.json({
              success: true,
              stats: {
                total_analyses: stats.total_analyses,
                avg_confidence: Math.round(stats.avg_confidence || 0),
                total_text_chars: stats.total_text_chars,
                languages_used: stats.languages_used,
                top_objects: objects || []
              }
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * @route DELETE /api/picturetotext/analysis/:id
 * @desc Delete specific analysis
 * @access Protected
 */
router.delete('/analysis/:id', /* verifyToken, */ async (req, res) => {
  try {
    const connection = require('../config/db');
    const analysisId = req.params.id;
    const userId = req.user?.id || 1; // Temporary for testing
    
    // Start transaction for atomic deletion
    connection.beginTransaction((beginErr) => {
      if (beginErr) {
        return res.status(500).json({ error: 'Transaction error' });
      }
      
      // Delete objects first (foreign key constraint)
      connection.query(
        'DELETE FROM detected_objects WHERE analysis_id = ?',
        [analysisId],
        (objErr) => {
          if (objErr) {
            return connection.rollback(() => {
              res.status(500).json({ error: 'Error deleting objects' });
            });
          }
          
          // Delete main analysis
          connection.query(
            'DELETE FROM image_analysis WHERE id = ? AND user_id = ?',
            [analysisId, userId],
            (err, results) => {
              if (err) {
                return connection.rollback(() => {
                  res.status(500).json({ error: 'Database error' });
                });
              }
              
              if (results.affectedRows === 0) {
                return connection.rollback(() => {
                  res.status(404).json({ error: 'Analysis not found' });
                });
              }
              
              connection.commit((commitErr) => {
                if (commitErr) {
                  return connection.rollback(() => {
                    res.status(500).json({ error: 'Commit error' });
                  });
                }
                
                res.json({ 
                  success: true,
                  message: 'Analysis deleted successfully' 
                });
              });
            }
          );
        }
      );
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;