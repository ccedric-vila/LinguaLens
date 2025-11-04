const supportedLanguages = {
    "af": "Afrikaans", "sq": "Albanian", "am": "Amharic", "ar": "Arabic", "hy": "Armenian",
    "az": "Azerbaijani", "eu": "Basque", "be": "Belarusian", "bn": "Bengali", "bs": "Bosnian",
    "bg": "Bulgarian", "ca": "Catalan", "ceb": "Cebuano", "ny": "Chichewa", "zh-cn": "Chinese (Simplified)",
    "zh-tw": "Chinese (Traditional)", "co": "Corsican", "hr": "Croatian", "cs": "Czech", "da": "Danish",
    "nl": "Dutch", "en": "English", "eo": "Esperanto", "et": "Estonian", "tl": "Filipino", // Filipino/Tagalog
    "fil": "Filipino", // Alternative code
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
    "en": ["US", "GB", "CA", "AU", "NZ", "IE", "PH"], // Added PH to English-speaking countries
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
    "tl": ["PH"], // Filipino/Tagalog - Philippines
    "fil": ["PH"] // Alternative code for Filipino
};

// ✅ DOM Elements
let langSelect, textInput, resultDiv, charCount, detectedLanguageDiv, detectedLangText, autoDetectBadge, copyBtn;

// ✅ Translation state
let translationTimeout = null;
const TRANSLATION_DELAY = 500;

// ✅ Bookmark functionality
let bookmarkedLanguages = new Set();

// ✅ Definition functionality (without caching)
let lastDefinitionRequest = 0;
const DEFINITION_RATE_LIMIT = 2000;
let currentSelectedWord = null;
let puterAIAvailable = false;

// ✅ Country info functionality
let lastCountryRequest = 0;
const COUNTRY_RATE_LIMIT = 3000;

// ✅ Grammar correction functionality
let lastGrammarRequest = 0;
const GRAMMAR_RATE_LIMIT = 3000;
let currentGrammarSuggestions = [];
let originalTranslation = '';

// ✅ Initialize the application
function init() {
    console.log('Initializing translator...');
    
    if (initializeDOMElements()) {
        loadBookmarkedLanguages();
        createCustomDropdown();
        setupEventListeners();
        initDefinitionSystem();
        initCountryInfoSystem();
        initGrammarSystem();
        updateCharCount();
        console.log('Translator initialized successfully!');
    } else {
        console.error('Failed to initialize translator - DOM elements missing');
    }
}

function initializeDOMElements() {
    langSelect = document.getElementById('languageSelect');
    textInput = document.getElementById('textInput');
    resultDiv = document.getElementById('result');
    charCount = document.getElementById('charCount');
    detectedLanguageDiv = document.getElementById('detectedLanguage');
    detectedLangText = document.getElementById('detectedLangText');
    autoDetectBadge = document.getElementById('autoDetectBadge');
    copyBtn = document.getElementById('copyBtn');
    
    console.log('DOM Elements found:', {
        langSelect: !!langSelect,
        textInput: !!textInput,
        resultDiv: !!resultDiv,
        charCount: !!charCount,
        detectedLanguageDiv: !!detectedLanguageDiv,
        detectedLangText: !!detectedLangText,
        autoDetectBadge: !!autoDetectBadge,
        copyBtn: !!copyBtn
    });
    
    const elementsExist = langSelect && textInput && resultDiv && charCount && 
                         detectedLanguageDiv && detectedLangText && autoDetectBadge && copyBtn;
    
    if (!elementsExist) {
        console.error('Some DOM elements are missing. Please check your HTML structure.');
        return false;
    }
    
    return true;
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

// ✅ Toggle bookmark for a language
function toggleBookmark(langCode, starElement) {
    const wasBookmarked = bookmarkedLanguages.has(langCode);
    
    if (wasBookmarked) {
        bookmarkedLanguages.delete(langCode);
        starElement.innerHTML = '☆';
        starElement.style.color = '#a0aec0';
        console.log('Unbookmarked:', langCode);
    } else {
        bookmarkedLanguages.add(langCode);
        starElement.innerHTML = '⭐';
        starElement.style.color = '#ffd700';
        console.log('Bookmarked:', langCode);
    }
    
    saveBookmarkedLanguages();
    createCustomDropdown();
    
    // Show visual feedback
    showBookmarkFeedback(langCode, !wasBookmarked);
}

// ✅ Show bookmark feedback
function showBookmarkFeedback(langCode, wasBookmarked) {
    const langName = supportedLanguages[langCode];
    const message = wasBookmarked ? `⭐ ${langName} bookmarked!` : `❌ ${langName} unbookmarked!`;
    
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${wasBookmarked ? '#48bb78' : '#e53e3e'};
        color: white;
        padding: 10px 15px;
        border-radius: 8px;
        z-index: 1000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.parentNode.removeChild(feedback);
        }
    }, 2000);
}

