// PictureToTextController.js - INTELLIGENT TEXT DETECTION VERSION (NO PROGRESS LOGS)
const connection = require('../config/db');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const ObjectDetectionController = require('./ObjectDetectionController');
const translatte = require('translatte');
/**
 * Enhanced language configurations with CJK support
 */
const LANGUAGE_CONFIGS = {
  english: { code: 'eng', easyocr: 'en', name: 'English' },
  japanese: { code: 'jpn+eng', easyocr: 'ja,en', name: 'Japanese' },
  chinese_simp: { code: 'chi_sim+eng', easyocr: 'ch_sim,en', name: 'Chinese Simplified' },
  chinese_trad: { code: 'chi_tra+eng', easyocr: 'ch_tra,en', name: 'Chinese Traditional' },
  korean: { code: 'kor+eng', easyocr: 'ko,en', name: 'Korean' },
  spanish: { code: 'spa+eng', easyocr: 'es,en', name: 'Spanish' },
  french: { code: 'fra+eng', easyocr: 'fr,en', name: 'French' },
  german: { code: 'deu+eng', easyocr: 'de,en', name: 'German' },
  italian: { code: 'ita+eng', easyocr: 'it,en', name: 'Italian' },
  portuguese: { code: 'por+eng', easyocr: 'pt,en', name: 'Portuguese' },
  russian: { code: 'rus+eng', easyocr: 'ru,en', name: 'Russian' },
  arabic: { code: 'ara+eng', easyocr: 'ar,en', name: 'Arabic' },
  hindi: { code: 'hin+eng', easyocr: 'hi,en', name: 'Hindi' },
  thai: { code: 'tha+eng', easyocr: 'th,en', name: 'Thai' },
  vietnamese: { code: 'vie+eng', easyocr: 'vi,en', name: 'Vietnamese' },
  all_languages: { 
    code: 'eng+jpn+chi_sim+chi_tra+kor+spa+fra+deu+ita+por+rus+ara+hin+tha+vie',
    easyocr: 'en,ja,ch_sim,ch_tra,ko,es,fr,de,it,pt,ru,ar,hi,th,vi',
    name: 'All Languages (Auto-detect)'
  }
};

/**
 * Custom tessdata path
 */
const TESSDATA_PATH = path.join(__dirname, '..', 'tessdata');


/**
 * Detect actual language from extracted text
 */
const detectActualLanguage = async (text) => {
  if (!text || text.trim().length < 3) return 'unknown';
  
  try {
    console.log('🔍 Detecting language from extracted text...');
    const result = await translatte(text, { to: 'en' });
    const detectedLang = result.from.language.iso;
    console.log(`✅ Detected language: ${detectedLang}`);
    return detectedLang;
  } catch (error) {
    console.warn('⚠️ Language detection failed:', error.message);
    return 'unknown';
  }
};
/**
 * Check if language file exists locally
 */
const checkLanguageAvailability = (languages) => {
  const langList = languages.split('+');
  const availableLanguages = [];
  
  for (const lang of langList) {
    const trainedDataPath = path.join(TESSDATA_PATH, `${lang}.traineddata`);
    if (fs.existsSync(trainedDataPath)) {
      availableLanguages.push(lang);
    } else {
      console.warn(`⚠️ Language file not found: ${lang}.traineddata`);
    }
  }
  
  // Always have English fallback
  if (availableLanguages.length === 0) {
    console.warn('⚠️ No language files found, using English fallback');
    return 'eng';
  }
  
  return availableLanguages.join('+');
};

/**
 * FAST TEXT DETECTION - Check if image contains text
 */
const detectTextPresence = async (filePath) => {
  console.log('🔍 Performing fast text detection...');
  
  try {
    let worker = null;
    
    try {
      // Use English only for fast detection
      worker = await Tesseract.createWorker('eng', 1, {
        logger: () => {}, // Disable all logs
        datapath: TESSDATA_PATH,
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
        tessedit_pageseg_mode: '6'
      });

      const { data } = await worker.recognize(filePath);
      const text = data.text.trim();
      const confidence = data.confidence;
      
      console.log(`📊 Text detection: ${text.length} chars, confidence: ${confidence.toFixed(1)}`);
      
      // Consider text present if we have reasonable confidence and meaningful text
      const hasText = text.length > 10 && confidence > 30;
      
      return {
        hasText,
        textLength: text.length,
        confidence: confidence,
        sampleText: text.substring(0, 100)
      };
      
    } finally {
      if (worker) {
        await worker.terminate();
      }
    }
  } catch (error) {
    console.warn('⚠️ Fast text detection failed:', error.message);
    return { hasText: false, textLength: 0, confidence: 0, sampleText: '' };
  }
};

