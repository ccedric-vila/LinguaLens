// js/pictureToTextTranslator.js - ENHANCED VERSION WITH EXTRACTION FEATURES
// ✅ List of all supported languages by Translatte
const supportedLanguages = {
    "af": "Afrikaans", "sq": "Albanian", "am": "Amharic", "ar": "Arabic", "hy": "Armenian",
    "az": "Azerbaijani", "eu": "Basque", "be": "Belarusian", "bn": "Bengali", "bs": "Bosnian",
    "bg": "Bulgarian", "ca": "Catalan", "ceb": "Cebuano", "ny": "Chichewa", "zh-cn": "Chinese (Simplified)",
    "zh-tw": "Chinese (Traditional)", "co": "Corsican", "hr": "Croatian", "cs": "Czech", "da": "Danish",
    "nl": "Dutch", "en": "English", "eo": "Esperanto", "et": "Estonian", "tl": "Filipino",
    "fi": "Finnish", "fr": "French", "fy": "Frisian", "gl": "Galician", "ka": "Georgian",
    "de": "German", "el": "Greek", "gu": "Gujarati", "ht": "Haitian Creole", "ha": "Hausa",
    "haw": "Hawaiian", "iw": "Hebrew", "hi": "Hindi", "hmn": "Hmong", "hu": "Hungarian",
    "is": "Icelandic", "ig": "Igbo", "id": "Indonesian", "ga": "Irish", "it": "Italian",
    "ja": "Japanese", "jw": "Javanese", "kn": "Kannada", "kk": "Kazakh", "km": "Khmer",
    "rw": "Kinyarwanda", "ko": "Korean", "ku": "Kurdish (Kurmanji)", "ky": "Kyrgyz", "lo": "Lao",
    "la": "Latin", "lv": "Latvian", "lt": "Lithuanian", "lb": "Luxembourgish", "mk": "Macedonian",
    "mg": "Malagasy", "ms": "Malay", "ml": "Malayalam", "mt": "Maltese", "mi": "Maori",
    "mr": "Marathi", "mn": "Mongolian", "my": "Myanmar (Burmese)", "ne": "Nepali", "no": "Norwegian",
    "or": "Odia", "ps": "Pashto", "fa": "Persian", "pl": "Polish", "pt": "Portuguese",
    "pa": "Punjabi", "ro": "Romanian", "ru": "Russian", "sm": "Samoan", "gd": "Scots Gaelic",
    "sr": "Serbian", "st": "Sesotho", "sn": "Shona", "sd": "Sindhi", "si": "Sinhala",
    "sk": "Slovak", "sl": "Slovenian", "so": "Somali", "es": "Spanish", "su": "Sundanese",
    "sw": "Swahili", "sv": "Swedish", "tg": "Tajik", "ta": "Tamil", "tt": "Tatar",
    "te": "Telugu", "th": "Thai", "tr": "Turkish", "tk": "Turkmen", "uk": "Ukrainian",
    "ur": "Urdu", "ug": "Uyghur", "uz": "Uzbek", "vi": "Vietnamese", "cy": "Welsh",
    "xh": "Xhosa", "yi": "Yiddish", "yo": "Yoruba", "zu": "Zulu"
};

// ✅ Country data mapping
const languageToCountries = {
    "en": ["US", "GB", "CA", "AU", "NZ", "IE", "PH"],
    "es": ["ES", "MX", "AR", "CO", "PE", "CL", "VE"],
    "fr": ["FR", "CA", "BE", "CH", "SN", "CI"],
    "de": ["DE", "AT", "CH", "LU", "LI"],
    "pt": ["PT", "BR", "AO", "MZ"],
    "it": ["IT", "CH", "SM", "VA"],
    "ru": ["RU", "BY", "KZ", "KG"],
    "zh-cn": ["CN"],
    "zh-tw": ["TW"],
    "ja": ["JP"],
    "ko": ["KR"],
    "ar": ["SA", "EG", "AE", "MA", "IQ"],
    "hi": ["IN"],
    "nl": ["NL", "BE", "SR"],
    "tr": ["TR", "CY"],
    "vi": ["VN"],
    "th": ["TH"],
    "pl": ["PL"],
    "uk": ["UA"],
    "cs": ["CZ"],
    "el": ["GR", "CY"],
    "he": ["IL"],
    "sv": ["SE", "FI"],
    "da": ["DK", "GL"],
    "fi": ["FI"],
    "no": ["NO"],
    "hu": ["HU"],
    "ro": ["RO", "MD"],
    "tl": ["PH"],
    "fil": ["PH"]
};

// DOM Elements
let langSelect, extractedResult, translatedResult, objectsResult;
let processingTime, languageInfo, confidenceInfo, objectsInfo, submitBtn;
let arrow, imageInput, imagePreview, previewImage, removePreviewBtn;
let copyExtractedBtn, copyTranslatedBtn, copyObjectsBtn;

// ✅ ADDED: Extraction-specific elements from picturetotext.js
let uploadArea, selectImageBtn, uploadBtn, languageSelect;
let statusText, timeText, engineText, languageText, objectsCount;
let textResult, objectsGrid, objectsDescription, combinedResult;
let copyTextBtn, copyAllBtn;
let currentAnalysisData = null;

// Panel state management
let leftPanelState = {
    objects: false,
    grammar: false,
    summary: false
};

// Grammar system
let currentGrammarSuggestions = [];
let lastGrammarRequest = 0;
const GRAMMAR_RATE_LIMIT = 3000;

// Bookmark functionality
let bookmarkedLanguages = new Set();

// Definition functionality
let lastDefinitionRequest = 0;
const DEFINITION_RATE_LIMIT = 2000;
let currentSelectedWord = null;
let puterAIAvailable = false;

// Country info functionality
let lastCountryRequest = 0;
const COUNTRY_RATE_LIMIT = 3000;

// ✅ ADDED: Initialize button state from picturetotext.js
function initializeButtonState() {
    if (uploadBtn) {
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Analyze Image';
    }
}

// ✅ ADDED: Select Image button - Opens file explorer
function setupSelectImageButton() {
    if (selectImageBtn && imageInput) {
        selectImageBtn.addEventListener('click', () => {
            imageInput.click();
        });
    }
}

// ✅ ADDED: Upload area click handler - Also opens file explorer
function setupUploadArea() {
    if (uploadArea) {
        uploadArea.addEventListener('click', () => {
            if (imageInput) imageInput.click();
        });

        // Drag and drop functionality
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            if (e.dataTransfer.files.length) {
                if (imageInput) imageInput.files = e.dataTransfer.files;
                handleFileSelect();
            }
        });
    }
}