// ✅ Create custom dropdown with star icons
function createCustomDropdown() {
    if (!langSelect) return;
    
    const currentSelection = langSelect.value;
    langSelect.innerHTML = '';
    
    const bookmarkedLangs = [];
    const normalLangs = [];
    
    Object.entries(supportedLanguages).forEach(([code, name]) => {
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
        const separator = document.createElement('option');
        separator.disabled = true;
        separator.textContent = '────────────';
        langSelect.appendChild(separator);
    }
    
    // Add normal languages
    normalLangs.forEach(({ code, name }) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = name;
        option.setAttribute('data-bookmarked', 'false');
        langSelect.appendChild(option);
    });
    
    // Restore selection or set to first bookmark, or English
    if (langSelect.querySelector(`option[value="${currentSelection}"]`)) {
        langSelect.value = currentSelection;
    } else if (bookmarkedLangs.length > 0) {
        langSelect.value = bookmarkedLangs[0].code;
    } else {
        langSelect.value = 'en';
    }
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    if (!textInput || !copyBtn) {
        console.error('Required elements not found!');
        return;
    }
    
    textInput.addEventListener('input', handleTextInput);
    copyBtn.addEventListener('click', handleCopyClick);
    
    langSelect.addEventListener('change', () => {
        console.log('Language changed to:', langSelect.value);
        if (textInput.value.trim()) {
            translateText();
        }
    });
    
    langSelect.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const selectedLang = langSelect.value;
        if (selectedLang) {
            const isBookmarked = bookmarkedLanguages.has(selectedLang);
            const fakeStar = {
                innerHTML: isBookmarked ? '☆' : '⭐',
                style: { color: isBookmarked ? '#a0aec0' : '#ffd700' }
            };
            toggleBookmark(selectedLang, fakeStar);
        }
    });
    
    console.log('Event listeners setup complete');
}

// ✅ Handle text input with auto-translate
function handleTextInput() {
    updateCharCount();
    
    const text = textInput.value.trim();
    
    if (translationTimeout) {
        clearTimeout(translationTimeout);
    }
    
    if (!text) {
        resetToAutoDetectMode();
        return;
    }
    
    translationTimeout = setTimeout(() => {
        translateText();
    }, TRANSLATION_DELAY);
}

// ✅ Reset to auto-detect mode when input is empty
function resetToAutoDetectMode() {
    if (!autoDetectBadge || !detectedLanguageDiv || !resultDiv || !copyBtn) return;
    
    autoDetectBadge.textContent = 'Auto Detect';
    autoDetectBadge.className = 'auto-detect-badge auto-mode';
    detectedLanguageDiv.style.display = 'none';
    resultDiv.innerHTML = '<span class="output-placeholder">Translation will appear here...</span>';
    copyBtn.disabled = true;
    
    const definitionContainer = document.getElementById('definitionPanel');
    if (definitionContainer) {
        definitionContainer.style.display = 'none';
    }
    
    const grammarContainer = document.getElementById('grammarContainer');
    if (grammarContainer) {
        grammarContainer.style.display = 'none';
    }
}

// ✅ Update character count
function updateCharCount() {
    if (!charCount || !textInput) return;
    
    const count = textInput.value.length;
    charCount.textContent = `${count}/5000`;
    
    if (count > 4500) {
        charCount.style.color = '#e53e3e';
    } else if (count > 4000) {
        charCount.style.color = '#dd6b20';
    } else {
        charCount.style.color = '#a0aec0';
    }
}