/**
 * Optimized preprocessing for text-heavy images
 */
const preprocessImageForText = async (filePath) => {
  const variants = [filePath];
  
  try {
    console.log('🔧 Optimized preprocessing for text...');
    
    // Variant 1: High contrast for text
    const contrastPath = filePath.replace(/\.[^/.]+$/, '_contrast.png');
    await sharp(filePath)
      .resize(2000, 2000, { fit: 'inside', withoutEnlargement: false })
      .greyscale()
      .normalize()
      .linear(1.5, -(128 * 0.5))
      .toFile(contrastPath);
    variants.push(contrastPath);

    // Variant 2: Text isolation
    const textOnlyPath = filePath.replace(/\.[^/.]+$/, '_textonly.png');
    await sharp(filePath)
      .resize(2000, 2000, { fit: 'inside', withoutEnlargement: false })
      .greyscale()
      .threshold(128)
      .toFile(textOnlyPath);
    variants.push(textOnlyPath);

    console.log(`✓ Generated ${variants.length - 1} text-optimized variants`);
    return variants;
  } catch (error) {
    console.warn('⚠️ Text preprocessing failed:', error.message);
    return [filePath];
  }
};

/**
 * Basic preprocessing for image-only content
 */
const preprocessImageForObjects = async (filePath) => {
  try {
    console.log('🔧 Basic preprocessing for object detection...');
    
    // Just resize for object detection
    const resizedPath = filePath.replace(/\.[^/.]+$/, '_resized.png');
    await sharp(filePath)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: false })
      .toFile(resizedPath);
    
    return [filePath, resizedPath];
  } catch (error) {
    console.warn('⚠️ Object preprocessing failed:', error.message);
    return [filePath];
  }
};

/**
 * Fast EasyOCR for text extraction
 */
const runEasyOCR = (filePath, languages) => {
  return new Promise((resolve) => {
    const pythonScript = path.join(__dirname, '..', 'utils', 'easyocr_runner.py');
    
    if (!fs.existsSync(pythonScript)) {
      return resolve(null);
    }

    const python = spawn('python', [pythonScript, filePath, languages]);
    let output = '';
    let errorOutput = '';
    
    python.stdout.on('data', (data) => output += data.toString());
    python.stderr.on('data', (data) => errorOutput += data.toString());
    
    python.on('close', (code) => {
      if (code === 0 && output.trim()) {
        try {
          const result = JSON.parse(output.trim());
          if (result.text && result.text.trim().length > 0) {
            console.log(`✓ EasyOCR: ${result.text.length} chars extracted`);
            resolve(result);
          } else {
            console.log('⚠️ EasyOCR: No text extracted');
            resolve(null);
          }
        } catch (parseError) {
          console.warn('⚠️ EasyOCR parse error:', parseError.message);
          resolve(null);
        }
      } else {
        console.warn(`⚠️ EasyOCR failed with code ${code}`);
        resolve(null);
      }
    });
    
    python.on('error', (error) => {
      console.warn('⚠️ EasyOCR spawn error:', error.message);
      resolve(null);
    });
    
    // Shorter timeout for faster processing
    setTimeout(() => { 
      python.kill(); 
      console.log('⚠️ EasyOCR timeout');
      resolve(null); 
    }, 10000);
  });
};

/**
 * Optimized Tesseract for text extraction - NO PROGRESS LOGS
 */
