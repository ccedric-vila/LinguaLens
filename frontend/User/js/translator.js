const supportedLanguages = {
    "af": "Afrikaans", "sq": "Albanian", "am": "Amharic", "ar": "Arabic", "hy": "Armenian",
    "az": "Azerbaijani", "eu": "Basque", "be": "Belarusian", "bn": "Bengali", "bs": "Bosnian",
    "bg": "Bulgarian", "ca": "Catalan", "ceb": "Cebuano", "ny": "Chichewa", "zh-cn": "Chinese (Simplified)",
    "zh-tw": "Chinese (Traditional)", "co": "Corsican", "hr": "Croatian", "cs": "Czech", "da": "Danish",
    "nl": "Dutch", "en": "English", "eo": "Esperanto", "et": "Estonian", "tl": "Filipino",
    "fil": "Filipino", "fi": "Finnish", "fr": "French", "fy": "Frisian", "gl": "Galician",
    "ka": "Georgian", "de": "German", "el": "Greek", "gu": "Gujarati", "ht": "Haitian Creole",
    "ha": "Hausa", "haw": "Hawaiian", "iw": "Hebrew", "hi": "Hindi", "hmn": "Hmong",
    "hu": "Hungarian", "is": "Icelandic", "ig": "Igbo", "id": "Indonesian", "ga": "Irish",
    "it": "Italian", "ja": "Japanese", "jw": "Javanese", "kn": "Kannada", "kk": "Kazakh",
    "km": "Khmer", "rw": "Kinyarwanda", "ko": "Korean", "ku": "Kurdish (Kurmanji)", "ky": "Kyrgyz",
    "lo": "Lao", "la": "Latin", "lv": "Latvian", "lt": "Lithuanian", "lb": "Luxembourgish",
    "mk": "Macedonian", "mg": "Malagasy", "ms": "Malay", "ml": "Malayalam", "mt": "Maltese",
    "mi": "Maori", "mr": "Marathi", "mn": "Mongolian", "my": "Myanmar (Burmese)", "ne": "Nepali",
    "no": "Norwegian", "or": "Odia", "ps": "Pashto", "fa": "Persian", "pl": "Polish",
    "pt": "Portuguese", "pa": "Punjabi", "ro": "Romanian", "ru": "Russian", "sm": "Samoan",
    "gd": "Scots Gaelic", "sr": "Serbian", "st": "Sesotho", "sn": "Shona", "sd": "Sindhi",
    "si": "Sinhala", "sk": "Slovak", "sl": "Slovenian", "so": "Somali", "es": "Spanish",
    "su": "Sundanese", "sw": "Swahili", "sv": "Swedish", "tg": "Tajik", "ta": "Tamil",
    "tt": "Tatar", "te": "Telugu", "th": "Thai", "tr": "Turkish", "tk": "Turkmen",
    "uk": "Ukrainian", "ur": "Urdu", "ug": "Uyghur", "uz": "Uzbek", "vi": "Vietnamese",
    "cy": "Welsh", "xh": "Xhosa", "yi": "Yiddish", "yo": "Yoruba", "zu": "Zulu"
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

// ✅ DOM Elements
let langSelect, textInput, resultDiv, charCount, detectedLanguageDiv, detectedLangText, autoDetectBadge, copyBtn;

// ✅ Translation state
let translationTimeout = null;
const TRANSLATION_DELAY = 500;

// ✅ Bookmark functionality
let bookmarkedLanguages = new Set();

// ✅ Definition functionality
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
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userid');
    
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    if (userId) {
        headers['X-User-ID'] = userId;
    }
    
    console.log('🔐 Auth headers:', { token: !!token, userId: userId });
    return headers;
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
    
    // Panel toggle functionality
    const toggleDefinition = document.getElementById('toggleDefinition');
    const definitionPanel = document.getElementById('definitionPanel');
    const toggleGrammar = document.getElementById('toggleGrammar');
    const grammarPanel = document.getElementById('grammarContainer');
    
    if (toggleDefinition && definitionPanel) {
        toggleDefinition.addEventListener('click', () => {
            definitionPanel.classList.toggle('active');
            toggleDefinition.classList.toggle('active');
        });
    }
    
    if (toggleGrammar && grammarPanel) {
        toggleGrammar.addEventListener('click', () => {
            grammarPanel.classList.toggle('active');
            toggleGrammar.classList.toggle('active');
        });
    }
    
    // Country info button
    const languageInfoBtn = document.getElementById('languageInfoBtn');
    if (languageInfoBtn) {
        languageInfoBtn.addEventListener('click', showCountryInfo);
    }
    
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
        'Content-Type': 'application/json',
        ...getAuthHeaders() // ✅ ADD THIS LINE
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
    
    const definitionContainer = document.getElementById('definitionPanel');
    if (!definitionContainer) {
        console.log('Definition container not found');
    }
}