// ✅ Main translate function
async function translateText() {
    if (!textInput || !langSelect || !resultDiv) return;
    
    const text = textInput.value.trim();
    const to = langSelect.value;

    if (!text) {
        resetToAutoDetectMode();
        return;
    }

    if (text.length > 5000) {
        showError('Text exceeds 5000 character limit.');
        return;
    }

    try {
        setLoadingState(true);
        
        const response = await fetch('http://localhost:3000/translator/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text, to })
        });

        const data = await response.json();

        if (response.ok) {
            displayTranslation(data.translated, data.detected);
        } else {
            showError('Translation error: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        console.error('Translation failed:', err);
        showError('Failed to connect to the translation server.');
    } finally {
        setLoadingState(false);
    }
}

// ✅ Display translation result
function displayTranslation(translatedText, detectedLang) {
    if (!resultDiv || !autoDetectBadge || !detectedLanguageDiv || !detectedLangText || !copyBtn) return;
    
    resultDiv.innerHTML = '';
    resultDiv.textContent = translatedText;
    originalTranslation = translatedText;
    
    setTimeout(() => {
        makeTranslatedTextClickable();
    }, 100);
    
    const definitionContainer = document.getElementById('definitionPanel');
    if (definitionContainer && translatedText && translatedText.trim() && !translatedText.includes('Translating...')) {
        definitionContainer.style.display = 'block';
    }
    
    // Show grammar container and check grammar
    const grammarContainer = document.getElementById('grammarContainer');
    if (grammarContainer && translatedText && translatedText.trim() && !translatedText.includes('Translating...')) {
        grammarContainer.style.display = 'block';
        checkGrammar(translatedText, langSelect.value);
    }
    
    if (translatedText && translatedText.trim() && !translatedText.includes('Translating...')) {
        copyBtn.disabled = false;
    } else {
        copyBtn.disabled = true;
    }
}

// ✅ Show error message
function showError(message) {
    if (!resultDiv || !detectedLanguageDiv || !copyBtn) return;
    
    resultDiv.innerHTML = `<span style="color: #e53e3e;">${message}</span>`;
    detectedLanguageDiv.style.display = 'none';
    copyBtn.disabled = true;
}

// ✅ Set loading state
function setLoadingState(isLoading) {
    if (!resultDiv || !copyBtn) return;
    
    if (isLoading) {
        resultDiv.innerHTML = '<span class="loading-indicator">Translating...</span>';
        copyBtn.disabled = true;
    }
}

// ✅ Copy button handler
function handleCopyClick() {
    console.log('Copy button clicked');
    
    try {
        const textToCopy = resultDiv.textContent;
        
        console.log('Text to copy:', textToCopy);
        
        if (!textToCopy || 
            textToCopy === 'Translation will appear here...' || 
            textToCopy.includes('Translating...') ||
            textToCopy.includes('Error:')) {
            console.log('No valid text to copy');
            return;
        }

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                showCopySuccess();
            }).catch(err => {
                console.error('Clipboard API failed:', err);
                useFallbackCopy(textToCopy);
            });
        } else {
            useFallbackCopy(textToCopy);
        }
        
    } catch (err) {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy text to clipboard');
    }
}

// ✅ Fallback copy method
function useFallbackCopy(text) {
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
            showCopySuccess();
        } else {
            throw new Error('Fallback copy failed');
        }
    } catch (err) {
        console.error('Fallback copy failed:', err);
        alert('Failed to copy text to clipboard');
    }
}

// ✅ Show copy success feedback
function showCopySuccess() {
    const originalText = copyBtn.innerHTML;
    copyBtn.classList.add('copy-success');
    copyBtn.innerHTML = '<img src="https://cdn-icons-png.flaticon.com/512/1621/1621635.png" alt="Copy" width="16" height="16"> Copied!';
    
    setTimeout(() => {
        copyBtn.classList.remove('copy-success');
        copyBtn.innerHTML = originalText;
    }, 2000);
    
    console.log('Text copied successfully!');
}