// ✅ FIXED: File input change handler with proper button enabling
function handleFileSelect() {
    if (imageInput && imageInput.files.length > 0) {
        const file = imageInput.files[0];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file (JPEG, PNG, etc.).');
            resetFileInput();
            return;
        }
        
        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB.');
            resetFileInput();
            return;
        }
        
        // Show preview and enable button
        const reader = new FileReader();
        reader.onload = function(e) {
            if (previewImage) {
                previewImage.src = e.target.result;
                previewImage.style.display = 'block';
            }
            
            // ✅ FIXED: Enable upload button immediately when image is selected
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Analyze Image';
                console.log('✅ Upload button enabled - ready to analyze');
            }
            
            // Show image preview container
            if (imagePreview) {
                imagePreview.style.display = 'block';
            }
            
            // Update upload area text
            const uploadText = document.querySelector('.upload-text');
            const uploadSubtext = document.querySelector('.upload-subtext');
            
            if (uploadText) uploadText.textContent = file.name;
            if (uploadSubtext) uploadSubtext.textContent = `Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
        };
        reader.readAsDataURL(file);
    } else {
        console.log('No file selected');
    }
}
// ✅ ADD: Proper file input change listener setup
function setupFileInputListener() {
    if (imageInput) {
        imageInput.addEventListener('change', handleFileSelect);
        console.log('File input listener set up');
    }
}
// ✅ ADDED: Reset file input function from picturetotext.js
function resetFileInput() {
    if (imageInput) imageInput.value = '';
    if (uploadBtn) {
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Analyze Image';
    }
    if (previewImage) previewImage.style.display = 'none';
    
    const uploadText = document.querySelector('.upload-text');
    const uploadSubtext = document.querySelector('.upload-subtext');
    
    if (uploadText) uploadText.textContent = 'Drop your image here or click to browse';
    if (uploadSubtext) uploadSubtext.textContent = 'Supports JPG, PNG, GIF • Max 10MB';
}

// ✅ FIXED: Use proven extraction endpoint and separate extraction/translation
async function handleUpload() {
  if (!imageInput || !imageInput.files.length) {
    alert('Please select an image first.');
    return;
  }

  // Disable button during upload
  if (uploadBtn) {
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Processing...';
  }

  // Reset UI - SEPARATE CONTAINERS
  resetResults();
  showProcessing(true);
  
  // ✅ CLEAR translation container and disable language dropdown
  if (translatedResult) translatedResult.textContent = 'Select a language to translate...';
  if (langSelect) langSelect.disabled = true;
  if (copyTranslatedBtn) copyTranslatedBtn.disabled = true;

  const formData = new FormData();
  formData.append('image', imageInput.files[0]);
  
  // Get selected language for OCR (not translation)
  const selectedLanguage = languageSelect ? languageSelect.value : 'all_languages';
  formData.append('language', selectedLanguage);

  const startTime = Date.now();

  try {
    if (statusText) statusText.textContent = 'Uploading image...';
    if (languageText && languageSelect) {
      languageText.textContent = languageSelect.options[languageSelect.selectedIndex].text;
    }
    
    // ✅ STEP 1: Use PROVEN extraction endpoint (from picturetotext.js)
    const response = await fetch('http://localhost:3000/api/picturetotext/upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!response.ok) {
      throw new Error(data.error || `Upload failed: ${response.status}`);
    }

    // Store analysis data
    currentAnalysisData = data;
    
    // Update processing info
    if (timeText) timeText.textContent = `${elapsed}s`;
    if (engineText) engineText.textContent = data.ocr?.engine || 'Unknown';
    if (languageText) languageText.textContent = data.languageUsed || selectedLanguage;
    if (objectsCount) objectsCount.textContent = data.objects?.count || 0;
    if (statusText) statusText.textContent = 'Extraction completed successfully';
    
    // ✅ STEP 2: Display extraction results ONLY (no translation)
    displayExtractionResults(data);
    
    // ✅ STEP 3: Enable language dropdown for translation
    if (langSelect) {
      langSelect.disabled = false;
      langSelect.style.opacity = '1';
    }
    console.log('✅ Extraction complete - Language dropdown enabled for translation');
    
  } catch (error) {
    console.error('Upload error:', error);
    if (statusText) statusText.textContent = 'Extraction failed';
    if (timeText) timeText.textContent = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
    
    let errorMessage = `Error: ${error.message}\n\n`;
    
    if (error.message.includes('Failed to fetch')) {
      errorMessage += 'Cannot connect to server. Make sure the backend is running on port 3000.';
    } else if (error.message.includes('404')) {
      errorMessage += 'Server endpoint not found. Check your API routes.';
    } else {
      errorMessage += 'Please try again with a different image.';
    }
    
    if (textResult) textResult.textContent = errorMessage;
    if (translatedResult) translatedResult.textContent = 'Translation unavailable';
    
    // Show error in all result areas
    if (objectsGrid) objectsGrid.innerHTML = '<div class="object-card">Error during analysis</div>';
    if (objectsDescription) objectsDescription.textContent = 'Analysis failed - check server connection';
    if (combinedResult) combinedResult.textContent = errorMessage;
    
  } finally {
    // Re-enable upload button
    setTimeout(() => {
      if (uploadBtn) {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Analyze Again';
      }
    }, 1000);
  }
}

// ✅ ADD: Automatic translation function (from translator.js)
async function translateTextManually(text, targetLang) {
    if (!text || text.trim().length === 0) {
        return { translated: '', detected: 'unknown', success: false };
    }

    try {
        console.log('🌍 Manual translation to:', targetLang);
        
        // Use the translator endpoint directly
        const response = await fetch('http://localhost:3000/translator/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                text: text, 
                to: targetLang 
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        console.log('✅ Manual translation successful');
        return {
            translated: data.translated || data.text || text,
            detected: data.detected || 'unknown',
            success: true
        };
    } catch (err) {
        console.error('❌ Manual translation failed:', err);
        return {
            translated: text,
            detected: 'unknown',
            error: err.message,
            success: false
        };
    }
}
// ✅ FIXED: Reset both containers separately
function resetResults() {
    if (textResult) textResult.textContent = 'Processing... Please wait.';
    if (translatedResult) translatedResult.textContent = 'Waiting for extraction...';
    if (objectsGrid) objectsGrid.innerHTML = '';
    if (objectsDescription) objectsDescription.textContent = '';
    if (combinedResult) combinedResult.textContent = 'Processing...';
    if (copyTextBtn) copyTextBtn.disabled = true;
    if (copyTranslatedBtn) copyTranslatedBtn.disabled = true;
    if (copyAllBtn) copyAllBtn.disabled = true;
    currentAnalysisData = null;
    
    // ✅ Disable language dropdown until extraction completes
    if (langSelect) {
        langSelect.disabled = true;
        langSelect.style.opacity = '0.6';
    }
}

// ✅ ADDED: Show processing function from picturetotext.js
function showProcessing(show) {
    const processingInfo = document.getElementById('processingInfo');
    if (processingInfo) {
        processingInfo.style.display = show ? 'block' : 'none';
    }
    if (show) {
        if (statusText) statusText.textContent = 'Processing...';
        if (timeText) timeText.textContent = '-';
        if (engineText) engineText.textContent = '-';
        if (languageText) languageText.textContent = '-';
        if (objectsCount) objectsCount.textContent = '-';
    }
}

// ✅ FIXED: Only display extraction results, no translation
// ✅ FIXED: Only display extraction results, no translation
function displayExtractionResults(data) {
    // Enable copy buttons for extraction only
    if (copyTextBtn) copyTextBtn.disabled = false;
    if (copyAllBtn) copyAllBtn.disabled = false;
    
    // ✅ ONLY display text results in extraction containers
    let extractedText = '';
    if (data.ocr?.text && data.ocr.text.trim().length > 0) {
        extractedText = data.ocr.text;
        if (textResult) textResult.textContent = extractedText;
    } else {
        extractedText = 'No text could be extracted from this image.';
        if (textResult) textResult.textContent = extractedText;
    }
    
    // ✅ ALSO populate extractedResult for backward compatibility
    if (extractedResult) {
        extractedResult.textContent = extractedText;
    }
    
    // Display object results (limited to 4)
    displayExtractionObjects(data.objects);
    
    // Display combined results
    displayCombinedResults(data);
    
    // Switch to combined view by default
    switchTab('combined');
    
    // ✅ KEEP translation container separate but show ready message
    if (translatedResult) {
        translatedResult.textContent = 'Select a language to translate...';
    }
    
    console.log('✅ Extraction results displayed, ready for translation');
    console.log('📝 Extracted text length:', extractedText.length);
}

// ✅ ADDED: Display extraction objects function from picturetotext.js
function displayExtractionObjects(objectsData) {
    if (!objectsGrid) return;
    
    if (!objectsData || objectsData.count === 0) {
        objectsGrid.innerHTML = '<div class="object-card">No objects detected</div>';
        if (objectsDescription) {
            objectsDescription.textContent = 'No prominent objects were detected in this image.';
        }
        return;
    }
    
    // Set description
    if (objectsDescription) {
        objectsDescription.textContent = objectsData.description;
    }
    
    // Clear previous objects
    objectsGrid.innerHTML = '';
    
    // Add object cards (limited to 4)
    objectsData.detected.slice(0, 4).forEach(obj => {
        const confidencePercent = Math.round(obj.confidence * 100);
        const objectCard = document.createElement('div');
        objectCard.className = 'object-card';
        objectCard.innerHTML = `
            <div class="object-name">${obj.name}</div>
            <div class="object-confidence">${confidencePercent}% confidence</div>
        `;
        objectsGrid.appendChild(objectCard);
    });
}

// ✅ ADDED: Display combined results function from picturetotext.js
function displayCombinedResults(data) {
    if (!combinedResult) return;
    
    let combinedText = '';
    
    // Add processing info
    combinedText += `Processing Time: ${data.processingTime}\n`;
    combinedText += `OCR Engine: ${data.ocr?.engine || 'Unknown'}\n`;
    combinedText += `Language: ${data.languageUsed || 'Auto-detect'}\n`;
    combinedText += `Confidence: ${data.ocr?.confidence ? Math.round(data.ocr.confidence) + '%' : 'N/A'}\n\n`;
    
    // Add object detection results (limited to 4)
    if (data.objects?.count > 0) {
        combinedText += `IMAGE CONTENT:\n`;
        combinedText += `${data.objects.description}\n\n`;
        
        combinedText += `DETECTED OBJECTS (Top ${Math.min(data.objects.count, 4)}):\n`;
        data.objects.detected.slice(0, 4).forEach(obj => {
            const confidencePercent = Math.round(obj.confidence * 100);
            combinedText += `- ${obj.name} ${confidencePercent}% confidence\n`;
        });
        combinedText += `\n`;
    } else {
        combinedText += `IMAGE CONTENT:\nNo objects detected\n\n`;
    }
    
    // Add extracted text
    combinedText += `EXTRACTED TEXT:\n`;
    if (data.ocr?.text && data.ocr.text.trim().length > 0) {
        combinedText += data.ocr.text;
    } else {
        combinedText += 'No text could be extracted from this image.';
    }
    
    combinedResult.textContent = combinedText;
}

// ✅ ADDED: Tab switching function from picturetotext.js
function switchTab(tabName) {
    // Update tab active states
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Activate selected tab
    const activeTab = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    const tabContent = document.getElementById(tabName + 'Tab');
    if (tabContent) tabContent.classList.add('active');
}

// ✅ ADDED: Copy text functionality from picturetotext.js
function setupExtractionCopyButtons() {
    if (copyTextBtn) {
        copyTextBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(textResult.textContent);
                showCopyFeedback(copyTextBtn);
            } catch (err) {
                alert('Failed to copy text to clipboard');
            }
        });
    }

    if (copyAllBtn) {
        copyAllBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(combinedResult.textContent);
                showCopyFeedback(copyAllBtn);
            } catch (err) {
                alert('Failed to copy text to clipboard');
            }
        });
    }
}

// ✅ ADDED: Show copy feedback function from picturetotext.js
function showCopyFeedback(button) {
    const originalText = button.innerHTML;
    button.classList.add('copy-success');
    button.innerHTML = '✅ Copied!';
    
    setTimeout(() => {
        button.classList.remove('copy-success');
        button.innerHTML = originalText;
    }, 2000);
}

// ✅ Load bookmarked languages from localStorage
function loadBookmarkedLanguages() {
    const saved = localStorage.getItem('bookmarkedLanguages');
    if (saved) {
        try {
            const bookmarks = JSON.parse(saved);
            bookmarkedLanguages = new Set(bookmarks);
            console.log('Loaded bookmarked languages:', Array.from(bookmarkedLanguages));
        } catch (e) {
            console.error('Error loading bookmarks:', e);
            bookmarkedLanguages = new Set();
        }
    }
}

// ✅ Save bookmarked languages to localStorage
function saveBookmarkedLanguages() {
    localStorage.setItem('bookmarkedLanguages', JSON.stringify(Array.from(bookmarkedLanguages)));
}

// ✅ Create custom dropdown with star icons AND AUTO-DETECT OPTION
// ✅ Create custom dropdown with star icons AND ENGLISH AS DEFAULT
function createCustomDropdown() {
    if (!langSelect) return;
    
    const currentSelection = langSelect.value;
    langSelect.innerHTML = '';
    
    // Add English as default option first
    const englishOption = document.createElement('option');
    englishOption.value = 'en';
    englishOption.textContent = '🇺🇸 English';
    englishOption.setAttribute('data-bookmarked', 'false');
    langSelect.appendChild(englishOption);
    
    const separator = document.createElement('option');
    separator.disabled = true;
    separator.textContent = '────────────';
    langSelect.appendChild(separator);
    
    const bookmarkedLangs = [];
    const normalLangs = [];
    
    Object.entries(supportedLanguages).forEach(([code, name]) => {
        // Skip English since we already added it as default
        if (code === 'en') return;
        
        if (bookmarkedLanguages.has(code)) {
            bookmarkedLangs.push({ code, name });
        } else {
            normalLangs.push({ code, name });
        }
    });
    
    // Add bookmarked languages first
    bookmarkedLangs.forEach(({ code, name }) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = `⭐ ${name}`;
        option.setAttribute('data-bookmarked', 'true');
        langSelect.appendChild(option);
    });
    
    // Add separator if there are bookmarks and normal languages
    if (bookmarkedLangs.length > 0 && normalLangs.length > 0) {
        const separator2 = document.createElement('option');
        separator2.disabled = true;
        separator2.textContent = '────────────';
        langSelect.appendChild(separator2);
    }
    
    // Add normal languages
    normalLangs.forEach(({ code, name }) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = name;
        option.setAttribute('data-bookmarked', 'false');
        langSelect.appendChild(option);
    });
    
    // Set default to English
    langSelect.value = 'en';
}
// ✅ Toggle bookmark for a language
function toggleBookmark(langCode) {
    const wasBookmarked = bookmarkedLanguages.has(langCode);
    
    if (wasBookmarked) {
        bookmarkedLanguages.delete(langCode);
        console.log('Unbookmarked:', langCode);
    } else {
        bookmarkedLanguages.add(langCode);
        console.log('Bookmarked:', langCode);
    }
    
    saveBookmarkedLanguages();
    createCustomDropdown();
    
    showBookmarkFeedback(langCode, !wasBookmarked);
}

// ✅ Show bookmark feedback with modern styling
function showBookmarkFeedback(langCode, wasBookmarked) {
    const langName = supportedLanguages[langCode];
    const message = wasBookmarked ? `⭐ ${langName} bookmarked!` : `❌ ${langName} unbookmarked!`;
    
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.style.cssText = `
        position: fixed;
        top: 80px;
        right: 30px;
        background: ${wasBookmarked ? 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)' : 'linear-gradient(135deg, #e53e3e 0%, #c62828 100%)'};
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        z-index: 10000;
        font-size: 15px;
        font-weight: 600;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        animation: slideInRight 0.4s ease-out;
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.style.animation = 'slideOutRight 0.4s ease-out';
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 400);
    }, 2000);
}

