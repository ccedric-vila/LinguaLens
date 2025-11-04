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

                // Language used cell
                const languageCell = document.createElement("td");
                languageCell.textContent = item.language_used || "N/A";
                
                // Display language name if available
                if (item.language_used) {
                    const langOption = languageOptions.find(lang => lang.value === item.language_used);
                    if (langOption) {
                        languageCell.textContent = langOption.name;
                    }
                }

                // Engine used cell
                const engineCell = document.createElement("td");
                engineCell.textContent = item.engine_used || "standard";

                // Date cell
                const dateCell = document.createElement("td");
                dateCell.textContent = item.created_at
                    ? new Date(item.created_at).toLocaleString()
                    : "N/A";

                // ✅ Replay button
                const replayCell = document.createElement("td");
                const replayBtn = document.createElement("button");
                replayBtn.textContent = "🔊 Replay";
                replayBtn.style.cursor = "pointer";
                replayBtn.style.padding = "6px 12px";
                replayBtn.style.border = "none";
                replayBtn.style.borderRadius = "6px";
                replayBtn.style.backgroundColor = "#4299e1";
                replayBtn.style.color = "white";
                replayBtn.style.fontWeight = "500";
                replayBtn.onclick = () => {
                    if (!item.text_content) return;

                    // Use the same engine and language as stored
                    const engine = item.engine_used || "standard";
                    const language = item.language_used || "en";

                    puter.ai.txt2speech(item.text_content, { 
                        engine: engine,
                        language: language // Pass the language to TTS
                    })
                        .then(audio => audio.play())
                        .catch(err => {
                            console.error("Replay failed:", err);
                            alert("Failed to replay this text.");
                        });
                };
                replayCell.appendChild(replayBtn);

                row.appendChild(textCell);
                row.appendChild(languageCell); // Add language column
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