// ✅ Speaker button functionality
function setupSpeakerButton() {
    const speakerBtn = document.getElementById('speakerBtn');
    if (speakerBtn) {
        speakerBtn.addEventListener('click', () => {
            console.log('Speaker button clicked - navigating to translatorws.html');
            window.location.href = 'translatorws.html';
        });
    }
}

// ✅ Definition system initialization
function initDefinitionSystem() {
    console.log('Initializing definition system...');
    
    // Ensure definition container exists and is properly set up
    const definitionContainer = document.getElementById('definitionPanel');
    if (!definitionContainer) {
        console.log('Definition container not found, creating it...');
        createDefinitionContainer();
    }
    
    // Setup panel toggle functionality
    const toggleDefinition = document.getElementById('toggleDefinition');
    const definitionPanel = document.getElementById('definitionPanel');
    
    if (toggleDefinition && definitionPanel) {
        toggleDefinition.addEventListener('click', () => {
            definitionPanel.classList.toggle('active');
            toggleDefinition.classList.toggle('active');
        });
    }
}

// ✅ Create definition container if it doesn't exist
function createDefinitionContainer() {
    // This function ensures the definition container exists
    // In your case, it should already be in the HTML, so we just need to verify access
    console.log('Verifying definition container access...');
    
    // Double-check that we can access the required elements
    const definitionContainer = document.getElementById('definitionPanel');
    const selectedWordElement = document.getElementById('selectedWord');
    const definitionContent = document.getElementById('definitionContent');
    const definitionStatus = document.getElementById('definitionStatus');

    console.log('Definition elements:', {
        definitionContainer: !!definitionContainer,
        selectedWordElement: !!selectedWordElement,
        definitionContent: !!definitionContent,
        definitionStatus: !!definitionStatus
    });
}

// ✅ Make translated text clickable
function makeTranslatedTextClickable() {
    if (!resultDiv) return;
    
    const text = resultDiv.textContent;
    if (!text || text === 'Translation will appear here...' || text.includes('Translating...')) {
        return;
    }
    
    const words = text.split(/(\s+)/);
    const clickableHTML = words.map(word => {
        if (word.trim().length > 0 && /[a-zA-Z]/.test(word)) {
            return `<span class="clickable-word" data-word="${word}">${word}</span>`;
        }
        return word;
    }).join('');
    
    resultDiv.innerHTML = clickableHTML;
    
    // Verify definition system is ready before adding click handlers
    const definitionContainer = document.getElementById('definitionPanel');
    if (definitionContainer) {
        resultDiv.querySelectorAll('.clickable-word').forEach(wordElement => {
            wordElement.addEventListener('click', handleWordClick);
        });
    } else {
        console.warn('Definition container not available, word clicks disabled');
    }
}

// ✅ Handle word click
function handleWordClick(event) {
    // Check if definition system is available
    const definitionContainer = document.getElementById('definitionPanel');
    if (!definitionContainer) {
        console.warn('Definition system not available');
        return;
    }
    
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
        definitionContent.innerHTML = 'Please wait a moment before requesting another definition.';
        
        setTimeout(() => {
            if (definitionStatus.textContent === 'Rate Limited') {
                definitionStatus.textContent = 'Ready';
                definitionStatus.className = 'definition-status ready';
                definitionContent.innerHTML = '<span class="definition-placeholder">Click any word in the translation to see its definition</span>';
            }
        }, 3000);
    }
}