// ✅ Add right-click context menu for bookmarking
function setupLanguageSelectContextMenu() {
    if (!langSelect) return;
    
    langSelect.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const selectedLang = langSelect.value;
        if (selectedLang && selectedLang !== 'auto') {
            toggleBookmark(selectedLang);
        }
    });
}

// ✅ Initialize DOM elements - ENHANCED WITH EXTRACTION ELEMENTS
function initializeDOMElements() {
    // Translator elements
    langSelect = document.getElementById('languageSelect');
    extractedResult = document.getElementById('extractedResult');
    translatedResult = document.getElementById('translatedResult');
    objectsResult = document.getElementById('objectsResult');
    processingTime = document.getElementById('processingTime');
    languageInfo = document.getElementById('languageInfo');
    confidenceInfo = document.getElementById('confidenceInfo');
    objectsInfo = document.getElementById('objectsInfo');
    submitBtn = document.getElementById('submitBtn');
    
    // Arrow and file input
    arrow = document.getElementById('arrow');
    imageInput = document.getElementById('imageInput');
    
    // Image preview elements
    imagePreview = document.getElementById('imagePreview');
    previewImage = document.getElementById('previewImage');
    removePreviewBtn = document.getElementById('removePreview');
    
    // Copy button elements
    copyExtractedBtn = document.getElementById('copyExtractedBtn');
    copyTranslatedBtn = document.getElementById('copyTranslatedBtn');
    copyObjectsBtn = document.getElementById('copyObjectsBtn');

    // ✅ ADDED: Extraction-specific elements from picturetotext.js
    uploadArea = document.getElementById('uploadArea');
    selectImageBtn = document.getElementById('selectImageBtn');
    uploadBtn = document.getElementById('uploadBtn');
    // languageSelect = document.getElementById('languageSelect'); // Note: This might conflict with langSelect
    
    statusText = document.getElementById('statusText');
    timeText = document.getElementById('timeText');
    engineText = document.getElementById('engineText');
    languageText = document.getElementById('languageText');
    objectsCount = document.getElementById('objectsCount');
    
    textResult = document.getElementById('textResult');
    objectsGrid = document.getElementById('objectsGrid');
    objectsDescription = document.getElementById('objectsDescription');
    combinedResult = document.getElementById('combinedResult');
    
    copyTextBtn = document.getElementById('copyTextBtn');
    copyAllBtn = document.getElementById('copyAllBtn');

    console.log('DOM Elements:', {
        // Translator elements
        arrow: !!arrow,
        imageInput: !!imageInput,
        langSelect: !!langSelect,
        submitBtn: !!submitBtn,
        imagePreview: !!imagePreview,
        previewImage: !!previewImage,
        copyExtractedBtn: !!copyExtractedBtn,
        copyTranslatedBtn: !!copyTranslatedBtn,
        copyObjectsBtn: !!copyObjectsBtn,
        
        // Extraction elements
        uploadArea: !!uploadArea,
        selectImageBtn: !!selectImageBtn,
        uploadBtn: !!uploadBtn,
        statusText: !!statusText,
        timeText: !!timeText,
        engineText: !!engineText,
        languageText: !!languageText,
        objectsCount: !!objectsCount,
        textResult: !!textResult,
        objectsGrid: !!objectsGrid,
        objectsDescription: !!objectsDescription,
        combinedResult: !!combinedResult,
        copyTextBtn: !!copyTextBtn,
        copyAllBtn: !!copyAllBtn
    });
}

// ✅ Image preview functionality
function setupImagePreview() {
    if (!imageInput || !imagePreview || !previewImage || !removePreviewBtn) return;
    
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImage.src = e.target.result;
                imagePreview.style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    });
    
    // Remove preview functionality
    removePreviewBtn.addEventListener('click', function() {
        imageInput.value = '';
        imagePreview.style.display = 'none';
        arrow.classList.remove('selected');
    });
}

