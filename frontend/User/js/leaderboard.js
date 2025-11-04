// public/js/leaderboard.js - ENHANCED VERSION
let currentPage = 1;
const rowsPerPage = 10;
let allData = [];
let currentView = 'overall';

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

// Convert country code to flag emoji
function getFlagEmoji(countryCode) {
    if (!countryCode) return '🌐';
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
    return '🌐';
}

// Function to render table with pagination
function renderTable(page) {
    const table = document.getElementById("leaderboardTable");
    const pagination = document.getElementById("pagination");
    table.innerHTML = "";

    if (!allData.length) {
        table.innerHTML = `<tr><td colspan="4" class="no-data">No data found</td></tr>`;
        pagination.style.display = 'none';
        return;
    }

    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedData = allData.slice(start, end);

    paginatedData.forEach((row, index) => {
        const tr = document.createElement("tr");
        const globalIndex = start + index;
        
        if (currentView === 'engagement') {
            tr.innerHTML = `
                <td>${escapeHtml(row.user_level)}</td>
                <td class="center activities">${row.user_count}</td>
                <td class="center activities">${row.percentage}%</td>
            `;
            table.appendChild(tr);
            return;
        } 
        
        if (currentView === 'languages') {
            const flag = getLanguageFlag(row.language);
            tr.innerHTML = `
                <td>
                    <div class="language-cell">
                        <span class="flag-icon">${flag}</span>
                        <div class="language-info">
                            <span class="language-name">${escapeHtml(row.language)}</span>
                            <span class="language-code">${row.language.toUpperCase()}</span>
                        </div>
                    </div>
                </td>
                <td class="center activities">${row.total_usage}</td>
                <td class="center activities">${row.percentage}%</td>
            `;
            table.appendChild(tr);
            return;
        }

        if (currentView === 'tts-engines') {
            tr.innerHTML = `
                <td>
                    <span class="engine-badge">${escapeHtml(row.engine_used || 'Unknown')}</span>
                </td>
                <td class="center activities">${row.total_usage}</td>
                <td class="center activities">${row.unique_users}</td>
                <td class="center activities">${row.percentage}%</td>
            `;
            table.appendChild(tr);
            return;
        }

        // User ranking views
        let activityCount, rank;
        if (currentView === 'overall') {
            activityCount = row.total_activities;
            rank = globalIndex + 1;
        } else {
            activityCount = row.activities_this_week || row.activities_this_month;
            rank = row.rank_position;
        }

        const initials = getUserInitials(row.name);
        const memberSince = row.member_since ? new Date(row.member_since).toLocaleDateString() : "N/A";

        tr.innerHTML = `
            <td class="rank rank-${rank}">${rank}</td>
            <td>
                <div class="user-info">
                    <div class="avatar">${initials}</div>
                    <div class="user-details">
                        <div class="name">${escapeHtml(row.name || 'Unknown User')}</div>
                        <div class="email">${escapeHtml(row.email || 'No email')}</div>
                    </div>
                </div>
            </td>
            <td class="activities">${activityCount}</td>
            <td class="member-since">${memberSince}</td>
        `;
        table.appendChild(tr);
    });

    // Show/hide pagination
    if (allData.length > rowsPerPage) {
        pagination.style.display = 'flex';
        document.getElementById("pageInfo").textContent =
            `Page ${page} of ${Math.ceil(allData.length / rowsPerPage)}`;
        document.getElementById("prevPage").disabled = page === 1;
        document.getElementById("nextPage").disabled = end >= allData.length;
    } else {
        pagination.style.display = 'none';
    }
}

