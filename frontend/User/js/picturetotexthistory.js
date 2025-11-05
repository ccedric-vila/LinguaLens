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
    
    // Calculate average confidence
    const validConfidences = data.filter(item => item.confidence_score && !isNaN(parseFloat(item.confidence_score)));
    const avgConfidence = validConfidences.length > 0 
        ? (validConfidences.reduce((sum, item) => sum + parseFloat(item.confidence_score), 0) / validConfidences.length).toFixed(1)
        : 0;

    // Safe element updates with null checks
    const totalRecordsElem = document.getElementById('totalRecords');
    const todayRecordsElem = document.getElementById('todayRecords');
    const avgConfidenceElem = document.getElementById('avgConfidence');
    
    if (totalRecordsElem) totalRecordsElem.textContent = totalRecords;
    if (todayRecordsElem) todayRecordsElem.textContent = todayRecords;
    if (avgConfidenceElem) avgConfidenceElem.textContent = `${avgConfidence}%`;
}

// Function to format text content
function formatTextContent(text) {
    if (!text || text === 'undefined' || text === 'N/A' || text === 'No text extracted') {
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
    if (!languageCode || languageCode === 'N/A') return 'N/A';
    const langOption = languageOptions.find(lang => lang.value === languageCode);
    return langOption ? langOption.name : languageCode.toUpperCase();
}

// Function to get confidence class
function getConfidenceClass(confidence) {
    const score = parseFloat(confidence);
    if (isNaN(score)) return 'confidence-low';
    if (score >= 80) return 'confidence-high';
    if (score >= 60) return 'confidence-medium';
    return 'confidence-low';
}

// Function to render table with pagination
function renderTable(page) {
    const tableBody = document.getElementById("historyTable");
    if (!tableBody) {
        console.error('historyTable element not found');
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
                <div class="filename">${item.filename || 'Unknown'}</div>
            </td>
            <td>
                <div class="text-content">${formatTextContent(item.extracted_text)}</div>
            </td>
            <td>
                <div class="text-content">${formatTextContent(item.translated_text)}</div>
            </td>
            <td>
                <span class="language-badge">${getLanguageName(item.source_language)}</span>
                ${item.target_language && item.target_language !== 'N/A' ? 
                  `<span class="language-badge">→ ${getLanguageName(item.target_language)}</span>` : ''}
            </td>
            <td>
                <span class="${getConfidenceClass(item.confidence_score)}">
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
    const pageInfoElem = document.getElementById("pageInfo");
    if (pageInfoElem) {
        pageInfoElem.textContent = `Page ${page} of ${totalPages}`;
    }

    // Enable/disable buttons
    const prevButton = document.getElementById("prevPage");
    const nextButton = document.getElementById("nextPage");
    
    if (prevButton) prevButton.disabled = page === 1;
    if (nextButton) nextButton.disabled = page === totalPages || totalPages === 0;
}

// Load history data
async function loadHistory() {
    try {
        console.log('Fetching analysis history...');
        const response = await fetch('http://localhost:3000/api/picturetotexthistory');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const history = Array.isArray(data) ? data : [];
        
        console.log('Analysis history loaded:', history.length, 'records');
        
        // Update statistics
        updateStatistics(history);
        
        // Store data and render
        allData = history;
        currentPage = 1;
        renderTable(currentPage);
        
    } catch (err) {
        console.error("Error loading analysis history:", err);
        const tableBody = document.getElementById("historyTable");
        if (tableBody) {
            tableBody.innerHTML = `
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing history page...');
    
    // Add event listeners for pagination
    const prevButton = document.getElementById("prevPage");
    const nextButton = document.getElementById("nextPage");
    
    if (prevButton) {
        prevButton.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable(currentPage);
            }
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener("click", () => {
            const totalPages = Math.ceil(allData.length / rowsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderTable(currentPage);
            }
        });
    }

    // Initial load
    loadHistory();
});