// ✅ Copy button functionality - ENHANCED WITH EXTRACTION BUTTONS
function setupCopyButtons() {
    // Translator copy buttons
    if (copyExtractedBtn) {
        copyExtractedBtn.addEventListener('click', () => handleCopyClick(extractedResult, copyExtractedBtn));
    }
    if (copyTranslatedBtn) {
        copyTranslatedBtn.addEventListener('click', () => handleCopyClick(translatedResult, copyTranslatedBtn));
    }
    if (copyObjectsBtn) {
        copyObjectsBtn.addEventListener('click', () => handleCopyClick(objectsResult, copyObjectsBtn));
    }
    
    // ✅ ADDED: Extraction copy buttons
    setupExtractionCopyButtons();
}

function handleCopyClick(resultElement, copyButton) {
    try {
        const textToCopy = resultElement.textContent;
        
        // Don't copy if it's placeholder or empty
        if (!textToCopy || 
            textToCopy.includes('will appear here') || 
            textToCopy.includes('Processing...') ||
            textToCopy.includes('Waiting for') ||
            textToCopy.includes('No text') ||
            textToCopy.includes('Extracted text will appear here') ||
            textToCopy.includes('Translated text will appear here') ||
            textToCopy.includes('Detected objects will appear here')) {
            return;
        }

        // Modern approach
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                showCopySuccess(copyButton);
            }).catch(err => {
                console.error('Clipboard API failed:', err);
                useFallbackCopy(textToCopy, copyButton);
            });
        } else {
            // Fallback for older browsers
            useFallbackCopy(textToCopy, copyButton);
        }
        
    } catch (err) {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy text to clipboard');
    }
}

function useFallbackCopy(text, copyButton) {
    try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
            showCopySuccess(copyButton);
        } else {
            throw new Error('Fallback copy failed');
        }
    } catch (err) {
        console.error('Fallback copy failed:', err);
        alert('Failed to copy text to clipboard');
    }
}


function showCopySuccess(copyButton) {
    const originalText = copyButton.innerHTML;
    copyButton.classList.add('copy-success');
    copyButton.innerHTML = '📋 Copied!';
    
    // Reset after 2 seconds
    setTimeout(() => {
        copyButton.classList.remove('copy-success');
        copyButton.innerHTML = originalText;
    }, 2000);
}

// ✅ Panel Control System
function initPanelControls() {
    const objectsToggle = document.getElementById('toggleObjects');
    const grammarToggle = document.getElementById('toggleGrammar');
    const summaryToggle = document.getElementById('toggleSummary');
    
    if (objectsToggle) {
        objectsToggle.addEventListener('click', () => {
            toggleLeftPanel('objects');
        });
    }
    
    if (grammarToggle) {
        grammarToggle.addEventListener('click', () => {
            toggleLeftPanel('grammar');
        });
    }
    
    if (summaryToggle) {
        summaryToggle.addEventListener('click', () => {
            toggleLeftPanel('summary');
        });
    }
    
    // Initialize grammar system
    initGrammarSystem();
}

function toggleLeftPanel(panelType) {
    const panel = document.getElementById(panelType + 'Panel');
    const toggleBtn = document.getElementById('toggle' + panelType.charAt(0).toUpperCase() + panelType.slice(1));
    
    if (!panel || !toggleBtn) return;
    
    leftPanelState[panelType] = !leftPanelState[panelType];
    
    if (leftPanelState[panelType]) {
        panel.classList.add('active');
        toggleBtn.classList.add('active');
        
        // Load content if needed
        if (panelType === 'grammar' && translatedResult.textContent && !translatedResult.textContent.includes('Translated text will appear here...')) {
            checkGrammar(translatedResult.textContent, langSelect.value);
        }
    } else {
        panel.classList.remove('active');
        toggleBtn.classList.remove('active');
    }
}

// ✅ Grammar System
function initGrammarSystem() {
    console.log('Initializing grammar correction system...');
    
    const applyBtn = document.getElementById('applyGrammarPanelBtn');
    const ignoreBtn = document.getElementById('ignoreGrammarPanelBtn');
    
    if (applyBtn) {
        applyBtn.addEventListener('click', applyGrammarCorrections);
    }
    
    if (ignoreBtn) {
        ignoreBtn.addEventListener('click', ignoreGrammarCorrections);
    }
}

async function checkGrammar(text, targetLanguage) {
    const grammarContent = document.getElementById('grammarPanelContent');
    const grammarStatus = document.getElementById('grammarPanelStatus');
    const grammarActions = document.getElementById('grammarPanelActions');
    
    if (!grammarContent || !grammarStatus) return;
    
    const now = Date.now();
    if (now - lastGrammarRequest < GRAMMAR_RATE_LIMIT) {
        return;
    }
    
    lastGrammarRequest = now;
    
    grammarStatus.textContent = 'Checking...';
    grammarStatus.className = 'grammar-status loading';
    grammarContent.innerHTML = '<span class="loading-indicator">🔍 Analyzing grammar and phrasing...</span>';
    
    if (grammarActions) {
        grammarActions.style.display = 'none';
    }
    
    try {
        if (!puterAIAvailable) {
            await initializePuterAI();
        }
        
        if (!puter || !puter.ai || !puter.ai.chat) {
            throw new Error('Puter AI not available');
        }
        
        const languageName = supportedLanguages[targetLanguage] || targetLanguage;
        
        const prompt = `Analyze this ${languageName} text for grammar, syntax, and natural phrasing issues: "${text}"

Provide specific corrections in this exact JSON format:
{
    "suggestions": [
        {
            "original": "exact problematic phrase",
            "corrected": "improved version", 
            "explanation": "brief explanation of the issue"
        }
    ]
}

Focus on:
- Grammar mistakes
- Unnatural phrasing
- Syntax errors
- Word order issues
- Cultural appropriateness for ${languageName}

If the text is already perfect, return an empty suggestions array.`;

        console.log('Sending grammar check to Puter AI for:', languageName);
        
        const aiResponse = await puter.ai.chat(prompt);
        console.log('Grammar AI raw response:', aiResponse);
        
        let responseText = '';
        
        if (aiResponse && typeof aiResponse === 'object') {
            if (aiResponse.message && aiResponse.message.content && aiResponse.message.content.trim()) {
                responseText = aiResponse.message.content.trim();
            } 
            else if (aiResponse.content && aiResponse.content.trim()) {
                responseText = aiResponse.content.trim();
            }
        } 
        else if (typeof aiResponse === 'string' && aiResponse.trim()) {
            responseText = aiResponse.trim();
        }
        
        if (!responseText) {
            throw new Error('Empty response from AI');
        }
        
        let grammarData;
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                grammarData = JSON.parse(jsonMatch[0]);
            } else {
                grammarData = JSON.parse(responseText);
            }
        } catch (parseError) {
            console.warn('Failed to parse JSON, treating as text response');
            grammarData = { suggestions: [] };
        }
        
        displayGrammarSuggestions(grammarData.suggestions || []);
        
    } catch (error) {
        console.error('Grammar check error:', error);
        grammarStatus.textContent = 'Error';
        grammarStatus.className = 'grammar-status error';
        grammarContent.innerHTML = '<span style="color: #e53e3e;">❌ Failed to analyze grammar. Please try again.</span>';
    }
}

function displayGrammarSuggestions(suggestions) {
    const grammarContent = document.getElementById('grammarPanelContent');
    const grammarStatus = document.getElementById('grammarPanelStatus');
    const grammarActions = document.getElementById('grammarPanelActions');
    
    if (!grammarContent || !grammarStatus) return;
    
    currentGrammarSuggestions = suggestions;
    
    if (suggestions.length === 0) {
        grammarStatus.textContent = 'No Issues';
        grammarStatus.className = 'grammar-status ready';
        grammarContent.innerHTML = '<span style="color: #4CAF50;">✅ The translation appears to be grammatically correct and natural!</span>';
        
        if (grammarActions) {
            grammarActions.style.display = 'none';
        }
    } else {
        grammarStatus.textContent = `${suggestions.length} Issues Found`;
        grammarStatus.className = 'grammar-status';
        
        const suggestionsHTML = suggestions.map((suggestion, index) => `
            <div class="grammar-suggestion">
                <div>
                    <span class="original-text">"${suggestion.original}"</span>
                    → 
                    <span class="corrected-text">"${suggestion.corrected}"</span>
                </div>
                <div class="grammar-explanation">${suggestion.explanation}</div>
            </div>
        `).join('');
        
        grammarContent.innerHTML = suggestionsHTML;
        
        if (grammarActions) {
            grammarActions.style.display = 'flex';
        }
        
        highlightGrammarIssues(suggestions);
    }
}

function highlightGrammarIssues(suggestions) {
    if (!translatedResult || suggestions.length === 0) return;
    
    let text = translatedResult.textContent;
    
    suggestions.forEach(suggestion => {
        const original = suggestion.original;
        if (text.includes(original)) {
            text = text.replace(original, `<span class="grammar-issue" title="${suggestion.explanation}">${original}</span>`);
        }
    });
    
    translatedResult.innerHTML = text;
    
    // Re-attach click handlers for definitions
    translatedResult.querySelectorAll('.clickable-word').forEach(wordElement => {
        wordElement.addEventListener('click', handleWordClick);
    });
}

