// controllers/PictureToTextTranslatorController.js - FIXED VERSION WITH PROPER DATABASE INSERTIONS
const connection = require('../config/db');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const translatte = require('translatte');
const ObjectDetectionController = require('./ObjectDetectionController');

/**
 * Full language configurations matching your translator
 */
const LANGUAGE_CONFIGS = {
  // OCR Languages (Tesseract codes) to Translation Languages mapping
  afrikaans: { code: 'afr', translator: 'af' },
  albanian: { code: 'sqi', translator: 'sq' },
  amharic: { code: 'amh', translator: 'am' },
  arabic: { code: 'ara', translator: 'ar' },
  armenian: { code: 'hye', translator: 'hy' },
  azerbaijani: { code: 'aze', translator: 'az' },
  basque: { code: 'eus', translator: 'eu' },
  belarusian: { code: 'bel', translator: 'be' },
  bengali: { code: 'ben', translator: 'bn' },
  bosnian: { code: 'bos', translator: 'bs' },
  bulgarian: { code: 'bul', translator: 'bg' },
  burmese: { code: 'mya', translator: 'my' },
  catalan: { code: 'cat', translator: 'ca' },
  cebuano: { code: 'ceb', translator: 'ceb' },
  chichewa: { code: 'nya', translator: 'ny' },
  chinese_simp: { code: 'chi_sim', translator: 'zh-cn' },
  chinese_trad: { code: 'chi_tra', translator: 'zh-tw' },
  corsican: { code: 'cos', translator: 'co' },
  croatian: { code: 'hrv', translator: 'hr' },
  czech: { code: 'ces', translator: 'cs' },
  danish: { code: 'dan', translator: 'da' },
  dutch: { code: 'nld', translator: 'nl' },
  english: { code: 'eng', translator: 'en' },
  esperanto: { code: 'epo', translator: 'eo' },
  estonian: { code: 'est', translator: 'et' },
  filipino: { code: 'fil', translator: 'tl' },
  finnish: { code: 'fin', translator: 'fi' },
  french: { code: 'fra', translator: 'fr' },
  frisian: { code: 'fry', translator: 'fy' },
  galician: { code: 'glg', translator: 'gl' },
  georgian: { code: 'kat', translator: 'ka' },
  german: { code: 'deu', translator: 'de' },
  greek: { code: 'ell', translator: 'el' },
  gujarati: { code: 'guj', translator: 'gu' },
  haitian_creole: { code: 'hat', translator: 'ht' },
  hausa: { code: 'hau', translator: 'ha' },
  hawaiian: { code: 'haw', translator: 'haw' },
  hebrew: { code: 'heb', translator: 'iw' },
  hindi: { code: 'hin', translator: 'hi' },
  hmong: { code: 'hmn', translator: 'hmn' },
  hungarian: { code: 'hun', translator: 'hu' },
  icelandic: { code: 'isl', translator: 'is' },
  igbo: { code: 'ibo', translator: 'ig' },
  indonesian: { code: 'ind', translator: 'id' },
  irish: { code: 'gle', translator: 'ga' },
  italian: { code: 'ita', translator: 'it' },
  japanese: { code: 'jpn', translator: 'ja' },
  javanese: { code: 'jav', translator: 'jw' },
  kannada: { code: 'kan', translator: 'kn' },
  kazakh: { code: 'kaz', translator: 'kk' },
  khmer: { code: 'khm', translator: 'km' },
  kinyarwanda: { code: 'kin', translator: 'rw' },
  korean: { code: 'kor', translator: 'ko' },
  kurdish: { code: 'kur', translator: 'ku' },
  kyrgyz: { code: 'kir', translator: 'ky' },
  lao: { code: 'lao', translator: 'lo' },
  latin: { code: 'lat', translator: 'la' },
  latvian: { code: 'lav', translator: 'lv' },
  lithuanian: { code: 'lit', translator: 'lt' },
  luxembourgish: { code: 'ltz', translator: 'lb' },
  macedonian: { code: 'mkd', translator: 'mk' },
  malagasy: { code: 'mlg', translator: 'mg' },
  malay: { code: 'msa', translator: 'ms' },
  malayalam: { code: 'mal', translator: 'ml' },
  maltese: { code: 'mlt', translator: 'mt' },
  maori: { code: 'mri', translator: 'mi' },
  marathi: { code: 'mar', translator: 'mr' },
  mongolian: { code: 'mon', translator: 'mn' },
  nepali: { code: 'nep', translator: 'ne' },
  norwegian: { code: 'nor', translator: 'no' },
  odia: { code: 'ori', translator: 'or' },
  pashto: { code: 'pus', translator: 'ps' },
  persian: { code: 'fas', translator: 'fa' },
  polish: { code: 'pol', translator: 'pl' },
  portuguese: { code: 'por', translator: 'pt' },
  punjabi: { code: 'pan', translator: 'pa' },
  romanian: { code: 'ron', translator: 'ro' },
  russian: { code: 'rus', translator: 'ru' },
  samoan: { code: 'smo', translator: 'sm' },
  scots_gaelic: { code: 'gla', translator: 'gd' },
  serbian: { code: 'srp', translator: 'sr' },
  sesotho: { code: 'sot', translator: 'st' },
  shona: { code: 'sna', translator: 'sn' },
  sindhi: { code: 'snd', translator: 'sd' },
  sinhala: { code: 'sin', translator: 'si' },
  slovak: { code: 'slk', translator: 'sk' },
  slovenian: { code: 'slv', translator: 'sl' },
  somali: { code: 'som', translator: 'so' },
  spanish: { code: 'spa', translator: 'es' },
  sundanese: { code: 'sun', translator: 'su' },
  swahili: { code: 'swa', translator: 'sw' },
  swedish: { code: 'swe', translator: 'sv' },
  tajik: { code: 'tgk', translator: 'tg' },
  tamil: { code: 'tam', translator: 'ta' },
  tatar: { code: 'tat', translator: 'tt' },
  telugu: { code: 'tel', translator: 'te' },
  thai: { code: 'tha', translator: 'th' },
  turkish: { code: 'tur', translator: 'tr' },
  turkmen: { code: 'tuk', translator: 'tk' },
  ukrainian: { code: 'ukr', translator: 'uk' },
  urdu: { code: 'urd', translator: 'ur' },
  uyghur: { code: 'uig', translator: 'ug' },
  uzbek: { code: 'uzb', translator: 'uz' },
  vietnamese: { code: 'vie', translator: 'vi' },
  welsh: { code: 'cym', translator: 'cy' },
  xhosa: { code: 'xho', translator: 'xh' },
  yiddish: { code: 'yid', translator: 'yi' },
  yoruba: { code: 'yor', translator: 'yo' },
  zulu: { code: 'zul', translator: 'zu' },
  
  // ALL AVAILABLE LANGUAGES COMBINED FOR OCR
  all_languages: { 
    code: 'eng+spa+fra+deu+ita+por+nld+jpn+chi_sim+chi_tra+kor+rus+ara+hin',
    translator: 'en'
  }
};