// ✅ Make ALL translated text clickable (including non-English characters)
function makeTranslatedTextClickable() {
    if (!resultDiv) return;
    
    const text = resultDiv.textContent;
    if (!text || text === 'Translation will appear here...' || text.includes('Translating...')) {
        return;
    }
    
    // Split by word boundaries to include all characters
    const words = text.split(/(\s+)/);
    const clickableHTML = words.map(word => {
        // Make EVERY word clickable, regardless of language/characters
        if (word.trim().length > 0) {
            return `<span class="clickable-word" data-word="${word}">${word}</span>`;
        }
        return word;
    }).join('');
    
    resultDiv.innerHTML = clickableHTML;
    
    // Add click handlers to all words
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
    const definitionContainer = document.getElementById('definitionPanel');
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
        
        const prompt = `Define the word or phrase "${word}" clearly and concisely. Include:
- Basic definition
- Part of speech (noun, verb, adjective, etc.) if applicable
- A simple example sentence
- If it's a phrase or non-English word, explain its meaning and usage
Keep it to 2-3 sentences maximum. Be helpful for language learners.`;

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
        
        // Try to parse JSON from the response
        let grammarData;
        try {
            // Extract JSON from the response if it's wrapped in other text
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
        grammarContent.innerHTML = '<span style="color: #e53e3e;">Failed to analyze grammar. Please try again.</span>';
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
        grammarStatus.textContent = 'No Issues';
        grammarStatus.className = 'grammar-status ready';
        grammarContent.innerHTML = '<span style="color: #48bb78;">✓ The translation appears to be grammatically correct and natural!</span>';
        
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
        
        // Highlight issues in the translation text
        highlightGrammarIssues(suggestions);
    }
}

// ✅ Highlight grammar issues in the translation
function highlightGrammarIssues(suggestions) {
    if (!resultDiv || suggestions.length === 0) return;
    
    let text = resultDiv.textContent;
    
    suggestions.forEach(suggestion => {
        const original = suggestion.original;
        // Simple highlighting - in a real app you'd want more sophisticated text matching
        if (text.includes(original)) {
            text = text.replace(original, `<span class="grammar-issue" title="${suggestion.explanation}">${original}</span>`);
        }
    });
    
    resultDiv.innerHTML = text;
    
    // Reattach click event listeners for word definitions
    resultDiv.querySelectorAll('.clickable-word').forEach(wordElement => {
        wordElement.addEventListener('click', handleWordClick);
    });
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
    
    // Update the clickable words
    setTimeout(() => {
        makeTranslatedTextClickable();
    }, 100);
    
    // Hide grammar container after applying
    const grammarContainer = document.getElementById('grammarContainer');
    if (grammarContainer) {
        grammarContainer.style.display = 'none';
    }
    
    // Show success message
    showGrammarSuccess();
}

// ✅ Ignore grammar corrections
function ignoreGrammarCorrections() {
    const grammarContainer = document.getElementById('grammarContainer');
    if (grammarContainer) {
        grammarContainer.style.display = 'none';
    }
    
    // Remove grammar highlighting
    if (resultDiv) {
        resultDiv.innerHTML = resultDiv.textContent;
        
        // Reattach click event listeners
        resultDiv.querySelectorAll('.clickable-word').forEach(wordElement => {
            wordElement.addEventListener('click', handleWordClick);
        });
    }
}