// ✅ Fetch word definition using Puter AI
async function fetchWordDefinition(word) {
    // Safety check - ensure all required elements exist
    const definitionContainer = document.getElementById('definitionPanel');
    const selectedWordElement = document.getElementById('selectedWord');
    const definitionContent = document.getElementById('definitionContent');
    const definitionStatus = document.getElementById('definitionStatus');

    if (!definitionContainer || !selectedWordElement || !definitionContent || !definitionStatus) {
        console.error('Definition elements not found:', {
            definitionContainer: !!definitionContainer,
            selectedWordElement: !!selectedWordElement,
            definitionContent: !!definitionContent,
            definitionStatus: !!definitionStatus
        });
        return;
    }
    
    // Rest of the function remains the same...
    definitionContainer.style.display = 'block';
    selectedWordElement.textContent = word;
    definitionStatus.textContent = 'Loading...';
    definitionStatus.className = 'definition-status loading';
    definitionContent.innerHTML = '<span class="loading-indicator">Fetching definition...</span>';
    
    highlightClickedWord(word, 'loading');
    
    try {
        console.log('Fetching definition for:', word);
        
        if (typeof puter === 'undefined') {
            console.log('Puter not loaded yet, waiting...');
            definitionContent.innerHTML = '<span class="loading-indicator">Initializing AI service...</span>';
            
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
        
        let errorMessage = 'Failed to fetch definition. ';
        
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
    const words = resultDiv.querySelectorAll('.clickable-word');
    words.forEach(wordElement => {
        if (wordElement.getAttribute('data-word') === word) {
            wordElement.className = `clickable-word ${state}`;
        } else if (wordElement.classList.contains('loading') || wordElement.classList.contains('defined')) {
            wordElement.className = `clickable-word`;
        }
    });
}

// ✅ GRAMMAR CORRECTION SYSTEM
function initGrammarSystem() {
    console.log('Initializing grammar correction system...');
    
    const applyBtn = document.getElementById('applyGrammarBtn');
    const ignoreBtn = document.getElementById('ignoreGrammarBtn');
    
    if (applyBtn) {
        applyBtn.addEventListener('click', applyGrammarCorrections);
    }
    
    if (ignoreBtn) {
        ignoreBtn.addEventListener('click', ignoreGrammarCorrections);
    }
}

// ✅ Check grammar using Puter AI
async function checkGrammar(text, targetLanguage) {
    const grammarContainer = document.getElementById('grammarContainer');
    const grammarContent = document.getElementById('grammarContent');
    const grammarStatus = document.getElementById('grammarStatus');
    const grammarActions = document.getElementById('grammarActions');
    
    if (!grammarContainer || !grammarContent || !grammarStatus) return;
    
    const now = Date.now();
    if (now - lastGrammarRequest < GRAMMAR_RATE_LIMIT) {
        return;
    }
    
    lastGrammarRequest = now;
    
    grammarStatus.textContent = 'Checking...';
    grammarStatus.className = 'grammar-status loading';
    grammarContent.innerHTML = '<span class="loading-indicator">Analyzing grammar and phrasing...</span>';
    
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
            // Try to parse JSON from the response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                grammarData = JSON.parse(jsonMatch[0]);
            } else {
                grammarData = JSON.parse(responseText);
            }
        } catch (parseError) {
            console.error('Failed to parse grammar response:', parseError);
            throw new Error('Invalid response format from AI');
        }
        
        displayGrammarSuggestions(grammarData.suggestions || []);
        
    } catch (error) {
        console.error('Grammar check error:', error);
        grammarStatus.textContent = 'Error';
        grammarStatus.className = 'grammar-status';
        grammarContent.innerHTML = `<span style="color: #e53e3e;">Failed to check grammar: ${error.message}</span>`;
    }
}

// ✅ Display grammar suggestions
function displayGrammarSuggestions(suggestions) {
    const grammarContent = document.getElementById('grammarContent');
    const grammarStatus = document.getElementById('grammarStatus');
    const grammarActions = document.getElementById('grammarActions');
    
    if (!grammarContent || !grammarStatus) return;
    
    currentGrammarSuggestions = suggestions;
    
    if (suggestions.length === 0) {
        grammarStatus.textContent = 'Perfect!';
        grammarStatus.className = 'grammar-status ready';
        grammarContent.innerHTML = '<span style="color: #48bb78;">✓ No grammar issues found. Your text looks great!</span>';
        
        if (grammarActions) {
            grammarActions.style.display = 'none';
        }
    } else {
        grammarStatus.textContent = 'Issues Found';
        grammarStatus.className = 'grammar-status issues';
        
        let suggestionsHTML = '<div class="grammar-suggestions">';
        suggestions.forEach((suggestion, index) => {
            suggestionsHTML += `
                <div class="grammar-suggestion">
                    <div class="suggestion-header">
                        <span class="suggestion-number">#${index + 1}</span>
                        <span class="suggestion-explanation">${suggestion.explanation}</span>
                    </div>
                    <div class="suggestion-comparison">
                        <span class="original-text"><strong>Original:</strong> ${suggestion.original}</span>
                        <span class="corrected-text"><strong>Suggested:</strong> ${suggestion.corrected}</span>
                    </div>
                </div>
            `;
        });
        suggestionsHTML += '</div>';
        
        grammarContent.innerHTML = suggestionsHTML;
        
        if (grammarActions) {
            grammarActions.style.display = 'flex';
        }
    }
}

