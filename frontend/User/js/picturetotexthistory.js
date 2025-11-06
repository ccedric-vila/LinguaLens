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

// Function to get confidence class for styling
function getConfidenceClass(confidence) {
    if (!confidence || confidence === 'N/A') return 'low';
    
    const score = parseFloat(confidence);
    if (isNaN(score)) return 'low';
    
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
}

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
    
    // Calculate average confidence
    const validConfidences = data.filter(item => {
        const score = parseFloat(item.confidence_score);
        return !isNaN(score) && score > 0;
    }).map(item => parseFloat(item.confidence_score));
    
    const avgConfidence = validConfidences.length > 0 
        ? (validConfidences.reduce((a, b) => a + b, 0) / validConfidences.length).toFixed(1)
        : 0;

    document.getElementById('totalRecords').textContent = totalRecords;
    document.getElementById('todayRecords').textContent = todayRecords;
    document.getElementById('avgConfidence').textContent = avgConfidence + '%';
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
    const tableBody = document.getElementById("historyTable");
    
    // Check if tableBody exists
    if (!tableBody) {
        console.error('Table body element not found!');
        return;
    }
    
    tableBody.innerHTML = "";

    if (!allData || allData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="no-data">
                    <div>📖 No analysis history found</div>
                    <div style="margin-top: 10px; font-size: 0.9rem; color: #78909c;">
                        Your image analysis and translation history will appear here.
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
            <td>${displayNumber}</td>
            <td>
                <div class="filename">${item.filename || 'Unknown File'}</div>
            </td>
            <td>
                <div class="text-content">${formatTextContent(item.extracted_text)}</div>
            </td>
            <td>
                <div class="text-content">${formatTextContent(item.translated_text)}</div>
            </td>
            <td>
                <span class="language-badge">${getLanguageName(item.source_language)}</span> → 
                <span class="language-badge">${getLanguageName(item.target_language)}</span>
            </td>
            <td>
                <span class="confidence-${getConfidenceClass(item.confidence_score)}">
                    ${item.confidence_score}%
                </span>
            </td>
            <td>${item.processing_time || 'N/A'}</td>
            <td>
                <div class="timestamp">${formatDate(item.created_at)}</div>
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
    
    // Update statistics
    updateStatistics(allData);
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
            document.getElementById("historyTable").innerHTML = `
                <tr>
                    <td colspan="8" class="no-data">
                        <div>🔒 User not logged in</div>
                        <div style="margin-top: 10px; font-size: 0.9rem; color: #78909c;">
                            Please log in to view your analysis history.
                        </div>
                    </td>
                </tr>`;
            return;
        }

        console.log('Fetching analysis history for user:', userId);
        // ✅ CORRECTED: Use the proper endpoint with userId
        const response = await fetch(`http://localhost:3000/api/picturetotexthistory/${userId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Analysis history loaded:', data.length, 'records');
        
        // Store data and render
        allData = data;
        currentPage = 1;
        renderTable(currentPage);
        
    } catch (err) {
        console.error("Error loading analysis history:", err);
        document.getElementById("historyTable").innerHTML = `
            <tr>
                <td colspan="8" class="no-data">
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