// ✅ Show grammar success feedback
function showGrammarSuccess() {
    const feedback = document.createElement('div');
    feedback.textContent = '✓ Grammar corrections applied!';
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #48bb78;
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
    }, 3000);
}

// ✅ COUNTRY INFO SYSTEM
function initCountryInfoSystem() {
    createLanguageInfoButton();
    setupCountryPanel();
}

function createLanguageInfoButton() {
    const infoBtn = document.createElement('button');
    infoBtn.className = 'language-info-btn';
    infoBtn.innerHTML = 'ℹ️';
    infoBtn.title = 'Show Language & Country Info';
    infoBtn.addEventListener('click', showCountryInfo);
    
    const header = document.querySelector('.header');
    if (header) {
        header.style.position = 'relative';
        header.appendChild(infoBtn);
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
    
    content.innerHTML = '<div class="ai-loading">Loading country information...</div>';
    panel.style.display = 'block';
    
    try {
        await loadCountryInfo(countries[0], countries);
    } catch (error) {
        content.innerHTML = '<div class="ai-error">Failed to load country information</div>';
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
        content.innerHTML = '<div class="ai-loading">Please wait before requesting another country...</div>';
        return;
    }
    
    lastCountryRequest = now;
    
    try {
        content.innerHTML = '<div class="ai-loading">Loading country data...</div>';
        
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
                <p>Failed to load country information</p>
                <button onclick="showCountryInfo()" style="margin-top: 10px; padding: 8px 16px; background: #4299e1; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    Try Again
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
                <span class="detail-label">Official Name:</span>
                <span>${name.official}</span>
            </div>
            <div class="country-detail-item">
                <span class="detail-label">Capital:</span>
                <span>${capital ? capital[0] : 'N/A'}</span>
            </div>
            <div class="country-detail-item">
                <span class="detail-label">Region:</span>
                <span>${region}${subregion ? `, ${subregion}` : ''}</span>
            </div>
            <div class="country-detail-item">
                <span class="detail-label">Population:</span>
                <span>${population.toLocaleString()}</span>
            </div>
            <div class="country-detail-item">
                <span class="detail-label">Languages:</span>
                <span>${languageNames}</span>
            </div>
            <div class="country-detail-item">
                <span class="detail-label">Currency:</span>
                <span>${currencyInfo.name} ${currencyInfo.symbol || ''}</span>
            </div>
        </div>
        <div id="aiCountryInfo" class="ai-loading" style="margin-top: 15px;">
            Loading cultural and historical information...
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
        
        if (!puter || !puter.ai || !puter.ai.chat) {
            throw new Error('Puter AI not available');
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
                <strong>Cultural & Historical Insights:</strong><br>
                ${countryInfo}
            `;
        } else {
            throw new Error('Empty AI response');
        }
        
    } catch (error) {
        console.error('AI country info error:', error);
        aiInfoElement.className = 'ai-error';
        aiInfoElement.innerHTML = 'Cultural information unavailable at the moment.';
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

// ✅ Update definition status indicator
function updateDefinitionStatus(status) {
    const definitionStatus = document.getElementById('definitionStatus');
    if (!definitionStatus) return;
    
    switch (status) {
        case 'ready':
            definitionStatus.textContent = 'AI Ready';
            definitionStatus.className = 'definition-status ready';
            break;
        case 'error':
            definitionStatus.textContent = 'AI Unavailable';
            definitionStatus.className = 'definition-status';
            break;
        case 'loading':
            definitionStatus.textContent = 'Loading...';
            definitionStatus.className = 'definition-status loading';
            break;
        default:
            definitionStatus.textContent = 'Ready';
            definitionStatus.className = 'definition-status ready';
    }
}

// ✅ Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing translator...');
    init();
    setupSpeakerButton();
    
    setTimeout(async () => {
        const success = await initializePuterAI();
        if (success) {
            console.log('Puter AI ready for definitions and country info');
            updateDefinitionStatus('ready');
        } else {
            console.log('Puter AI initialization failed');
            updateDefinitionStatus('error');
        }
    }, 1000);
});