function applyGrammarCorrections() {
    if (currentGrammarSuggestions.length === 0) return;
    
    let correctedText = translatedResult.textContent;
    
    currentGrammarSuggestions.forEach(suggestion => {
        correctedText = correctedText.replace(suggestion.original, suggestion.corrected);
    });
    
    translatedResult.textContent = correctedText;
    
    setTimeout(() => {
        makeTranslatedTextClickable();
    }, 100);
    
    showGrammarSuccess();
    
    // Close grammar panel after applying
    setTimeout(() => {
        toggleLeftPanel('grammar');
    }, 1500);
}

function ignoreGrammarCorrections() {
    // Remove grammar highlighting
    if (translatedResult) {
        translatedResult.innerHTML = translatedResult.textContent;
        
        translatedResult.querySelectorAll('.clickable-word').forEach(wordElement => {
            wordElement.addEventListener('click', handleWordClick);
        });
    }
    
    // Close grammar panel
    toggleLeftPanel('grammar');
}

function showGrammarSuccess() {
    const feedback = document.createElement('div');
    feedback.textContent = '✅ Grammar corrections applied!';
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 10px 15px;
        border-radius: 8px;
        z-index: 1000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.parentNode.removeChild(feedback);
        }
    }, 3000);
}

// ✅ Update objects panel
function updateObjectsPanel(objectsData) {
    const objectsPanelContent = document.getElementById('objectsPanelContent');
    if (!objectsPanelContent) return;
    
    if (!objectsData || objectsData.count === 0) {
        objectsPanelContent.innerHTML = '<div class="no-objects">🔍 No objects detected</div>';
        return;
    }
    
    let objectsHTML = '';
    
    if (objectsData.description) {
        objectsHTML += `<div class="objects-description">${objectsData.description}</div>`;
    }
    
    objectsHTML += '<div class="objects-grid">';
    
    objectsData.detected.forEach(obj => {
        const confidencePercent = Math.round(obj.confidence * 100);
        objectsHTML += `
            <div class="object-card">
                <div class="object-name">${obj.name}</div>
                <div class="object-confidence">${confidencePercent}% confidence</div>
            </div>
        `;
    });
    
    objectsHTML += '</div>';
    objectsPanelContent.innerHTML = objectsHTML;
}

// ✅ Update summary panel
function updateSummaryPanel(data, elapsed) {
    const summaryPanelContent = document.getElementById('summaryPanelContent');
    if (!summaryPanelContent) return;
    
    const extractedText = data.extractedText || '';
    const textLength = extractedText.length;
    const objectsCount = data.objects?.count || 0;
    const targetLang = langSelect.value === 'auto' ? 'Auto-detect' : supportedLanguages[langSelect.value] || langSelect.value;
    
    summaryPanelContent.innerHTML = `
        <div class="summary-item">
            <div class="summary-label">Processing Time</div>
            <div class="summary-value">${data.processingTime || elapsed}s</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Text Length</div>
            <div class="summary-value">${textLength} characters</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Objects Found</div>
            <div class="summary-value">${objectsCount}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Target Language</div>
            <div class="summary-value">${targetLang}</div>
        </div>
    `;
}

// ✅ Setup event listeners
function setupEventListeners() {
    const form = document.getElementById('uploadForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    if (arrow && imageInput) {
        arrow.addEventListener('click', () => {
            console.log('Arrow clicked - triggering file input');
            imageInput.click();
        });

        imageInput.addEventListener('change', () => {
            console.log('File selected:', imageInput.files[0]?.name);
            if (imageInput.files.length > 0) {
                arrow.classList.add('selected');
            } else {
                arrow.classList.remove('selected');
            }
        });
    }

    // Add change listener to language select
    if (langSelect) {
        langSelect.addEventListener('change', () => {
            console.log('Language changed to:', langSelect.value);
        });
    }

 // ✅ FIXED: Auto-translation when language changes with proper null checks
if (langSelect) {
    langSelect.addEventListener('change', async () => {
        console.log('🔄 Language changed to:', langSelect.value);
        
        // ✅ FIXED: Use textResult instead of extractedResult for extraction text
        let extractedText = '';
        if (textResult) {
            extractedText = textResult.textContent;
        } else if (extractedResult) {
            extractedText = extractedResult.textContent;
        }
        
        console.log('📝 Extracted text for translation:', extractedText ? extractedText.substring(0, 100) + '...' : 'No text found');
        
        // Only translate if we have valid extracted text
        if (extractedText && 
            extractedText.trim().length > 0 && 
            !extractedText.includes('No text could be extracted') &&
            !extractedText.includes('Processing...') &&
            !extractedText.includes('Error:') &&
            !extractedText.includes('Extracted text will appear here') &&
            !extractedText.includes('Upload an image to see')) {
            
            console.log('🔄 Auto-translating to:', langSelect.value);
            
            if (translatedResult) {
                translatedResult.textContent = 'Translating...';
            }
            
            const result = await translateTextManually(extractedText, langSelect.value);
            
            if (result.success) {
                if (translatedResult) {
                    translatedResult.textContent = result.translated;
                }
                
                // Enable copy button and make text clickable
                if (copyTranslatedBtn) copyTranslatedBtn.disabled = false;
                
                setTimeout(() => {
                    makeTranslatedTextClickable();
                }, 100);
                
                console.log('✅ Auto-translation completed');
            } else {
                if (translatedResult) {
                    translatedResult.textContent = `Translation failed: ${result.error}\n\nOriginal text:\n${extractedText}`;
                }
            }
        } else {
            console.log('❌ No valid text to translate');
            if (translatedResult) {
                translatedResult.textContent = 'No valid extracted text available for translation. Please analyze an image first.';
            }
        }
    });
}
    // Setup image preview
    setupImagePreview();
}

// ✅ FIXED: Handle form submission with CORRECT ENDPOINT
// async function handleFormSubmit(e) {
//   e.preventDefault();

//   const fileInput = document.getElementById('imageInput');
//   if (!fileInput.files.length) {
//     alert('Please select an image.');
//     return;
//   }

//   const formData = new FormData();
//   formData.append('image', fileInput.files[0]);
  
//   // Get selected language for translation
//   const selectedLanguage = langSelect.value;
//   console.log('Selected language for translation:', selectedLanguage);
//   formData.append('targetLanguage', selectedLanguage);

//   // Show loading state
//   setLoadingState(true);
//   const startTime = Date.now();

//   try {
//     console.log('Sending request to server with language:', selectedLanguage);
    
//     // ✅ FIXED: Use the CORRECT endpoint for translator (like translator.js)
//     const response = await fetch('http://localhost:3000/api/picturetotexttranslator/upload', {
//       method: 'POST',
//       body: formData
//     });

//     const data = await response.json();
//     const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

//     console.log('Server response:', data);

//     if (data.error) {
//       showError(data.error);
//     } else {
//       // ✅ FIXED: Use the display function that handles translation properly
//       displayTranslatorResults(data, elapsed);
//     }
//   } catch (err) {
//     const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
//     console.error('Request failed:', err);
//     showRequestError(err, elapsed);
//   } finally {
//     setLoadingState(false);
//   }
// }
// // ✅ ENHANCED: Better translation results display
// function displayTranslatorResults(data, elapsed) {
//     console.log('🚨 FULL SERVER RESPONSE:', data);
    
//     const extractedText = data.extractedText || '';
//     const translatedText = data.translatedText || '';
//     const detectedLanguage = data.detectedLanguage || 'unknown';
//     const targetLanguage = data.targetLanguage || langSelect.value;
    
//     // Debug information
//     console.log('🔍 Translation Analysis:', {
//         extractedText: extractedText.substring(0, 100),
//         translatedText: translatedText.substring(0, 100),
//         detectedLanguage: detectedLanguage,
//         targetLanguage: targetLanguage,
//         areTextsEqual: extractedText === translatedText,
//         extractedLength: extractedText.length,
//         translatedLength: translatedText.length,
//         debugInfo: data.debug // Include server debug info
//     });
    
//     // ✅ EXTRACTED TEXT: Show original text
//     if (extractedText && extractedText.trim().length > 0) {
//         extractedResult.textContent = extractedText;
//     } else {
//         extractedResult.textContent = 'No text could be extracted from this image.';
//     }
    
//     // ✅ IMPROVED TRANSLATION LOGIC
//     const hasValidExtractedText = extractedText && 
//         extractedText.trim().length > 0 && 
//         !extractedText.includes('No text could be extracted') &&
//         !extractedText.includes('Text detected but could not be extracted') &&
//         !extractedText.includes('No significant text detected');
    
//     if (hasValidExtractedText) {
//         const isSameLanguage = data.sameLanguage === true;
//         const translationFailed = data.translationFailed === true;
//         const translationActuallyWorked = translatedText && 
//             translatedText.trim().length > 0 && 
//             translatedText !== extractedText;
        
//         console.log('🔍 Translation Status:', {
//             isSameLanguage,
//             translationFailed,
//             translationActuallyWorked,
//             detectedLanguage,
//             targetLanguage
//         });
        