// Load leaderboard data
async function loadLeaderboard(type, timeframe = 'weekly') {
    currentView = type;
    currentPage = 1;
    
    try {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`[data-type="${type}"]`);
        if (activeBtn) activeBtn.classList.add('active');
        
        // Show/hide time filter
        const timeFilter = document.getElementById('timeFilter');
        if (type === 'timeframe') {
            timeFilter.classList.add('show');
            type = timeframe;
        } else {
            timeFilter.classList.remove('show');
        }
        
        // Update title
        const titles = {
            'overall': '📊 Overall Leaderboard',
            'weekly': '📅 Weekly Leaderboard',
            'monthly': '📅 Monthly Leaderboard',
            'engagement': '🎯 User Engagement Levels',
            'languages': '🌍 Most Used Languages',
            'tts-engines': '🔊 TTS Engine Statistics'
        };
        document.getElementById("leaderboardTitle").textContent = titles[type];
        
        // Show loading
        document.getElementById("leaderboardTable").innerHTML = 
            `<tr><td colspan="4" class="loading">Loading ${titles[type].toLowerCase()}...</td></tr>`;

        const res = await fetch(`${API_BASE_URL}/${type}`);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const result = await res.json();

        if (result.success) {
            allData = result.data || [];
            updateTableHeaders(type);
            renderTable(currentPage);
        } else {
            throw new Error(result.message || 'Failed to load data');
        }
    } catch (err) {
        console.error("Error loading leaderboard:", err);
        document.getElementById("leaderboardTable").innerHTML =
            `<tr><td colspan="4" class="error">Error loading data: ${err.message}</td></tr>`;
        document.getElementById("pagination").style.display = 'none';
    }
}

// Update table headers based on view
function updateTableHeaders(type) {
    const thead = document.getElementById("tableHead");
    
    if (type === 'engagement') {
        thead.innerHTML = `
            <tr>
                <th>Engagement Level</th>
                <th class="center">User Count</th>
                <th class="center">Percentage</th>
            </tr>
        `;
    } else if (type === 'languages') {
        thead.innerHTML = `
            <tr>
                <th>Language</th>
                <th class="center">Total Usage</th>
                <th class="center">Percentage</th>
            </tr>
        `;
    } else if (type === 'tts-engines') {
        thead.innerHTML = `
            <tr>
                <th>TTS Engine</th>
                <th class="center">Total Usage</th>
                <th class="center">Unique Users</th>
                <th class="center">Percentage</th>
            </tr>
        `;
    } else {
        thead.innerHTML = `
            <tr>
                <th>Rank</th>
                <th>User</th>
                <th class="center">Activities</th>
                <th>Member Since</th>
            </tr>
        `;
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
        }
    } catch (err) {
        console.error("Error loading user stats:", err);
        document.getElementById('totalUsers').textContent = 'Error';
        document.getElementById('newUsers7Days').textContent = 'Error';
        document.getElementById('newUsers30Days').textContent = 'Error';
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

// Pagination buttons
document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        renderTable(currentPage);
    }
});

document.getElementById("nextPage").addEventListener("click", () => {
    if (currentPage < Math.ceil(allData.length / rowsPerPage)) {
        currentPage++;
        renderTable(currentPage);
    }
});

// Tab button event listeners
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const type = e.target.getAttribute('data-type');
        if (type === 'timeframe') {
            const timeframe = document.getElementById('timeFilter').value;
            loadLeaderboard('timeframe', timeframe);
        } else {
            loadLeaderboard(type);
        }
    });
});

// Time filter change
document.getElementById('timeFilter').addEventListener('change', (e) => {
    loadLeaderboard('timeframe', e.target.value);
});

// Refresh button
document.getElementById("refreshBtn").addEventListener("click", () => {
    if (currentView === 'weekly' || currentView === 'monthly') {
        loadLeaderboard('timeframe', currentView);
    } else {
        loadLeaderboard(currentView);
    }
    loadUserStats();
});

// Auto-refresh every 2 minutes
setInterval(() => {
    if (currentView === 'weekly' || currentView === 'monthly') {
        loadLeaderboard('timeframe', currentView);
    } else {
        loadLeaderboard(currentView);
    }
    loadUserStats();
}, 120000);

// Initial load
document.addEventListener('DOMContentLoaded', function() {
    loadLeaderboard('overall');
    loadUserStats();
});