/**
 * Custom tessdata path
 */
const TESSDATA_PATH = path.join(__dirname, '..', 'tessdata');

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
    }
  }
  
  return availableLanguages.join('+');
};

/**
 * Get OCR language code from translation language code
 */
const getOcrLanguageCode = (translationLangCode) => {
  // Find the language config that matches the translation code
  for (const [key, config] of Object.entries(LANGUAGE_CONFIGS)) {
    if (config.translator === translationLangCode && key !== 'all_languages') {
      return config.code;
    }
  }
  
  // Default to English if not found
  return 'eng';
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

    console.log(`✔ Generated ${variants.length - 1} text-optimized variants`);
    return variants;
  } catch (error) {
    console.warn('⚠️ Text preprocessing failed:', error.message);
    return [filePath];
  }
};

/**
 * OCR Text Extraction (same as your existing optimized version)
 */
const extractTextFromImage = async (filePath, languages) => {
  let worker = null;
  let best = { text: '', confidence: 0 };
  
  try {
    const availableLanguages = checkLanguageAvailability(languages);
    if (!availableLanguages) return best;

    worker = await Tesseract.createWorker(availableLanguages, 1, {
      logger: () => {},
      datapath: TESSDATA_PATH,
      tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
    });

    const rotations = [0, 2, -2, 5, -5, 10, -10];
    
    for (const angle of rotations) {
      try {
        let imgPath = filePath;
        if (angle !== 0) {
          const rotPath = filePath.replace(/\.png$/, `_r${angle}.png`);
          await sharp(filePath).rotate(angle, { background: '#ffffff' }).toFile(rotPath);
          imgPath = rotPath;
        }

        await worker.setParameters({
          tessedit_pageseg_mode: '6',
          preserve_interword_spaces: '1',
          textord_min_linesize: '2.0'
        });

        const { data } = await worker.recognize(imgPath);
        
        if (angle !== 0 && fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
        }

        const text = data.text.trim();
        if (text.length > 0 && data.confidence > best.confidence) {
          best = { text, confidence: data.confidence };
          if (data.confidence > 80 && text.length > 5) {
            return best;
          }
        }
      } catch (err) {}
    }

    return best;
  } finally {
    if (worker) await worker.terminate();
  }
};