//         if (isSameLanguage) {
//             translatedResult.textContent = `🌍 No translation needed (text is already in ${supportedLanguages[targetLanguage] || targetLanguage}):\n\n${extractedText}`;
//         } 
//         else if (translationFailed) {
//             translatedResult.textContent = `❌ Translation to ${supportedLanguages[targetLanguage] || targetLanguage} failed.\n\nError: ${data.error || 'Unknown error'}\n\nOriginal text:\n${extractedText}`;
//         }
//         else if (translationActuallyWorked) {
//             translatedResult.textContent = translatedText;
//             console.log('✅ Translation successful!');
//         } 
//         else {
//             translatedResult.textContent = `⚠️ Translation may have issues. Showing original text:\n\n${extractedText}`;
//         }
//     } else {
//         translatedResult.textContent = 'No text available for translation.';
//     }
    
//     // Continue with the rest of your display logic...
//     displayObjectResults(data.objects);
//     updateObjectsPanel(data.objects);
//     updateSummaryPanel(data, elapsed);
    
//     // Make translated text clickable if we have actual translation
//     const hasActualTranslation = translatedText && 
//         translatedText !== extractedText && 
//         !translatedResult.textContent.includes('No translation needed') &&
//         !translatedResult.textContent.includes('Translation failed');
    
//     if (hasActualTranslation) {
//         setTimeout(() => {
//             makeTranslatedTextClickable();
//         }, 100);
//     }
    
//     // Update info sections with better messaging
//     processingTime.textContent = `⏱️ Processing time: ${data.processingTime || elapsed}s`;
    
//     if (detectedLanguage && detectedLanguage !== 'unknown') {
//         const detectedLangName = supportedLanguages[detectedLanguage] || detectedLanguage;
//         const targetLangName = supportedLanguages[targetLanguage] || targetLanguage;
        
//         if (data.sameLanguage) {
//             languageInfo.textContent = `🌍 Same language: ${detectedLangName}`;
//         } else if (data.translationFailed) {
//             languageInfo.textContent = `🌍 ${detectedLangName} → ${targetLangName} ❌`;
//         } else if (hasActualTranslation) {
//             languageInfo.textContent = `🌍 ${detectedLangName} → ${targetLangName} ✅`;
//         } else {
//             languageInfo.textContent = `🌍 ${detectedLangName} → ${targetLangName} ⚠️`;
//         }
//     } else {
//         const targetLangName = supportedLanguages[targetLanguage] || targetLanguage;
//         languageInfo.textContent = `🌍 Target: ${targetLangName}`;
//     }
    
//     // Enable copy buttons
//     if (copyExtractedBtn) copyExtractedBtn.disabled = !hasValidExtractedText;
//     if (copyTranslatedBtn) copyTranslatedBtn.disabled = !hasActualTranslation;
    
//     // Show retry option if translation failed
//     if (data.translationFailed && hasValidExtractedText) {
//         showTranslationRetryOption(extractedText, targetLanguage);
//     }
// }
// ✅ ENHANCED: Manual translation function with better error handling
async function translateTextManually(text, targetLang) {
    if (!text || text.trim().length === 0) {
        return { translated: '', detected: 'unknown', success: false };
    }

    try {
        console.log('🌍 Manual translation to:', targetLang);
        
        // Use the translator endpoint directly
        const response = await fetch('http://localhost:3000/translator/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                text: text, 
                to: targetLang 
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        console.log('✅ Manual translation successful');
        return {
            translated: data.translated || data.text || text,
            detected: data.detected || 'unknown',
            success: true
        };
    } catch (err) {
        console.error('❌ Manual translation failed:', err);
        return {
            translated: text,
            detected: 'unknown',
            error: err.message,
            success: false
        };
    }
}

// ✅ ADD THIS FUNCTION: Retry translation with manual method
async function retryTranslation() {
    const extractedText = extractedResult.textContent;
    const targetLang = langSelect.value;
    
    if (!extractedText || extractedText.includes('No text could be extracted') || targetLang === 'en') {
        return;
    }
    
    try {
        translatedResult.textContent = '🔄 Retrying translation...';
        const result = await translateTextManually(extractedText, targetLang);
        
        if (result.success) {
            translatedResult.textContent = result.translated;
            languageInfo.textContent = `🌍 Detected: ${result.detected} → ${supportedLanguages[targetLang] || targetLang}`;
            
            // Make text clickable
            setTimeout(() => {
                makeTranslatedTextClickable();
            }, 100);
            
            // Enable copy button
            if (copyTranslatedBtn) copyTranslatedBtn.disabled = false;
        } else {
            translatedResult.textContent = `❌ Translation failed: ${result.error}\n\n${extractedText}`;
        }
    } catch (error) {
        translatedResult.textContent = `❌ Translation retry failed: ${error.message}`;
    }
}

// ✅ FIXED: Event listener for language change to retry translation
function setupTranslationRetry() {
    if (langSelect) {
        langSelect.addEventListener('change', () => {
            // If we already have extracted text, retry translation with new language
            let extractedText = '';
            if (textResult) {
                extractedText = textResult.textContent;
            } else if (extractedResult) {
                extractedText = extractedResult.textContent;
            }
            
            if (extractedText && 
                extractedText.trim().length > 0 && 
                !extractedText.includes('No text could be extracted') &&
                !extractedText.includes('Extracted text will appear here') &&
                !extractedText.includes('Upload an image to see')) {
                
                console.log('Language changed, retrying translation...');
                setTimeout(() => {
                    retryTranslation();
                }, 500);
            }
        });
    }
}
// ✅ Display object detection results
function displayObjectResults(objectsData) {
    if (!objectsData || objectsData.count === 0) {
        objectsResult.innerHTML = '<div class="no-objects">🔍 No objects detected in this image.</div>';
        return;
    }
    
    let objectsHTML = '';
    
    if (objectsData.description) {
        objectsHTML += `<div class="objects-description">${objectsData.description}</div>`;
    }
    
    objectsHTML += '<div class="objects-grid">';
    
    objectsData.detected.forEach(obj => {
        const confidencePercent = Math.round(obj.confidence * 100);
        objectsHTML += `
            <div class="object-card">
                <div class="object-name">${obj.name}</div>
                <div class="object-confidence">${confidencePercent}% confidence</div>
            </div>
        `;
    });
    
    objectsHTML += '</div>';
    objectsResult.innerHTML = objectsHTML;
}

// ✅ Enhanced multilingual text clickable function
function makeTranslatedTextClickable() {
    if (!translatedResult) return;
    
    const text = translatedResult.textContent;
    if (!text || text === 'Translated text will appear here...' || text.includes('Waiting for') || text === 'No text to translate.' || text === 'Translating...') {
        return;
    }
    
    // Enhanced regex for multilingual word detection
    const words = text.split(/(\s+|[^\w\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\u0600-\u06ff])/);
    const clickableHTML = words.map(word => {
        // Match words in multiple scripts: Latin, CJK, Arabic, etc.
        if (word.trim().length > 0 && /[\w\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\u0600-\u06ff]/.test(word)) {
            return `<span class="clickable-word" data-word="${word}">${word}</span>`;
        }
        return word;
    }).join('');
    
    translatedResult.innerHTML = clickableHTML;
    
    translatedResult.querySelectorAll('.clickable-word').forEach(wordElement => {
        wordElement.addEventListener('click', handleWordClick);
    });
}

// ✅ Handle word click for definitions
function handleWordClick(event) {
    const word = event.target.getAttribute('data-word');
    if (!word) return;
    
    currentSelectedWord = word;
    
    const now = Date.now();
    if (now - lastDefinitionRequest < DEFINITION_RATE_LIMIT) {
        showRateLimitWarning();
        return;
    }
    
    lastDefinitionRequest = now;
    fetchWordDefinition(word);
}

// ✅ Show rate limit warning
function showRateLimitWarning() {
    const definitionStatus = document.getElementById('definitionStatus');
    const definitionContent = document.getElementById('definitionContent');
    
    if (definitionStatus && definitionContent) {
        definitionStatus.textContent = 'Rate Limited';
        definitionStatus.className = 'definition-status limited';
        definitionContent.innerHTML = '⏰ Please wait a moment before requesting another definition.';
        
        setTimeout(() => {
            if (definitionStatus.textContent === 'Rate Limited') {
                definitionStatus.textContent = 'Ready';
                definitionStatus.className = 'definition-status ready';
                definitionContent.innerHTML = '<span class="definition-placeholder">👆 Click any word in the translation to see its definition</span>';
            }
        }, 3000);
    }
}

// ✅ Fetch word definition using Puter AI
async function fetchWordDefinition(word) {
    const definitionContainer = document.getElementById('definitionContainer');
    const selectedWordElement = document.getElementById('selectedWord');
    const definitionContent = document.getElementById('definitionContent');
    const definitionStatus = document.getElementById('definitionStatus');
    
    if (!definitionContainer || !selectedWordElement || !definitionContent || !definitionStatus) {
        console.error('Definition elements not found');
        return;
    }
    
    definitionContainer.style.display = 'block';
    selectedWordElement.textContent = word;
    definitionStatus.textContent = 'Loading...';
    definitionStatus.className = 'definition-status loading';
    definitionContent.innerHTML = '<span class="loading-indicator">⏳ Fetching definition...</span>';
    
    highlightClickedWord(word, 'loading');
    
    try {
        console.log('Fetching definition for:', word);
        
        if (typeof puter === 'undefined') {
            console.log('Puter not loaded yet, waiting...');
            definitionContent.innerHTML = '<span class="loading-indicator">🔄 Initializing AI service...</span>';
            
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 50;
                
                const checkPuter = setInterval(() => {
                    attempts++;
                    if (typeof puter !== 'undefined' && puter.ai && puter.ai.chat) {
                        clearInterval(checkPuter);
                        console.log('Puter AI now available!');
                        resolve();
                    } else if (attempts >= maxAttempts) {
                        clearInterval(checkPuter);
                        reject(new Error('Puter AI failed to load within timeout'));
                    }
                }, 100);
            });
        }
        
        if (!puter || !puter.ai || !puter.ai.chat) {
            throw new Error('Puter AI not available');
        }
        
        if (!puterAIAvailable) {
            console.log('Attempting Puter authentication...');
            try {
                if (puter.auth?.signInAnonymously) {
                    await puter.auth.signInAnonymously();
                } else if (puter.auth?.anonymous) {
                    await puter.auth.anonymous();
                }
                puterAIAvailable = true;
                console.log('✅ Puter AI authenticated');
            } catch (authError) {
                console.warn('Auth warning:', authError.message);
                puterAIAvailable = true;
            }
        }
        
        const prompt = `Define the word "${word}" clearly and concisely. Include:
- Basic definition
- Part of speech (noun, verb, adjective, etc.)
- A simple example sentence
Keep it to 2-3 sentences maximum.`;

        console.log('Sending to Puter AI:', prompt);
        
        const aiResponse = await puter.ai.chat(prompt);
        console.log('Puter AI raw response:', aiResponse);
        
        let definitionText = '';
        
        if (aiResponse && typeof aiResponse === 'object') {
            if (aiResponse.message && aiResponse.message.content && aiResponse.message.content.trim()) {
                definitionText = aiResponse.message.content.trim();
                console.log('Extracted from message.content:', definitionText);
            } 
            else if (aiResponse.message && aiResponse.message.content === "") {
                throw new Error('AI returned empty content');
            }
            else if (aiResponse.content && aiResponse.content.trim()) {
                definitionText = aiResponse.content.trim();
                console.log('Extracted from content:', definitionText);
            }
            else {
                throw new Error('No valid content found in response');
            }
        } 
        else if (typeof aiResponse === 'string' && aiResponse.trim()) {
            definitionText = aiResponse.trim();
            console.log('Direct string response:', definitionText);
        } 
        else {
            throw new Error('Invalid response format');
        }
        
        console.log('Final definition text:', definitionText);
        
        if (!definitionText || definitionText.trim() === '' || definitionText === '{}' || definitionText.length < 10) {
            throw new Error('Empty or insufficient response from AI');
        }
        
        displayDefinition(word, definitionText);
        highlightClickedWord(word, 'defined');
        
        puterAIAvailable = true;
        
    } catch (error) {
        console.error('Definition fetch error:', error);
        
        definitionStatus.textContent = 'Error';
        definitionStatus.className = 'definition-status';
        
        let errorMessage = '❌ Failed to fetch definition. ';
        
        if (error.message.includes('empty') || error.message.includes('No valid content') || error.message.includes('insufficient')) {
            errorMessage += 'The AI returned an empty response. Please try a different word.';
        } else if (error.message.includes('not available') || error.message.includes('failed to load')) {
            errorMessage += 'AI service not loaded. Please refresh the page.';
        } else if (error.message.includes('timeout')) {
            errorMessage += 'AI service is taking too long to load. Please refresh.';
        } else {
            errorMessage += 'Please try again.';
        }
        
        definitionContent.innerHTML = `<span style="color: #e53e3e;">${errorMessage}</span>`;
        highlightClickedWord(word, '');
        
        setTimeout(() => {
            definitionContainer.style.display = 'none';
        }, 5000);
    }
}

