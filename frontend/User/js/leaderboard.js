// public/js/leaderboard.js - ENHANCED VERSION
let currentLanguagePeriod = 'all';

// API Base URL - Change this to your backend URL
const API_BASE_URL = 'http://localhost:3000/api/leaderboards';

// Country flag mapping for languages
const languageToCountries = {
    "af": ["ZA"], "sq": ["AL"], "am": ["ET"], "ar": ["SA", "EG", "AE", "MA", "IQ"],
    "hy": ["AM"], "az": ["AZ"], "eu": ["ES"], "be": ["BY"], "bn": ["BD", "IN"],
    "bs": ["BA"], "bg": ["BG"], "ca": ["ES"], "ceb": ["PH"], "ny": ["MW"],
    "zh-cn": ["CN"], "zh-tw": ["TW"], "co": ["FR"], "hr": ["HR"], "cs": ["CZ"],
    "da": ["DK"], "nl": ["NL", "BE"], "en": ["US", "GB", "CA", "AU", "PH"],
    "eo": ["EU"], "et": ["EE"], "tl": ["PH"], "fi": ["FI"], "fr": ["FR", "CA", "BE"],
    "fy": ["NL"], "gl": ["ES"], "ka": ["GE"], "de": ["DE", "AT", "CH"],
    "el": ["GR", "CY"], "gu": ["IN"], "ht": ["HT"], "ha": ["NG"], "haw": ["US"],
    "iw": ["IL"], "he": ["IL"], "hi": ["IN"], "hmn": ["CN"], "hu": ["HU"],
    "is": ["IS"], "ig": ["NG"], "id": ["ID"], "ga": ["IE"], "it": ["IT"],
    "ja": ["JP"], "jw": ["ID"], "kn": ["IN"], "kk": ["KZ"], "km": ["KH"],
    "rw": ["RW"], "ko": ["KR"], "ku": ["IQ"], "ky": ["KG"], "lo": ["LA"],
    "la": ["VA"], "lv": ["LV"], "lt": ["LT"], "lb": ["LU"], "mk": ["MK"],
    "mg": ["MG"], "ms": ["MY"], "ml": ["IN"], "mt": ["MT"], "mi": ["NZ"],
    "mr": ["IN"], "mn": ["MN"], "my": ["MM"], "ne": ["NP"], "no": ["NO"],
    "or": ["IN"], "ps": ["AF"], "fa": ["IR"], "pl": ["PL"], "pt": ["PT", "BR"],
    "pa": ["IN"], "ro": ["RO"], "ru": ["RU"], "sm": ["WS"], "gd": ["GB"],
    "sr": ["RS"], "st": ["LS"], "sn": ["ZW"], "sd": ["PK"], "si": ["LK"],
    "sk": ["SK"], "sl": ["SI"], "so": ["SO"], "es": ["ES", "MX", "AR", "CO"],
    "su": ["ID"], "sw": ["KE", "TZ"], "sv": ["SE"], "tg": ["TJ"], "ta": ["IN", "LK"],
    "tt": ["RU"], "te": ["IN"], "th": ["TH"], "tr": ["TR"], "tk": ["TM"],
    "uk": ["UA"], "ur": ["PK"], "ug": ["CN"], "uz": ["UZ"], "vi": ["VN"],
    "cy": ["GB"], "xh": ["ZA"], "yi": ["IL"], "yo": ["NG"], "zu": ["ZA"]
};

// Language names mapping
const languageNames = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "ru": "Russian",
    "ja": "Japanese",
    "ko": "Korean",
    "zh-cn": "Chinese (Simplified)",
    "zh-tw": "Chinese (Traditional)",
    "ar": "Arabic",
    "hi": "Hindi",
    "bn": "Bengali",
    "pa": "Punjabi",
    "te": "Telugu",
    "mr": "Marathi",
    "ta": "Tamil",
    "ur": "Urdu",
    "gu": "Gujarati",
    "pl": "Polish",
    "uk": "Ukrainian",
    "ro": "Romanian",
    "nl": "Dutch",
    "el": "Greek",
    "cs": "Czech",
    "sv": "Swedish",
    "hu": "Hungarian",
    "fi": "Finnish",
    "no": "Norwegian",
    "da": "Danish",
    "tr": "Turkish",
    "vi": "Vietnamese",
    "th": "Thai",
    "id": "Indonesian",
    "ms": "Malay",
    "tl": "Tagalog",
    "fa": "Persian",
    "he": "Hebrew",
    "iw": "Hebrew"
};

