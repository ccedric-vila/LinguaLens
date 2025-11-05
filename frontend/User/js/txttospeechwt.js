// LinguaLens/frontend/User/js/txttospeechwt.js

// Supported TTS languages (Puter AI) - Only languages that can actually be spoken
const supportedTtsLanguages = [
  { value: 'en', name: 'English' },
  { value: 'es', name: 'Spanish' },
  { value: 'fr', name: 'French' },
  { value: 'de', name: 'German' },
  { value: 'it', name: 'Italian' },
  { value: 'pt', name: 'Portuguese' },
  { value: 'ru', name: 'Russian' },
  { value: 'ja', name: 'Japanese' },
  { value: 'ko', name: 'Korean' },
  { value: 'zh', name: 'Chinese' },
  { value: 'ar', name: 'Arabic' },
  { value: 'hi', name: 'Hindi' },
  { value: 'nl', name: 'Dutch' },
  { value: 'tr', name: 'Turkish' },
  { value: 'sv', name: 'Swedish' },
  { value: 'pl', name: 'Polish' }
];

// Function to populate language dropdown with only supported TTS languages
function populateLanguageDropdown() {
  const targetLang = document.getElementById('targetLang');
  
  // Clear all existing options
  while (targetLang.options.length > 0) {
    targetLang.remove(0);
  }
  
  // Add only supported TTS languages
  supportedTtsLanguages.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang.value;
    option.textContent = lang.name;
    targetLang.appendChild(option);
  });
  
  // Update the language count display
  updateLanguageCount();
}

// Function to update the language count display
function updateLanguageCount() {
  const languageCount = document.querySelector('.language-count');
  if (languageCount) {
    languageCount.textContent = `${supportedTtsLanguages.length}+ Languages`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Populate the language dropdown with only supported languages
  populateLanguageDropdown();
  
  const inputText = document.getElementById('inputText');
  const targetLang = document.getElementById('targetLang');
  const engineSelect = document.getElementById('engineSelect');
  const speakBtn = document.getElementById('speakBtn');
  const loading = document.getElementById('loading');
  const info = document.getElementById('info');
  const charCount = document.getElementById('charCount');
  const translatedOutput = document.getElementById('translatedOutput');

  // Character counter
  inputText.addEventListener('input', () => {
    charCount.textContent = `${inputText.value.length}/5000`;
  });

  // Helper functions
  function setLoading(on) {
    loading.style.display = on ? 'block' : 'none';
    speakBtn.disabled = on;
    if (!on) speakBtn.textContent = '🔊 Speak (translate → speak)';
    else speakBtn.textContent = '⏳ Processing...';
  }

  function showInfo(msg) {
    info.textContent = msg;
  }

  function showTranslatedText(text) {
    if (text) {
      translatedOutput.textContent = text;
      translatedOutput.style.display = 'block';
    } else {
      translatedOutput.style.display = 'none';
    }
  }

  // ✅ Function to save TTS history (updated with language_used)
  async function saveTtsHistoryToDB(text, engine, language) {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        console.warn("User not logged in, skipping history save");
        return;
      }

      await fetch('http://localhost:3000/tts-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          text_content: text,
          engine_used: engine,
          language_used: language
        })
      });
    } catch (err) {
      console.error('Failed to save TTS history:', err);
    }
  }

  // ✅ Function to save TTS with translation analytics
  async function saveTtsAnalytics(inputText, sourceLang, targetLang, translatedText, engine, charCount, processingTime, audioTime) {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        console.warn("User not logged in, skipping analytics save");
        return;
      }

      await fetch('http://localhost:3000/tts-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          input_text: inputText,
          source_language: sourceLang,
          target_language: targetLang,
          translated_text: translatedText,
          engine_used: engine,
          character_count: charCount,
          processing_duration: processingTime,
          audio_duration: audioTime
        })
      });
    } catch (err) {
      console.error('Failed to save TTS analytics:', err);
    }
  }

  // Main click handler
  speakBtn.addEventListener('click', async () => {
    const text = inputText.value.trim();
    const to = targetLang.value;
    const engine = engineSelect.value;
    const startTime = performance.now();

    if (!text) {
      alert('Please enter text to speak.');
      return;
    }

    setLoading(true);
    showInfo('Translating...');
    showTranslatedText(''); // clear previous translation

    try {
      // 1) Call translate API
      const resp = await fetch('http://localhost:3000/translator/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, to })
      });

      const data = await resp.json();
      const processingTime = (performance.now() - startTime) / 1000; // Convert to seconds

      if (!resp.ok) {
        showInfo('Translation failed: ' + (data.error || resp.statusText));
        setLoading(false);
        return;
      }

      const translated = data.translated || '';
      const detected = data.detected || null;

      showInfo(`Detected: ${detected || 'unknown'}. Speaking in ${to}.`);
      showTranslatedText(translated); // display translated text

      // 2) Use Puter to convert the translated text to speech
      try {
        const audio = await puter.ai.txt2speech(translated, { engine });
        
        // Get audio duration if available
        let audioDuration = null;
        if (audio.duration) {
          audioDuration = audio.duration;
        }
        
        audio.play();

        showInfo(`Playing translated text (${to}). Detected original: ${detected || 'unknown'}.`);

        // ✅ Save to both TTS history and analytics
        await Promise.all([
          saveTtsHistoryToDB(translated, engine, to),
          saveTtsAnalytics(text, detected, to, translated, engine, text.length, processingTime, audioDuration)
        ]);

      } catch (ttsErr) {
        console.error('TTS error:', ttsErr);
        showInfo('Text-to-speech failed.');
        
        // Still save analytics even if TTS fails
        await saveTtsAnalytics(text, detected, to, translated, engine, text.length, processingTime, null);
      }

    } catch (err) {
      console.error('Error in translate->speak flow:', err);
      showInfo('Failed to connect to translation service.');
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  });

  // Add keyboard shortcut (Ctrl+Enter to speak)
  inputText.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      speakBtn.click();
    }
  });
});