// ✅ Display definition
function displayDefinition(word, definition) {
    const definitionContent = document.getElementById('definitionContent');
    const definitionStatus = document.getElementById('definitionStatus');
    
    if (definitionContent && definitionStatus) {
        definitionContent.innerHTML = definition;
        definitionStatus.textContent = 'Ready';
        definitionStatus.className = 'definition-status ready';
    }
}

// ✅ Highlight clicked word
function highlightClickedWord(word, state) {
    const words = translatedResult.querySelectorAll('.clickable-word');
    words.forEach(wordElement => {
        if (wordElement.getAttribute('data-word') === word) {
            wordElement.className = `clickable-word ${state}`;
        } else if (wordElement.classList.contains('loading') || wordElement.classList.contains('defined')) {
            wordElement.className = 'clickable-word';
        }
    });
}

// ✅ COUNTRY INFO SYSTEM
function initCountryInfoSystem() {
    createLanguageInfoButton();
    setupCountryPanel();
}

function createLanguageInfoButton() {
    const infoBtn = document.querySelector('.language-info-btn');
    if (infoBtn) {
        infoBtn.addEventListener('click', showCountryInfo);
    }
}

function setupCountryPanel() {
    const panel = document.getElementById('countryInfoPanel');
    const closeBtn = document.getElementById('closeCountryPanel');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', hideCountryInfo);
    }
    
    document.addEventListener('click', (e) => {
        if (panel.style.display !== 'none' && 
            !panel.contains(e.target) && 
            !e.target.classList.contains('language-info-btn')) {
            hideCountryInfo();
        }
    });
}

async function showCountryInfo() {
    const currentLang = langSelect.value;
    const countries = languageToCountries[currentLang] || ['US'];
    
    const panel = document.getElementById('countryInfoPanel');
    const content = document.getElementById('countryContent');
    
    if (!panel || !content) return;
    
    content.innerHTML = '<div class="ai-loading">🔄 Loading country information...</div>';
    panel.style.display = 'block';
    
    try {
        await loadCountryInfo(countries[0], countries);
    } catch (error) {
        content.innerHTML = '<div class="ai-error">❌ Failed to load country information</div>';
    }
}

function hideCountryInfo() {
    const panel = document.getElementById('countryInfoPanel');
    if (panel) {
        panel.style.display = 'none';
    }
}

async function loadCountryInfo(countryCode, allCountries = []) {
    const content = document.getElementById('countryContent');
    if (!content) return;
    
    const now = Date.now();
    if (now - lastCountryRequest < COUNTRY_RATE_LIMIT) {
        content.innerHTML = '<div class="ai-loading">⏰ Please wait before requesting another country...</div>';
        return;
    }
    
    lastCountryRequest = now;
    
    try {
        content.innerHTML = '<div class="ai-loading">🔄 Loading country data...</div>';
        
        const countryData = await fetchCountryInfo(countryCode);
        
        if (!countryData) {
            throw new Error('No country data received');
        }
        
        const basicInfoHTML = generateBasicCountryHTML(countryData, allCountries, countryCode);
        content.innerHTML = basicInfoHTML;
        
        // Load AI-powered detailed information
        await loadAICountryInfo(countryData, countryCode);
        
        content.querySelectorAll('.country-option').forEach(option => {
            option.addEventListener('click', async (e) => {
                const code = e.target.getAttribute('data-country') || e.target.closest('.country-option').getAttribute('data-country');
                await loadCountryInfo(code, allCountries);
            });
        });
        
    } catch (error) {
        console.error('Error loading country info:', error);
        content.innerHTML = `
            <div class="ai-error">
                <p>❌ Failed to load country information</p>
                <button onclick="showCountryInfo()" style="margin-top: 10px; padding: 8px 16px; background: #4299e1; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    🔄 Try Again
                </button>
            </div>
        `;
    }
}