// ✅ Apply grammar corrections
function applyGrammarCorrections() {
    if (currentGrammarSuggestions.length === 0) return;
    
    let correctedText = originalTranslation;
    
    currentGrammarSuggestions.forEach(suggestion => {
        correctedText = correctedText.replace(suggestion.original, suggestion.corrected);
    });
    
    resultDiv.textContent = correctedText;
    originalTranslation = correctedText;
    
    const grammarContent = document.getElementById('grammarContent');
    const grammarStatus = document.getElementById('grammarStatus');
    const grammarActions = document.getElementById('grammarActions');
    
    if (grammarContent && grammarStatus) {
        grammarStatus.textContent = 'Applied!';
        grammarStatus.className = 'grammar-status ready';
        grammarContent.innerHTML = '<span style="color: #48bb78;">✓ All grammar corrections have been applied.</span>';
    }
    
    if (grammarActions) {
        grammarActions.style.display = 'none';
    }
    
    setTimeout(() => {
        makeTranslatedTextClickable();
    }, 100);
}

// ✅ Ignore grammar corrections
function ignoreGrammarCorrections() {
    const grammarContent = document.getElementById('grammarContent');
    const grammarStatus = document.getElementById('grammarStatus');
    const grammarActions = document.getElementById('grammarActions');
    
    if (grammarContent && grammarStatus) {
        grammarStatus.textContent = 'Ignored';
        grammarStatus.className = 'grammar-status';
        grammarContent.innerHTML = '<span style="color: #a0aec0;">Grammar suggestions ignored.</span>';
    }
    
    if (grammarActions) {
        grammarActions.style.display = 'none';
    }
    
    setTimeout(() => {
        if (grammarStatus) {
            grammarStatus.textContent = 'Ready';
            grammarStatus.className = 'grammar-status ready';
            grammarContent.innerHTML = '<span class="definition-placeholder">Grammar suggestions will appear here after translation</span>';
        }
    }, 2000);
}

// ✅ COUNTRY INFO SYSTEM
function initCountryInfoSystem() {
    console.log('Initializing country info system...');
}

// ✅ Initialize Puter AI
async function initializePuterAI() {
    if (puterAIAvailable) return true;
    
    try {
        if (typeof puter === 'undefined') {
            console.log('Loading Puter SDK...');
            await loadPuterSDK();
        }
        
        if (puter.auth) {
            try {
                if (puter.auth.signInAnonymously) {
                    await puter.auth.signInAnonymously();
                } else if (puter.auth.anonymous) {
                    await puter.auth.anonymous();
                }
            } catch (authError) {
                console.warn('Auth warning:', authError.message);
            }
        }
        
        puterAIAvailable = true;
        console.log('✅ Puter AI initialized');
        return true;
    } catch (error) {
        console.error('❌ Puter AI initialization failed:', error);
        return false;
    }
}

// ✅ Load Puter SDK
function loadPuterSDK() {
    return new Promise((resolve, reject) => {
        if (typeof puter !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://js.puter.com/v2/';
        script.onload = () => {
            console.log('✅ Puter SDK loaded');
            setTimeout(resolve, 1000);
        };
        script.onerror = () => reject(new Error('Failed to load Puter SDK'));
        document.head.appendChild(script);
    });
}

// ✅ Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing translator...');
    init();
    setupSpeakerButton();
});