const performTesseractOCR = async (filePaths, languages) => {
  let worker = null;
  let best = { text: '', confidence: 0, engine: 'Tesseract' };
  
  try {
    const availableLanguages = checkLanguageAvailability(languages);
    console.log(`✓ Using available languages: ${availableLanguages}`);

    worker = await Tesseract.createWorker(availableLanguages, 1, {
      logger: () => {}, // DISABLED ALL PROGRESS LOGS
      datapath: TESSDATA_PATH,
      tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
    });

    // Only try 2 rotations for speed
    const rotations = [0, 2];
    
    for (const file of filePaths.slice(0, 2)) { // Limit to 2 variants
      for (const angle of rotations) {
        try {
          let imgPath = file;
          
          if (angle !== 0) {
            const rotPath = file.replace(/\.png$/, `_r${angle}.png`);
            await sharp(file).rotate(angle, { background: '#ffffff' }).toFile(rotPath);
            imgPath = rotPath;
          }

          await worker.setParameters({
            tessedit_pageseg_mode: '6',
            tessedit_char_whitelist: '',
            preserve_interword_spaces: '1'
          });

          const { data } = await worker.recognize(imgPath);
          
          if (angle !== 0 && fs.existsSync(imgPath)) {
            fs.unlinkSync(imgPath);
          }

          const text = data.text.trim();
          console.log(`📝 Rotation ${angle}°: ${text.length} chars, confidence: ${data.confidence.toFixed(1)}`);
          
          if (text.length > 0 && data.confidence > best.confidence) {
            best = { 
              text, 
              confidence: data.confidence,
              engine: 'Tesseract'
            };
            
            // Early exit if we have high confidence
            if (data.confidence > 80 && text.length > 20) {
              console.log(`✅ High confidence result found`);
              return best;
            }
          }
        } catch (err) {
          console.warn(`⚠️ Rotation ${angle}° failed:`, err.message);
        }
      }
    }

    return best;
  } catch (error) {
    console.error('❌ Tesseract processing failed:', error.message);
    return best;
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
};

/**
 * MAIN EXTRACTION FUNCTION - INTELLIGENT TEXT DETECTION FIRST
 */
const extractText = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  const startTime = Date.now();
  const filePath = req.file.path;
  let processedFiles = [filePath];

  try {
    console.log('\n🚀 INTELLIGENT ANALYSIS: Text Detection First');

    // Check if tessdata path exists
    if (!fs.existsSync(TESSDATA_PATH)) {
      console.warn(`⚠️ Tessdata path not found: ${TESSDATA_PATH}`);
    }

    // 1. FAST TEXT DETECTION FIRST
    const textDetection = await detectTextPresence(filePath);
    console.log(`📊 Text Detection Result: ${textDetection.hasText ? 'TEXT FOUND' : 'NO TEXT'}`);
    console.log(`   - Text length: ${textDetection.textLength} chars`);
    console.log(`   - Confidence: ${textDetection.confidence.toFixed(1)}`);
    if (textDetection.sampleText) {
      console.log(`   - Sample: ${textDetection.sampleText}`);
    }

    // 2. Choose languages
    const selectedLang = req.body.language || 'all_languages';
    const langConfig = LANGUAGE_CONFIGS[selectedLang] || LANGUAGE_CONFIGS.all_languages;
    console.log(`🌐 Selected language: ${langConfig.name}`);

    let finalText = '';
    let ocrEngine = '';
    let confidence = 0;
    let objectResult = null;

    // 3. INTELLIGENT PROCESSING BASED ON TEXT DETECTION
    if (textDetection.hasText) {
      console.log('🎯 TEXT-HEAVY IMAGE: Focusing on OCR with object detection');
      
      // Text-heavy image: Run OCR first, then objects
      const [easyResult, tessResult] = await Promise.all([
        runEasyOCR(filePath, langConfig.easyocr),
        (async () => {
          const variants = await preprocessImageForText(filePath);
          processedFiles = [...variants];
          return await performTesseractOCR(processedFiles, langConfig.code);
        })()
      ]);

      // Get objects in parallel but with lower priority
      objectResult = await ObjectDetectionController.detectObjects(filePath);

      // Combine OCR results
      if (easyResult && easyResult.text && easyResult.text.trim().length > 0) {
        finalText = easyResult.text;
        ocrEngine = 'EasyOCR';
        confidence = easyResult.confidence || 70;
      } else if (tessResult && tessResult.text && tessResult.text.trim().length > 0) {
        finalText = tessResult.text;
        ocrEngine = tessResult.engine;
        confidence = tessResult.confidence;
      } else {
        finalText = 'Text detected but could not be extracted clearly.';
        ocrEngine = 'Detection Only';
        confidence = 0;
      }

    } else {
      console.log('🎯 IMAGE-ONLY CONTENT: Focusing on object detection');
      
      // Image-only content: Focus on object detection, minimal OCR
      const variants = await preprocessImageForObjects(filePath);
      processedFiles = [...variants];
      
      // Run object detection first, then quick OCR
      [objectResult] = await Promise.all([
        ObjectDetectionController.detectObjects(filePath, true), // Fast mode
        (async () => {
          const tessResult = await performTesseractOCR([filePath], 'eng');
          if (tessResult.text && tessResult.text.trim().length > 5) {
            finalText = tessResult.text;
            ocrEngine = tessResult.engine;
            confidence = tessResult.confidence;
          } else {
            finalText = 'No significant text detected in this image.';
            ocrEngine = 'None';
            confidence = 0;
          }
        })()
      ]);
    }

    // 4. Limit objects to top 4
    const limitedObjects = objectResult.objects.slice(0, 4);
    const limitedObjectResult = {
      ...objectResult,
      objects: limitedObjects,
      count: limitedObjects.length
    };

    // 5. Cleanup
    processedFiles.forEach(p => {
      try { 
        if (p !== filePath && fs.existsSync(p)) {
          fs.unlinkSync(p); 
        }
      } catch (e) {}
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // Enhanced response with analysis type
    const responseData = {
      message: textDetection.hasText ? 'Text-focused analysis completed' : 'Object-focused analysis completed',
      processingTime: `${elapsed}s`,
      languageUsed: langConfig.name,
      analysisType: textDetection.hasText ? 'text_heavy' : 'image_heavy',
      textDetection: {
        hasText: textDetection.hasText,
        textLength: textDetection.textLength,
        confidence: textDetection.confidence
      },
      ocr: {
        text: finalText,
        engine: ocrEngine,
        confidence: Math.round(confidence)
      },
      objects: {
        detected: limitedObjects,
        description: limitedObjectResult.description,
        engine: limitedObjectResult.engine,
        count: limitedObjects.length
      }
    };

    // Save to database
// Save to database
const userId = req.user?.id || null;

// Detect actual source language from extracted text
const detectedSourceLang = await detectActualLanguage(finalText);
const sourceLangName = LANGUAGE_CONFIGS[detectedSourceLang]?.name || detectedSourceLang;

connection.query(
  `INSERT INTO image_analysis 
   (user_id, filename, extracted_text, objects_json, image_description, 
    ocr_engine, detection_engine, processing_time, language_used, confidence_score, analysis_type) 
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    userId,
    req.file.originalname,
    finalText,
    JSON.stringify(limitedObjects),
    limitedObjectResult.description,
    ocrEngine,
    limitedObjectResult.engine,
    `${elapsed}s`,
    sourceLangName, // Use detected language name instead of "All Languages"
    confidence,
    textDetection.hasText ? 'text_heavy' : 'image_heavy'
  ],
  (err, results) => {
    if (!err) {
      console.log('✓ Saved analysis to database with ID:', results.insertId);
      
      // ✅ DUAL INSERTION WITH PROPER LANGUAGE DETECTION
      const translatorQuery = `
        INSERT INTO image_analysis_translator 
        (user_id, filename, extracted_text, translated_text, objects_json, 
         source_language, target_language, processing_time, confidence_score, analysis_type) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      connection.query(
        translatorQuery,
        [
          userId,                                    // user_id
          req.file.originalname,                     // filename  
          finalText,                                 // extracted_text
          '',                                        // translated_text (empty for now)
          JSON.stringify(limitedObjects),            // objects_json
          detectedSourceLang,                        // source_language (detected code: 'ko', 'ja', 'fr')
          'en',                                      // target_language (default to English)
          `${elapsed}s`,                             // processing_time
          confidence,                                // confidence_score
          textDetection.hasText ? 'text_heavy' : 'image_heavy' // analysis_type
        ],
        (translatorErr, translatorResults) => {
          if (translatorErr) {
            console.error('❌ Failed to save to image_analysis_translator:', translatorErr);
          } else {
            console.log('💾 Also saved to image_analysis_translator with ID:', translatorResults.insertId);
            console.log(`🌐 Source language detected: ${detectedSourceLang}`);
          }
        }
      );
      
    } else {
      console.error('Failed to save analysis:', err);
    }
  }
);
  } catch (err) {
    // Cleanup on error
    processedFiles.forEach(p => {
      try { 
        if (p !== filePath && fs.existsSync(p)) {
          fs.unlinkSync(p); 
        }
      } catch (e) {}
    });
    
    console.error('❌ INTELLIGENT ANALYSIS ERROR:', err.message);
    res.status(500).json({
      error: 'Analysis failed',
      details: err.message
    });
  }
};

module.exports = { extractText, LANGUAGE_CONFIGS };