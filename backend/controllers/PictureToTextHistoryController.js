const connection = require('../config/db');

// Fetch history of image analysis and translations
const getHistory = (req, res) => {
  connection.execute(
    `SELECT 
      id, 
      filename, 
      extracted_text,
      translated_text,
      source_language,
      target_language,
      processing_time,
      confidence_score,
      created_at 
     FROM image_analysis_translator 
     ORDER BY created_at DESC`,
    (err, results) => {
      if (err) {
        console.error('Error fetching history:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      console.log('Fetched records:', results.length); // Debug log
      
      // Format the data to ensure no undefined values
      const formattedResults = results.map(item => {
        // Debug log for each item
        console.log('Processing item:', {
          id: item.id,
          filename: item.filename,
          hasExtracted: !!item.extracted_text,
          hasTranslated: !!item.translated_text
        });
        
        return {
          id: item.id || 0,
          filename: item.filename || 'Unknown File',
          extracted_text: item.extracted_text || 'No text extracted',
          translated_text: item.translated_text || 'No translation available',
          source_language: item.source_language || 'N/A',
          target_language: item.target_language || 'N/A',
          processing_time: item.processing_time || 'N/A',
          confidence_score: item.confidence_score ? parseFloat(item.confidence_score).toFixed(1) : '0.0',
          created_at: item.created_at
        };
      });
      
      res.json(formattedResults);
    }
  );
};

module.exports = { getHistory };