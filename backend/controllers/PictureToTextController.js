// PictureToTextController.js - FULLY FIXED FOR ALL LANGUAGES
const connection = require('../config/db');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const ObjectDetectionController = require('./ObjectDetectionController');

function extractUserId(req) {
    console.log('🔍 Extracting user ID from request...');
    
    // Method 1: Check request body (BEST for JSON requests) ✅
    if (req.body && req.body.userId) {
        const userId = parseInt(req.body.userId);
        if (!isNaN(userId)) {
            console.log('✅ User ID from request body:', userId);
            return userId;

    }
  }

  // Method 2: Check X-User-ID header (fallback)
  if (req.headers['x-user-id']) {
    const userId = parseInt(req.headers['x-user-id']);
    if (!isNaN(userId)) {
      console.log('✅ User ID from X-User-ID header:', userId);
      return userId;
    }
  }

  // Method 3: Check cookies
  if (req.cookies && req.cookies.userId) {
    const userId = parseInt(req.cookies.userId);
    if (!isNaN(userId)) {
      console.log('✅ User ID from cookie:', userId);
      return userId;
    }
  }

  console.log('⚠️ No user ID found in request');
  return null;
}
/**
/**
 * ENHANCED language configurations with proper script handling
 */
const LANGUAGE_CONFIGS = {
  // Asian Languages - HIGH PRIORITY
  korean: { 
    code: 'kor+eng', 
    easyocr: 'ko,en',
    name: 'Korean',
    script: 'cjk',
    resolution: 3000
  },
  japanese: { 
    code: 'jpn+eng', 
    easyocr: 'ja,en',
    name: 'Japanese', 
    script: 'cjk',
    resolution: 3000
  },
  chinese_simp: { 
    code: 'chi_sim+eng', 
    easyocr: 'ch_sim,en',
    name: 'Chinese Simplified',
    script: 'cjk',
    resolution: 3000
  },
  chinese_trad: { 
    code: 'chi_tra+eng', 
    easyocr: 'ch_tra,en',
    name: 'Chinese Traditional',
    script: 'cjk',
    resolution: 3000
  },
  
  // RTL Languages
  arabic: { 
    code: 'ara+eng', 
    easyocr: 'ar,en',
    name: 'Arabic',
    script: 'rtl',
    resolution: 2000
  },
  hebrew: { 
    code: 'heb+eng', 
    easyocr: 'he,en',
    name: 'Hebrew',
    script: 'rtl', 
    resolution: 2000
  },
  
  // Other complex scripts
  hindi: { 
    code: 'hin+eng', 
    easyocr: 'hi,en',
    name: 'Hindi',
    script: 'devanagari',
    resolution: 2500
  },
  thai: { 
    code: 'tha+eng', 
    easyocr: 'th,en',
    name: 'Thai',
    script: 'thai',
    resolution: 2500
  },

  // Default
  all_languages: { 
    code: 'eng+jpn+kor+chi_sim+chi_tra+ara+heb+hin+tha',
    easyocr: 'en,ja,ko,ch_sim,ch_tra,ar,he,hi,th',
    name: 'All Languages (Auto-detect)',
    script: 'mixed',
    resolution: 2800
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
      console.log(`✅ Language available: ${lang}`);
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
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: () => {},
      langPath: TESSDATA_PATH,
    });

    const { data } = await worker.recognize(filePath);
    await worker.terminate();
    
    const text = data.text.trim();
    const confidence = data.confidence;
    
    console.log(`📊 Text detection: ${text.length} chars, confidence: ${confidence.toFixed(1)}`);
    
    const hasText = text.length > 10 && confidence > 30;
    
    return {
      hasText,
      textLength: text.length,
      confidence: confidence,
      sampleText: text.substring(0, 100)
    };
    
  } catch (error) {
    console.warn('⚠️ Fast text detection failed:', error.message);
    return { hasText: false, textLength: 0, confidence: 0, sampleText: '' };
  }
};

