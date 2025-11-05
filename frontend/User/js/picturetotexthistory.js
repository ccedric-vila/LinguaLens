let currentPage = 1;
const rowsPerPage = 8;
let allData = [];

// Language options for displaying language names
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

// Function to calculate statistics
function updateStatistics(data) {
    const totalRecords = data.length;
    const today = new Date().toDateString();
    const todayRecords = data.filter(item => {
        if (!item.created_at) return false;
        try {
            const itemDate = new Date(item.created_at).toDateString();
            return itemDate === today;
        } catch (e) {
            return false;
        }
    }).length;
    
    const uniqueLanguages = [...new Set(data.map(item => item.language_used).filter(Boolean))].length;

    document.getElementById('totalRecords').textContent = totalRecords;
    document.getElementById('todayRecords').textContent = todayRecords;
    document.getElementById('uniqueLanguages').textContent = uniqueLanguages;
}

// Function to format text content
function formatTextContent(text) {
    if (!text || text === 'undefined' || text === 'N/A') {
        return '<em style="color: #78909c; font-style: italic;">No text content</em>';
    }
    
    // Escape HTML and limit length
    const div = document.createElement('div');
    div.textContent = text;
    const escapedText = div.innerHTML;
    
    if (text.length > 150) {
        return escapedText.substring(0, 150) + '...';
    }
    return escapedText;
}

// Function to format date properly
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch (error) {
        console.error('Date formatting error:', error);
        return 'Invalid Date';
    }
}

// Function to get language name
function getLanguageName(languageCode) {
    if (!languageCode) return 'N/A';
    const langOption = languageOptions.find(lang => lang.value === languageCode);
    return langOption ? langOption.name : languageCode.toUpperCase();
}

// Function to render table with pagination
function renderTable(page) {
    const tableBody = document.getElementById("ttsHistoryTableBody");
    tableBody.innerHTML = "";

    if (!allData || allData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="no-data">
                    <div>🎵 No TTS history found</div>
                    <div style="margin-top: 10px; font-size: 0.9rem; color: #78909c;">
                        Your text-to-speech conversion history will appear here.
                    </div>
                </td>
            </tr>`;
        return;
    }

    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedData = allData.slice(start, end);

    paginatedData.forEach((item, index) => {
        const row = document.createElement("tr");
        const displayNumber = start + index + 1;

        row.innerHTML = `
            <td>
                <div class="text-content">${formatTextContent(item.text_content)}</div>
            </td>
            <td>
                <span class="language-badge">${getLanguageName(item.language_used)}</span>
            </td>
            <td>
                <span class="engine-badge">${item.engine_used || 'standard'}</span>
            </td>
            <td>
                <div class="timestamp">${formatDate(item.created_at)}</div>
            </td>
            <td>
                <button class="replay-btn" onclick="replayTTS('${item.text_content?.replace(/'/g, "\\'")}', '${item.engine_used || 'standard'}', '${item.language_used || 'en'}')">
                    🔊 Play
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Update pagination info
    const totalPages = Math.ceil(allData.length / rowsPerPage);
    document.getElementById("pageInfo").textContent = `Page ${page} of ${totalPages}`;

    // Enable/disable buttons
    document.getElementById("prevPage").disabled = page === 1;
    document.getElementById("nextPage").disabled = page === totalPages || totalPages === 0;
}

// Replay TTS function
function replayTTS(text, engine, language) {
    if (!text || text === 'undefined') {
        alert("No text content available for replay.");
        return;
    }

    puter.ai.txt2speech(text, { 
        engine: engine,
        language: language
    })
    .then(audio => {
        audio.play().catch(err => {
            console.error("Audio play failed:", err);
            alert("Failed to play audio. Please check your audio settings.");
        });
    })
    .catch(err => {
        console.error("TTS replay failed:", err);
        alert("Failed to generate speech. Please try again.");
    });
}

// Load history data
async function loadHistory() {
    try {
        const userId = localStorage.getItem("userId"); 
        
        if (!userId) {
            document.getElementById("ttsHistoryTableBody").innerHTML = `
                <tr>
                    <td colspan="5" class="no-data">
                        <div>🔒 User not logged in</div>
                        <div style="margin-top: 10px; font-size: 0.9rem; color: #78909c;">
                            Please log in to view your TTS history.
                        </div>
                    </td>
                </tr>`;
            return;
        }

        console.log('Fetching TTS history for user:', userId);
        const response = await fetch(`http://localhost:3000/api/tts-history/${userId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const history = Array.isArray(data) ? data : (data.history || []);
        
        console.log('TTS history loaded:', history.length, 'records');
        
        // Update statistics
        updateStatistics(history);
        
        // Store data and render
        allData = history;
        currentPage = 1;
        renderTable(currentPage);
        
    } catch (err) {
        console.error("Error loading TTS history:", err);
        document.getElementById("ttsHistoryTableBody").innerHTML = `
            <tr>
                <td colspan="5" class="no-data">
                    <div>❌ Error loading history</div>
                    <div style="margin-top: 10px; font-size: 0.9rem; color: #78909c;">
                        Please check your connection and try again.
                    </div>
                </td>
            </tr>`;
    }
}

// Pagination event listeners
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("prevPage").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable(currentPage);
        }
    });

    document.getElementById("nextPage").addEventListener("click", () => {
        const totalPages = Math.ceil(allData.length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTable(currentPage);
        }
    });

    // Initial load
    loadHistory();
});