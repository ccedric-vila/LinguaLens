document.addEventListener("DOMContentLoaded", () => {
    const userId = localStorage.getItem("userId"); 
    const tableBody = document.getElementById("ttsHistoryTableBody");
    const noHistoryMessage = document.getElementById("noHistoryMessage");

    if (!userId) {
        alert("User not logged in. Cannot fetch history.");
        return;
    }

    // ✅ Updated endpoint to match the route
    fetch(`http://localhost:3000/api/tts-history/${userId}`)
        .then(response => response.json())
        .then(data => {
            const history = Array.isArray(data) ? data : data.history;

            if (!history || history.length === 0) {
                noHistoryMessage.style.display = "block";
                return;
            }

            history.forEach(item => {
                const row = document.createElement("tr");

                // Text content cell
                const textCell = document.createElement("td");
                textCell.textContent = item.text_content || "N/A";
                textCell.className = "text-cell";

                // Language used cell
                const languageCell = document.createElement("td");
                // Display language name if available
                if (item.language_used) {
                    const langOption = languageOptions.find(lang => lang.value === item.language_used);
                    if (langOption) {
                        languageCell.innerHTML = `<span class="language-badge">${langOption.name}</span>`;
                    } else {
                        languageCell.innerHTML = `<span class="language-badge">${item.language_used}</span>`;
                    }
                } else {
                    languageCell.innerHTML = '<span class="language-badge">N/A</span>';
                }

                // Engine used cell
                const engineCell = document.createElement("td");
                engineCell.innerHTML = `<span class="engine-badge">${item.engine_used || "standard"}</span>`;

                // Date cell
                const dateCell = document.createElement("td");
                dateCell.className = "date-cell";
                dateCell.textContent = item.created_at
                    ? new Date(item.created_at).toLocaleString()
                    : "N/A";

                // ✅ Replay button - FIXED VERSION
                const replayCell = document.createElement("td");
                const replayBtn = document.createElement("button");
                replayBtn.textContent = "🔊 Replay";
                replayBtn.className = "replay-btn";
                replayBtn.onclick = () => {
                    if (!item.text_content) {
                        alert("No text content available to replay.");
                        return;
                    }

                    // Use the same engine and language as stored
                    const engine = item.engine_used || "standard";
                    
                    // FIX: Convert 2-letter language codes to proper format for Puter AI
                    let language = item.language_used || "en";
                    
                    // Convert language code to proper format for Puter AI TTS
                    const languageMap = {
                        'en': 'en-US',
                        'es': 'es-ES', 
                        'fr': 'fr-FR',
                        'de': 'de-DE',
                        'it': 'it-IT',
                        'pt': 'pt-BR',
                        'ru': 'ru-RU',
                        'ja': 'ja-JP',
                        'ko': 'ko-KR',
                        'zh': 'zh-CN',
                        'ar': 'ar-SA',
                        'hi': 'hi-IN',
                        'tr': 'tr-TR',
                        'nl': 'nl-NL',
                        'sv': 'sv-SE',
                        'pl': 'pl-PL',
                        'vi': 'vi-VN',
                        'th': 'th-TH',
                        'el': 'el-GR',
                        'he': 'he-IL',
                        'id': 'id-ID',
                        'ms': 'ms-MY',
                        'cs': 'cs-CZ',
                        'da': 'da-DK',
                        'fi': 'fi-FI',
                        'hu': 'hu-HU',
                        'no': 'no-NO',
                        'ro': 'ro-RO',
                        'sk': 'sk-SK',
                        'uk': 'uk-UA',
                        'bg': 'bg-BG',
                        'hr': 'hr-HR',
                        'ca': 'ca-ES',
                        'fil': 'fil-PH',
                        'sr': 'sr-RS',
                        'sl': 'sl-SI',
                        'et': 'et-EE',
                        'lv': 'lv-LV',
                        'lt': 'lt-LT'
                    };

                    // Use mapped language or fallback to en-US
                    const mappedLanguage = languageMap[language] || 'en-US';

                    console.log("Replaying with:", {
                        text: item.text_content,
                        engine: engine,
                        original_language: language,
                        mapped_language: mappedLanguage
                    });

                    // Use Puter AI TTS with proper error handling
                    puter.ai.txt2speech(item.text_content, { 
                        engine: engine,
                        language: mappedLanguage
                    })
                        .then(audio => {
                            console.log("Audio loaded successfully, playing...");
                            return audio.play();
                        })
                        .then(() => {
                            console.log("Audio played successfully");
                        })
                        .catch(err => {
                            console.error("Replay failed:", err);
                            
                            // Try fallback with default language
                            console.log("Trying fallback with default language...");
                            puter.ai.txt2speech(item.text_content, { 
                                engine: engine,
                                language: "en-US" // Fallback to English
                            })
                                .then(audio => audio.play())
                                .then(() => {
                                    console.log("Audio played with fallback language");
                                })
                                .catch(fallbackErr => {
                                    console.error("Fallback also failed:", fallbackErr);
                                    alert("Failed to replay this text. Please try again.");
                                });
                        });
                };
                replayCell.appendChild(replayBtn);

                row.appendChild(textCell);
                row.appendChild(languageCell);
                row.appendChild(engineCell);
                row.appendChild(dateCell);
                row.appendChild(replayCell);

                tableBody.appendChild(row);
            });
        })
        .catch(err => {
            console.error("Error fetching TTS history:", err);
            alert("Failed to load history.");
        });
});

// Language options for displaying language names (same as in main file)
const languageOptions = [
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
    { value: 'tr', name: 'Turkish' },
    { value: 'nl', name: 'Dutch' },
    { value: 'sv', name: 'Swedish' },
    { value: 'pl', name: 'Polish' },
    { value: 'vi', name: 'Vietnamese' },
    { value: 'th', name: 'Thai' },
    { value: 'el', name: 'Greek' },
    { value: 'he', name: 'Hebrew' },
    { value: 'id', name: 'Indonesian' },
    { value: 'ms', name: 'Malay' },
    { value: 'cs', name: 'Czech' },
    { value: 'da', name: 'Danish' },
    { value: 'fi', name: 'Finnish' },
    { value: 'hu', name: 'Hungarian' },
    { value: 'no', name: 'Norwegian' },
    { value: 'ro', name: 'Romanian' },
    { value: 'sk', name: 'Slovak' },
    { value: 'uk', name: 'Ukrainian' },
    { value: 'bg', name: 'Bulgarian' },
    { value: 'hr', name: 'Croatian' },
    { value: 'ca', name: 'Catalan' },
    { value: 'fil', name: 'Filipino' },
    { value: 'sr', name: 'Serbian' },
    { value: 'sl', name: 'Slovenian' },
    { value: 'et', name: 'Estonian' },
    { value: 'lv', name: 'Latvian' },
    { value: 'lt', name: 'Lithuanian' }
];