const preprocessImageForText = async (filePath, language) => {
  const variants = [filePath];
  
  try {
    console.log(`🔧 Script-specific preprocessing for: ${languageConfig.name}`);
    
    const { script, resolution = 2400 } = languageConfig;

    // Base processing for all scripts
    const baseProcessed = filePath.replace(/\.[^/.]+$/, '_base.png');
    await sharp(filePath)
      .resize(resolution, resolution, { 
        fit: 'inside', 
        withoutEnlargement: false 
      })
      .toFile(baseProcessed);
    variants.push(baseProcessed);

    // Script-specific processing
    if (script === 'cjk') {
      // CJK Scripts - Need highest resolution and sharpening
      const cjkPath = filePath.replace(/\.[^/.]+$/, '_cjk.png');
      await sharp(filePath)
        .resize(3200, 3200, { fit: 'inside', withoutEnlargement: false })
        .linear(1.4, -(128 * 0.4)) // Higher contrast
        .sharpen({ 
          sigma: 1.5,
          m1: 1.2,
          m2: 0.8
        })
        .median(1) // Reduce noise while preserving edges
        .toFile(cjkPath);
      variants.push(cjkPath);
      
      // Additional CJK variant with different threshold
      const cjkBinary = filePath.replace(/\.[^/.]+$/, '_cjk_binary.png');
      await sharp(filePath)
        .resize(2800, 2800, { fit: 'inside', withoutEnlargement: false })
        .greyscale()
        .threshold(128, { 
          grayscale: true 
        })
        .toFile(cjkBinary);
      variants.push(cjkBinary);
    }
    else if (script === 'rtl') {
      // Arabic/Hebrew - Preserve connectivity
      const rtlPath = filePath.replace(/\.[^/.]+$/, '_rtl.png');
      await sharp(filePath)
        .resize(2200, 2200, { fit: 'inside', withoutEnlargement: false })
        .greyscale()
        .normalize()
        .linear(1.3, -(128 * 0.3))
        .toFile(rtlPath);
      variants.push(rtlPath);
    }
    else if (script === 'devanagari' || script === 'thai') {
      // Complex scripts with many curves and connections
      const scriptPath = filePath.replace(/\.[^/.]+$/, `_${script}.png`);
      await sharp(filePath)
        .resize(2600, 2600, { fit: 'inside', withoutEnlargement: false })
        .greyscale()
        .normalize()
        .linear(1.6, -(128 * 0.5))
        .sharpen({ sigma: 1.0 })
        .toFile(scriptPath);
      variants.push(scriptPath);
    }

    // Universal high-contrast fallback
    const contrastPath = filePath.replace(/\.[^/.]+$/, '_contrast.png');
    await sharp(filePath)
      .resize(2400, 2400, { fit: 'inside', withoutEnlargement: false })
      .greyscale()
      .normalize()
      .linear(2.0, -(128 * 0.7))
      .toFile(contrastPath);
    variants.push(contrastPath);

    console.log(`✓ Generated ${variants.length - 1} script-optimized variants`);
    return variants;
  } catch (error) {
    console.warn('⚠️ Script-specific preprocessing failed:', error.message);
    return [filePath];
  }
};

/**
 * Basic preprocessing for image-only content
 */