async function fetchCountryInfo(countryCode) {
    try {
        const response = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`);
        if (!response.ok) throw new Error('API response not ok');
        const data = await response.json();
        return data[0];
    } catch (error) {
        console.error('Error fetching country info:', error);
        return null;
    }
}

function generateBasicCountryHTML(countryData, allCountries, currentCountryCode) {
    const { name, flags, population, region, subregion, capital, languages, currencies } = countryData;
    
    const currencyInfo = currencies ? Object.values(currencies)[0] : { name: 'N/A', symbol: '' };
    const languageNames = languages ? Object.values(languages).join(', ') : 'N/A';
    
    return `
        ${generateCountrySelector(allCountries, currentCountryCode)}
        <img src="${flags.png}" alt="Flag of ${name.common}" class="country-flag">
        <div class="country-name">${name.common}</div>
        <div class="country-details">
            <div class="country-detail-item">
                <span class="detail-label">🏛️ Official Name:</span>
                <span>${name.official}</span>
            </div>
            <div class="country-detail-item">
                <span class="detail-label">🏙️ Capital:</span>
                <span>${capital ? capital[0] : 'N/A'}</span>
            </div>
            <div class="country-detail-item">
                <span class="detail-label">🗺️ Region:</span>
                <span>${region}${subregion ? `, ${subregion}` : ''}</span>
            </div>
            <div class="country-detail-item">
                <span class="detail-label">👥 Population:</span>
                <span>${population.toLocaleString()}</span>
            </div>
            <div class="country-detail-item">
                <span class="detail-label">🗣️ Languages:</span>
                <span>${languageNames}</span>
            </div>
            <div class="country-detail-item">
                <span class="detail-label">💰 Currency:</span>
                <span>${currencyInfo.name} ${currencyInfo.symbol || ''}</span>
            </div>
        </div>
        <div id="aiCountryInfo" class="ai-loading" style="margin-top: 15px;">
            📚 Loading cultural and historical information...
        </div>
    `;
}

function generateCountrySelector(allCountries, currentCountryCode) {
    if (allCountries.length <= 1) return '';
    
    return `
        <div class="country-selector">
            ${allCountries.map(code => `
                <div class="country-option ${code === currentCountryCode ? 'active' : ''}" 
                     data-country="${code}" 
                     title="${code}">
                    <img src="https://flagcdn.com/w40/${code.toLowerCase()}.png" 
                         alt="${code}" 
                         width="40" 
                         height="30">
                </div>
            `).join('')}
        </div>
    `;
}

async function loadAICountryInfo(countryData, countryCode) {
    const aiInfoElement = document.getElementById('aiCountryInfo');
    if (!aiInfoElement) return;
    
    try {
        if (!puterAIAvailable) {
            await initializePuterAI();
        }
        
        const { name, region, subregion, population } = countryData;
        
        const prompt = `Provide interesting and educational information about ${name.common} (${countryCode}). Include:
- Brief cultural highlights (2-3 key aspects)
- Important historical facts (1-2 sentences)
- Notable customs or traditions
- Fun fact or unique characteristic
Keep it concise, engaging, and suitable for language learners. Maximum 150 words.`;

        console.log('Fetching AI country info for:', name.common);
        
        const aiResponse = await puter.ai.chat(prompt);
        
        let countryInfo = '';
        
        if (aiResponse && typeof aiResponse === 'object') {
            if (aiResponse.message && aiResponse.message.content && aiResponse.message.content.trim()) {
                countryInfo = aiResponse.message.content.trim();
            } 
            else if (aiResponse.content && aiResponse.content.trim()) {
                countryInfo = aiResponse.content.trim();
            }
        } 
        else if (typeof aiResponse === 'string' && aiResponse.trim()) {
            countryInfo = aiResponse.trim();
        }
        
        if (countryInfo && countryInfo.length > 10) {
            aiInfoElement.className = 'ai-content';
            aiInfoElement.innerHTML = `
                <strong>🎭 Cultural & Historical Insights:</strong><br>
                ${countryInfo}
            `;
        } else {
            throw new Error('Empty AI response');
        }
        
    } catch (error) {
        console.error('AI country info error:', error);
        aiInfoElement.className = 'ai-error';
        aiInfoElement.innerHTML = '❌ Cultural information unavailable at the moment.';
    }
}

// ✅ Enhanced Puter AI initialization
async function initializePuterAI() {
    console.log('Initializing Puter AI...');
    
    try {
        if (typeof puter === 'undefined') {
            console.log('Puter.js not loaded yet, waiting...');
            await new Promise((resolve) => {
                const checkPuter = setInterval(() => {
                    if (typeof puter !== 'undefined') {
                        clearInterval(checkPuter);
                        resolve();
                    }
                }, 100);
                
                setTimeout(() => {
                    clearInterval(checkPuter);
                    resolve();
                }, 5000);
            });
        }
        
        if (typeof puter === 'undefined') {
            console.warn('Puter.js failed to load');
            puterAIAvailable = false;
            return false;
        }
        
        if (!puter.ai || !puter.ai.chat) {
            console.warn('Puter AI not available');
            puterAIAvailable = false;
            return false;
        }
        
        try {
            if (puter.auth?.signInAnonymously) {
                await puter.auth.signInAnonymously();
            } else if (puter.auth?.anonymous) {
                await puter.auth.anonymous();
            }
            console.log('✅ Puter AI authenticated');
        } catch (authError) {
            console.warn('Puter AI authentication not required or failed:', authError.message);
        }
        
        puterAIAvailable = true;
        return true;
        
    } catch (error) {
        console.error('Puter AI initialization failed:', error);
        puterAIAvailable = false;
        return false;
    }
}

// ✅ Show error state
function showError(message) {
    extractedResult.textContent = `❌ Error: ${message}`;
    translatedResult.textContent = '🌍 Translation failed';
    objectsResult.innerHTML = '<div class="no-objects">🔍 Object detection failed</div>';
    clearInfoSection();
    
    // Disable copy buttons on error
    if (copyExtractedBtn) copyExtractedBtn.disabled = true;
    if (copyTranslatedBtn) copyTranslatedBtn.disabled = true;
    if (copyObjectsBtn) copyObjectsBtn.disabled = true;
}

// ✅ Show no content result
function showNoContentResult(data, elapsed) {
    extractedResult.textContent = '📝 No text could be extracted from this image.';
    translatedResult.textContent = '🌍 No text to translate.';
    objectsResult.innerHTML = '<div class="no-objects">🔍 No objects detected in this image.</div>';
    processingTime.textContent = `⏱️ Processing time: ${elapsed}s`;
    languageInfo.textContent = '';
    confidenceInfo.textContent = '';
    objectsInfo.textContent = '🔍 No objects detected';
    
    // Disable copy buttons when no content
    if (copyExtractedBtn) copyExtractedBtn.disabled = true;
    if (copyTranslatedBtn) copyTranslatedBtn.disabled = true;
    if (copyObjectsBtn) copyObjectsBtn.disabled = true;
}

// ✅ Show request error
function showRequestError(err, elapsed) {
    extractedResult.textContent = `❌ Request failed after ${elapsed}s\n\nError: ${err.message}`;
    translatedResult.textContent = '🌍 Translation unavailable';
    objectsResult.innerHTML = '<div class="no-objects">🔍 Object detection unavailable</div>';
    clearInfoSection();
    
    // Disable copy buttons on error
    if (copyExtractedBtn) copyExtractedBtn.disabled = true;
    if (copyTranslatedBtn) copyTranslatedBtn.disabled = true;
    if (copyObjectsBtn) copyObjectsBtn.disabled = true;
}

// ✅ Clear info section
function clearInfoSection() {
    processingTime.textContent = '';
    languageInfo.textContent = '';
    confidenceInfo.textContent = '';
    objectsInfo.textContent = '';
}

// ✅ Set loading state
function setLoadingState(isLoading) {
    if (isLoading) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span>🔄 Processing...';
        
        extractedResult.innerHTML = '<span class="spinner"></span>📝 Extracting text from image...\n\n⏳ This may take 15-30 seconds';
        translatedResult.textContent = '⏳ Waiting for text extraction...';
        objectsResult.innerHTML = '<span class="spinner"></span>🔍 Detecting objects in image...';
        
        processingTime.textContent = '⏳ Processing...';
        languageInfo.textContent = '';
        confidenceInfo.textContent = '';
        objectsInfo.textContent = '';
        
        // Disable copy buttons during loading
        if (copyExtractedBtn) copyExtractedBtn.disabled = true;
        if (copyTranslatedBtn) copyTranslatedBtn.disabled = true;
        if (copyObjectsBtn) copyObjectsBtn.disabled = true;
    } else {
        submitBtn.disabled = false;
        submitBtn.textContent = '🚀 Upload, Extract & Translate';
    }
}

// ✅ UPDATE: Initialize function to include translation retry
function init() {
    initializeDOMElements();
    loadBookmarkedLanguages();
    createCustomDropdown();
    
    // ✅ ADDED: Extraction-specific initialization
    initializeButtonState();
    setupSelectImageButton();
    setupUploadArea();
    setupFileInputListener(); // ✅ ADD THIS LINE
    
    setupEventListeners();
    setupLanguageSelectContextMenu();
    setupCopyButtons();
    initPanelControls();
    initCountryInfoSystem();
    
    // ✅ ADDED: Setup translation retry
    setupTranslationRetry();
    
    console.log('Enhanced Picture to Text Translator with EXTRACTION FEATURES initialized!');
    
    // Initialize Puter AI
    setTimeout(async () => {
        const success = await initializePuterAI();
        if (success) {
            console.log('Puter AI ready for definitions, grammar checking, and country info');
        } else {
            console.log('Puter AI initialization failed');
        }
    }, 1000);
}

// ✅ Make switchTab function globally available
window.switchTab = switchTab;

// ✅ ADDED: Make handleUpload globally available for extraction
window.handleUpload = handleUpload;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);