// Convert country code to flag emoji
function getFlagEmoji(countryCode) {
    if (!countryCode) return '🌍';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

// Get flag for language
function getLanguageFlag(languageCode) {
    const lowerCode = languageCode.toLowerCase();
    const countries = languageToCountries[lowerCode];
    if (countries && countries.length > 0) {
        return getFlagEmoji(countries[0]);
    }
    return '🌍';
}

// Get language display name
function getLanguageName(languageCode) {
    const lowerCode = languageCode.toLowerCase();
    return languageNames[lowerCode] || languageCode.toUpperCase();
}

// Load language popularity data
async function loadLanguagePopularity(period = 'all') {
    try {
        const languagesList = document.getElementById('languagesList');
        languagesList.innerHTML = '<div class="loading">Loading languages data...</div>';

        const res = await fetch(`${API_BASE_URL}/languages?period=${period}`);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const result = await res.json();

        if (result.success && result.data) {
            // Filter out auto-detect and invalid languages
            const languages = result.data.filter(lang => 
                lang.language && 
                lang.language.toLowerCase() !== 'auto' && 
                !lang.language.toLowerCase().includes('detect')
            );
            
            if (languages.length === 0) {
                languagesList.innerHTML = '<div class="no-data">No language data available</div>';
                return;
            }

            let html = '';
            languages.slice(0, 10).forEach(lang => {
                const flag = getLanguageFlag(lang.language);
                const name = getLanguageName(lang.language);
                html += `
                    <div class="language-item">
                        <div class="flag-icon">${flag}</div>
                        <div class="language-info">
                            <div class="language-name">
                                ${escapeHtml(name)}
                                <span class="language-usage">${lang.total_usage || 0}</span>
                            </div>
                            <div class="language-code">${lang.language.toUpperCase()}</div>
                        </div>
                    </div>
                `;
            });
            
            languagesList.innerHTML = html;
        } else {
            throw new Error(result.message || 'Failed to load language data');
        }
    } catch (err) {
        console.error("Error loading language popularity:", err);
        document.getElementById('languagesList').innerHTML = 
            `<div class="error">Error loading language data: ${err.message}</div>`;
    }
}

// Load TTS engine statistics
async function loadTTSEngineStats() {
    try {
        const enginesList = document.getElementById('enginesList');
        enginesList.innerHTML = '<div class="loading">Loading engines data...</div>';

        const res = await fetch(`${API_BASE_URL}/tts-engines`);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const result = await res.json();

        if (result.success && result.data) {
            const engines = result.data;
            
            if (engines.length === 0) {
                enginesList.innerHTML = '<div class="no-data">No engine data available</div>';
                return;
            }

            let html = '';
            engines.forEach(engine => {
                html += `
                    <div class="engine-item">
                        <div class="engine-icon">🤖</div>
                        <div class="engine-info">
                            <div class="engine-name">
                                ${escapeHtml(engine.engine_used || 'Unknown')}
                                <span class="engine-usage">${engine.total_usage || 0}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            enginesList.innerHTML = html;
        } else {
            throw new Error(result.message || 'Failed to load engine data');
        }
    } catch (err) {
        console.error("Error loading TTS engine stats:", err);
        document.getElementById('enginesList').innerHTML = 
            `<div class="error">Error loading engine data: ${err.message}</div>`;
    }
}

// Load top users
async function loadTopUsers() {
    try {
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = '<div class="loading">Loading users data...</div>';

        const res = await fetch(`${API_BASE_URL}/overall`);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const result = await res.json();

        if (result.success && result.data) {
            const users = result.data;
            
            if (users.length === 0) {
                usersList.innerHTML = '<div class="no-data">No user data available</div>';
                return;
            }

            let html = '';
            users.slice(0, 10).forEach((user, index) => {
                const rank = index + 1;
                const initials = getUserInitials(user.name);
                const rankClass = rank <= 3 ? `rank-${rank}` : '';
                html += `
                    <div class="user-ranking">
                        <div class="rank ${rankClass}">${rank}</div>
                        <div class="user-info">
                            <div class="avatar">${initials}</div>
                            <div class="user-details">
                                <div class="name">${escapeHtml(user.name || 'Unknown User')}</div>
                                <div class="email">${escapeHtml(user.email || 'No email')}</div>
                            </div>
                        </div>
                        <div class="user-activities">${user.total_activities || 0}</div>
                    </div>
                `;
            });
            
            usersList.innerHTML = html;
        } else {
            throw new Error(result.message || 'Failed to load user data');
        }
    } catch (err) {
        console.error("Error loading top users:", err);
        document.getElementById('usersList').innerHTML = 
            `<div class="error">Error loading user data: ${err.message}</div>`;
    }
}

// Load user statistics
async function loadUserStats() {
    try {
        const res = await fetch(`${API_BASE_URL}/user-statistics`);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const result = await res.json();
        
        if (result.success && result.data) {
            const stats = result.data;
            document.getElementById('totalUsers').textContent = stats.total_users || 0;
            document.getElementById('newUsers7Days').textContent = stats.new_users_last_7_days || 0;
            document.getElementById('newUsers30Days').textContent = stats.new_users_last_30_days || 0;
            
            // Get total activities from overall leaderboard
            const resOverall = await fetch(`${API_BASE_URL}/overall`);
            if (resOverall.ok) {
                const resultOverall = await resOverall.json();
                if (resultOverall.success && resultOverall.data) {
                    const totalActivities = resultOverall.data.reduce((sum, user) => sum + (user.total_activities || 0), 0);
                    document.getElementById('totalActivities').textContent = totalActivities;
                }
            }
        }
    } catch (err) {
        console.error("Error loading user stats:", err);
        document.getElementById('totalUsers').textContent = 'Error';
        document.getElementById('newUsers7Days').textContent = 'Error';
        document.getElementById('newUsers30Days').textContent = 'Error';
        document.getElementById('totalActivities').textContent = 'Error';
    }
}

// Utility functions
function getUserInitials(name) {
    if (!name) return 'UU';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Time tab event listeners
    document.querySelectorAll('.time-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            // Update active tab
            document.querySelectorAll('.time-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            
            // Load data for selected period
            currentLanguagePeriod = e.target.getAttribute('data-period');
            loadLanguagePopularity(currentLanguagePeriod);
        });
    });

    // Refresh button
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            loadLanguagePopularity(currentLanguagePeriod);
            loadTTSEngineStats();
            loadTopUsers();
            loadUserStats();
        });
    }

    // Auto-refresh every 2 minutes
    setInterval(() => {
        loadLanguagePopularity(currentLanguagePeriod);
        loadTTSEngineStats();
        loadTopUsers();
        loadUserStats();
    }, 120000);

    // Initial load
    loadLanguagePopularity('all');
    loadTTSEngineStats();
    loadTopUsers();
    loadUserStats();
});