const preprocessImageForObjects = async (filePath) => {
  try {
    console.log('🔧 Basic preprocessing for object detection...');
    
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
 * Fast EasyOCR for text extraction - BEST FOR ASIAN LANGUAGES
 */
const runEasyOCR = (filePath, languages) => {
  return new Promise((resolve) => {
    const pythonScript = path.join(__dirname, '..', 'utils', 'easyocr_runner.py');
    
    if (!fs.existsSync(pythonScript)) {
      console.warn('⚠️ EasyOCR script not found');
      return resolve(null);
    }

    console.log(`🐍 Running EasyOCR with languages: ${languages}`);
    const python = spawn('python', [pythonScript, filePath, languages]);
    let output = '';
    let errorOutput = '';
    
    python.stdout.on('data', (data) => output += data.toString());
    python.stderr.on('data', (data) => {
      const msg = data.toString();
      errorOutput += msg;
      console.log(`[EasyOCR] ${msg.trim()}`);
    });
    
    python.on('close', (code) => {
      if (code === 0 && output.trim()) {
        try {
          const result = JSON.parse(output.trim());
          if (result.text && result.text.trim().length > 0) {
            console.log(`✅ EasyOCR SUCCESS: ${result.text.length} chars extracted`);
            console.log(`   Confidence: ${result.confidence}%`);
            console.log(`   Preview: ${result.text.substring(0, 100)}...`);
            resolve(result);
          } else {
            console.log('⚠️ EasyOCR: No text extracted');
            resolve(null);
          }
        } catch (parseError) {
          console.warn('⚠️ EasyOCR parse error:', parseError.message);
          console.log('Raw output:', output);
          resolve(null);
        }
      } else {
        console.warn(`⚠️ EasyOCR failed with code ${code}`);
        if (errorOutput) console.warn('Error:', errorOutput.substring(0, 200));
        resolve(null);
      }
    });
    
    python.on('error', (error) => {
      console.warn('⚠️ EasyOCR spawn error:', error.message);
      resolve(null);
    });
    
    // 20 second timeout for complex Asian scripts
    setTimeout(() => { 
      python.kill(); 
      console.log('⚠️ EasyOCR timeout (20s exceeded)');
      resolve(null); 
    }, 20000);
  });
};

const performTesseractOCR = async (filePaths, languages, languageConfig) => {
  let worker = null;
  let best = { text: "", confidence: 0, engine: "" };
  
  try {
    const availableLanguages = checkLanguageAvailability(languages);
    console.log("🔤 Tesseract using languages:", availableLanguages);

    // Detect script type from config
    const script = languageConfig?.script || 'latin';
    const isCJK = script === 'cjk';
    const isRTL = script === 'rtl';
    const isComplex = ['devanagari', 'thai'].includes(script);
    
    console.log(`📝 Script detection: ${script}`);

    worker = await Tesseract.createWorker(availableLanguages, 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`Tesseract progress: ${Math.round(m.progress * 100)}%`);
        }
      },
      langPath: TESSDATA_PATH,
    });

    // SCRIPT-SPECIFIC PARAMETERS - NO CHARACTER WHITELIST FOR NON-LATIN
    const params = {};
    
    if (isCJK) {
      // CJK parameters - most permissive
      params.tessedit_pageseg_mode = '6'; // Uniform block of text
      params.preserve_interword_spaces = '1';
      params.textord_min_linesize = '0.3';
      params.textord_tabvector_vertical_gap_fraction = '0.5';
      params.textord_max_noise_size = '10';
      params.edgemin = '0';
      // NO CHARACTER WHITELIST - ALLOW ALL UNICODE
    }
    else if (isRTL) {
      // RTL parameters
      params.tessedit_pageseg_mode = '5'; // Vertical text
      params.textord_max_noise_size = '8';
      params.textord_min_linesize = '2.5';
      params.preserve_interword_spaces = '1';
      // NO CHARACTER WHITELIST
    }
    else if (isComplex) {
      // Complex script parameters
      params.tessedit_pageseg_mode = '6';
      params.textord_min_linesize = '1.5';
      params.textord_max_noise_size = '7';
      params.preserve_interword_spaces = '1';
      // NO CHARACTER WHITELIST
    }
    else {
      // Latin scripts only - can use whitelist
      params.tessedit_pageseg_mode = '6';
      params.preserve_interword_spaces = '1';
      // Only use whitelist for pure English
      if (availableLanguages === 'eng') {
        params.tessedit_char_whitelist = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?;:\'"()-–— ';
      }
    }

    await worker.setParameters(params);
    console.log('✅ Tesseract parameters set for script:', script);

    // Rotation strategy based on script
    const rotations = isCJK ? [0] : [0, 2]; // Don't rotate CJK - it breaks character recognition
    
    for (const file of filePaths.slice(0, 3)) { // Try more variants for complex scripts
      for (const angle of rotations) {
        try {
          let imgPath = file;
          
          if (angle !== 0) {
            const rotPath = file.replace(/\.png$/, `_r${angle}.png`);
            await sharp(file).rotate(angle, { background: '#ffffff' }).toFile(rotPath);
            imgPath = rotPath;
          }

          console.log(`🔍 Recognizing: ${path.basename(imgPath)} (rotation: ${angle}°)`);
          const { data } = await worker.recognize(imgPath);
          
          if (angle !== 0 && fs.existsSync(imgPath)) {
            fs.unlinkSync(imgPath);
          }

          const text = data.text.trim();
          console.log(`   Result: ${text.length} chars, confidence: ${data.confidence.toFixed(1)}%`);
          
          if (text.length > 0) {
            console.log(`   Preview: ${text.substring(0, 100)}...`);
            
            // Check if text contains expected script characters
            if (isCJK && /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(text)) {
              console.log('   ✅ Contains CJK characters');
            }
            if (isRTL && /[\u0600-\u06ff]/.test(text)) {
              console.log('   ✅ Contains RTL characters');
            }
          }
          
          if (text.length > 0 && data.confidence > best.confidence) {
            best = { 
              text, 
              confidence: data.confidence,
              engine: 'Tesseract'
            };
            
            // Early exit for high confidence in target script
            const confidenceThreshold = isCJK ? 65 : 75;
            if (data.confidence > confidenceThreshold && text.length > 5) {
              console.log(`✅ High confidence result found - stopping early`);
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
 * MAIN EXTRACTION FUNCTION
 */
const extractText = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  const startTime = Date.now();
  const filePath = req.file.path;
  let processedFiles = [filePath];

  try {
    console.log('\n🚀 ========================================');
    console.log('🚀 STARTING IMAGE ANALYSIS');
    console.log('🚀 ========================================');
    console.log(`📁 File: ${req.file.originalname}`);
    console.log(`📊 Size: ${(req.file.size / 1024).toFixed(1)} KB`);

    // Check tessdata path
    if (!fs.existsSync(TESSDATA_PATH)) {
      console.error(`❌ Tessdata path not found: ${TESSDATA_PATH}`);
      return res.status(500).json({ error: 'Tessdata directory not found' });
    }

    // 1. FAST TEXT DETECTION
    const textDetection = await detectTextPresence(filePath);
    console.log(`\n📊 TEXT DETECTION: ${textDetection.hasText ? '✅ TEXT FOUND' : '❌ NO TEXT'}`);
    console.log(`   Length: ${textDetection.textLength} chars`);
    console.log(`   Confidence: ${textDetection.confidence.toFixed(1)}%`);

    // 2. Language selection
    const selectedLang = req.body.language || 'all_languages';
    const langConfig = LANGUAGE_CONFIGS[selectedLang] || LANGUAGE_CONFIGS.all_languages;
    console.log(`\n🌐 LANGUAGE: ${langConfig.name}`);
    console.log(`   Tesseract codes: ${langConfig.code}`);
    console.log(`   EasyOCR codes: ${langConfig.easyocr}`);

    let finalText = '';
    let ocrEngine = '';
    let confidence = 0;
    let objectResult = null;

    // 3. PROCESSING STRATEGY
    if (textDetection.hasText) {
      console.log('\n🎯 STRATEGY: Text-heavy image - Running dual OCR + Objects');
      
      // Preprocess for text
      const variants = await preprocessImageForText(filePath, langConfig.code);
      processedFiles = [...variants];
      
      console.log('\n🔄 Running parallel OCR (EasyOCR + Tesseract)...');
      
      // Run both OCR engines in parallel
      const [easyResult, tessResult] = await Promise.all([
        runEasyOCR(filePath, langConfig.easyocr),
        performTesseractOCR(processedFiles, langConfig.code, langConfig.name)
      ]);

      // Get objects (lower priority)
      console.log('\n🔍 Detecting objects...');
      objectResult = await ObjectDetectionController.detectObjects(filePath);

      // Choose best OCR result
      console.log('\n🏆 SELECTING BEST OCR RESULT:');
      console.log(`   EasyOCR: ${easyResult ? easyResult.text.length + ' chars, ' + easyResult.confidence + '%' : 'Failed'}`);
      console.log(`   Tesseract: ${tessResult.text.length} chars, ${tessResult.confidence.toFixed(1)}%`);
      
      if (easyResult && easyResult.text && easyResult.text.trim().length > 0) {
        // Prefer EasyOCR for Asian languages if confidence is decent
        const isAsianLang = ['ko', 'ja', 'ch_sim', 'ch_tra'].some(l => langConfig.easyocr.includes(l));
        if (isAsianLang || easyResult.confidence > tessResult.confidence) {
          finalText = easyResult.text;
          ocrEngine = 'EasyOCR';
          confidence = easyResult.confidence || 70;
          console.log(`   ✅ Selected: EasyOCR (better for Asian scripts)`);
        } else if (tessResult.text && tessResult.text.length > easyResult.text.length) {
          finalText = tessResult.text;
          ocrEngine = tessResult.engine;
          confidence = tessResult.confidence;
          console.log(`   ✅ Selected: Tesseract (more text found)`);
        } else {
          finalText = easyResult.text;
          ocrEngine = 'EasyOCR';
          confidence = easyResult.confidence || 70;
          console.log(`   ✅ Selected: EasyOCR`);
        }
      } else if (tessResult && tessResult.text && tessResult.text.trim().length > 0) {
        finalText = tessResult.text;
        ocrEngine = tessResult.engine;
        confidence = tessResult.confidence;
        console.log(`   ✅ Selected: Tesseract (only viable result)`);
      } else {
        finalText = 'Text detected but could not be extracted clearly.';
        ocrEngine = 'Detection Only';
        confidence = 0;
        console.log(`   ⚠️ Both engines failed`);
      }

    } else {
      console.log('\n🎯 STRATEGY: Image-only content - Focus on objects');
      
      const variants = await preprocessImageForObjects(filePath);
      processedFiles = [...variants];
      
      // Quick object detection
      [objectResult] = await Promise.all([
        ObjectDetectionController.detectObjects(filePath, true),
        (async () => {
          const tessResult = await performTesseractOCR([filePath], 'eng', 'English');
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

    // 4. Format results
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

    console.log('\n✅ ========================================');
    console.log('✅ ANALYSIS COMPLETE');
    console.log('✅ ========================================');
    console.log(`⏱️  Time: ${elapsed}s`);
    console.log(`📝 Extracted: ${finalText.length} chars`);
    console.log(`🎯 Engine: ${ocrEngine}`);
    console.log(`📊 Confidence: ${Math.round(confidence)}%`);
    console.log(`🔍 Objects: ${limitedObjects.length} detected\n`);

    const responseData = {
      message: textDetection.hasText ? 'Text extraction completed' : 'Object detection completed',
      processingTime: `${elapsed}s`,
      languageUsed: langConfig.name,
      analysisType: textDetection.hasText ? 'text_heavy' : 'image_heavy',
      filename: req.file.originalname,
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

 // In the extractText function, modify the database insertion part:

// Save to database
const userId = extractUserId(req);

console.log('👤 Attempting to save with user ID:', userId);

connection.query(
  `INSERT INTO image_analysis 
   (user_id, filename, extracted_text, objects_json, image_description, 
    ocr_engine, detection_engine, processing_time, language_used, confidence_score, analysis_type) 
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    userId, // ✅ Now properly extracted from headers
    req.file.originalname,
    finalText,
    JSON.stringify(limitedObjects),
    limitedObjectResult.description,
    ocrEngine,
    limitedObjectResult.engine,
    `${elapsed}s`,
    langConfig.name,
    confidence,
    "extraction"
  ],
  (err, results) => {
    if (!err) {
      console.log('💾 Saved to database with ID:', results.insertId);
      console.log('✅ User ID successfully saved:', userId);
    } else {
      console.error('❌ Database save failed:', err);
    }
  }
);

    res.json(responseData);

  } catch (err) {
    // Cleanup on error
    processedFiles.forEach(p => {
      try { 
        if (p !== filePath && fs.existsSync(p)) {
          fs.unlinkSync(p); 
        }
      } catch (e) {}
    });
    
    console.error('\n❌ ========================================');
    console.error('❌ EXTRACTION ERROR');
    console.error('❌ ========================================');
    console.error(err);
    
    res.status(500).json({
      error: 'Extraction failed',
      details: err.message
    });
  }
};

module.exports = { extractText, LANGUAGE_CONFIGS };