/**
 * Detect language of extracted text
 */
const detectLanguage = async (text) => {
  try {
    if (!text || text.trim().length < 3) return 'unknown';
    
    const result = await translatte(text, { to: 'en' });
    return result.from.language.iso;
  } catch (error) {
    console.log('Language detection failed:', error.message);
    return 'unknown';
  }
};

/**
 * Translate text to target language
 */
const translateText = async (text, targetLang) => {
  try {
    if (!text || text.trim().length === 0) {
      return { translated: '', detected: 'unknown' };
    }

    const result = await translatte(text, { to: targetLang });
    return {
      translated: result.text,
      detected: result.from.language.iso
    };
  } catch (error) {
    console.log('Translation failed:', error.message);
    throw new Error('Translation service unavailable');
  }
};

/**
 * Main Controller: Extract + Detect Objects + Translate
 * ✅ FIXED: Proper database insertions using ONLY image_analysis_translator table
 */
const extractTranslateAndDetect = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  const startTime = Date.now();
  const filePath = req.file.path;
  const { targetLanguage = 'en' } = req.body;

  try {
    console.log('🚀 Starting OCR + Object Detection + Translation process...');
    console.log(`🎯 Target language: ${targetLanguage}`);

    // Step 1: Fast text detection to determine processing strategy
    console.log('🔍 Step 1: Detecting text presence...');
    const textDetection = await detectTextPresence(filePath);
    console.log(`📊 Text Detection: ${textDetection.hasText ? 'TEXT FOUND' : 'NO TEXT'}`);

    // Step 2: Run object detection in parallel with OCR setup
    console.log('🎯 Step 2: Starting object detection...');
    const objectDetectionPromise = ObjectDetectionController.detectObjects(filePath, !textDetection.hasText);

    // Step 3: Get OCR language and extract text
    const ocrLanguageCode = getOcrLanguageCode(targetLanguage);
    console.log(`🔤 Using OCR language: ${ocrLanguageCode}`);

    let ocrResult = { text: '', confidence: 0 };
    if (textDetection.hasText) {
      console.log('📖 Step 3: Extracting text from image...');
      // Use text-optimized preprocessing for text-heavy images
      const variants = await preprocessImageForText(filePath);
      ocrResult = await extractTextFromImage(variants[0], ocrLanguageCode); // Use first variant
      
      // Cleanup variants
      variants.forEach(p => {
        try { 
          if (p !== filePath && fs.existsSync(p)) {
            fs.unlinkSync(p); 
          }
        } catch (e) {}
      });
    } else {
      console.log('⏩ Skipping detailed OCR (no text detected)');
    }

    // Step 4: Wait for object detection to complete
    const objectResult = await objectDetectionPromise;
    console.log(`✅ Object detection completed: ${objectResult.objects.length} objects found`);

    // Step 5: Detect language and translate if text was extracted
    let translationResult = { translated: '', detected: 'unknown' };
    let detectedLang = 'unknown';
    
    if (ocrResult.text && ocrResult.text.trim().length > 0) {
      console.log('🔍 Step 4: Detecting source language...');
      detectedLang = await detectLanguage(ocrResult.text);
      console.log(`✅ Detected language: ${detectedLang}`);

      console.log('🌐 Step 5: Translating text...');
      translationResult = await translateText(ocrResult.text, targetLanguage);
    }

    // Step 6: Cleanup uploaded file
    fs.unlinkSync(filePath);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Complete analysis finished in ${elapsed}s`);

    // Prepare response data
    const responseData = {
      message: 'Image analysis completed successfully',
      processingTime: `${elapsed}s`,
      analysisType: textDetection.hasText ? 'text_heavy' : 'image_heavy',
      
      // OCR Results
      extractedText: ocrResult.text || '',
      detectedLanguage: translationResult.detected,
      targetLanguage: targetLanguage,
      confidence: ocrResult.confidence,
      
      // Translation Results
      translatedText: translationResult.translated || '',
      
      // Object Detection Results
      objects: {
        detected: objectResult.objects,
        description: objectResult.description,
        engine: objectResult.engine,
        count: objectResult.objects.length
      },
      
      // Text Detection Info
      textDetection: {
        hasText: textDetection.hasText,
        textLength: textDetection.textLength,
        confidence: textDetection.confidence
      },
      
      characters: {
        original: ocrResult.text ? ocrResult.text.length : 0,
        translated: translationResult.translated ? translationResult.translated.length : 0
      }
    };

// In the extractTranslateAndDetect function, modify the database insertion part:

// ✅ Step 7: Save to database using ONLY image_analysis_translator table
const userId = req.extractedUserId || null; // ✅ Enhanced user ID extraction

// Use Promise-based approach for better error handling
const saveToDatabase = () => {
  return new Promise((resolve, reject) => {
    // Insert into image_analysis_translator table
    const analysisQuery = `
      INSERT INTO image_analysis_translator 
      (user_id, filename, extracted_text, translated_text, objects_json, 
       source_language, target_language, processing_time, confidence_score, analysis_type) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    connection.query(
      analysisQuery,
      [
        userId, // ✅ Now properly checks multiple sources
        req.file.originalname,
        ocrResult.text || '',
        translationResult.translated || '',
        JSON.stringify(objectResult.objects || []),
        detectedLang,
        targetLanguage,
        `${elapsed}s`,
        ocrResult.confidence || 0,
        textDetection.hasText ? 'text_heavy' : 'image_heavy'
      ],
      (err, results) => {
        if (err) {
          console.error('❌ Failed to save to image_analysis_translator:', err);
          return reject(err);
        }
        
        console.log('💾 Saved to image_analysis_translator with ID:', results.insertId);
        console.log('👤 User ID used:', userId); // ✅ Log the user ID for debugging
        resolve();
      }
    );
  });
};

    // Execute database save (non-blocking)
    saveToDatabase().catch(err => {
      console.error('❌ Database save failed:', err);
      // Don't fail the request, just log the error
    });

    // Send response immediately (don't wait for database)
    res.json(responseData);

  } catch (error) {
    // Cleanup on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    console.error('❌ Processing failed:', error.message);
    res.status(500).json({
      error: 'OCR, object detection and translation process failed',
      details: error.message
    });
  }
};

/**
 * Get available languages for the frontend
 */
const getAvailableLanguages = async (req, res) => {
  try {
    const availableLanguages = [];
    
    for (const [key, config] of Object.entries(LANGUAGE_CONFIGS)) {
      if (key !== 'all_languages') {
        const trainedDataPath = path.join(TESSDATA_PATH, `${config.code}.traineddata`);
        if (fs.existsSync(trainedDataPath)) {
          availableLanguages.push({
            ocrCode: config.code,
            translationCode: config.translator,
            name: key.replace(/_/g, ' ')
          });
        }
      }
    }
    
    res.json({
      availableLanguages,
      total: availableLanguages.length
    });
  } catch (error) {
    console.error('Error getting available languages:', error);
    res.status(500).json({ error: 'Failed to get available languages' });
  }
};

module.exports = { 
  extractTranslateAndDetect,
  getAvailableLanguages 
};  