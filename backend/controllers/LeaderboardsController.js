// backend/controllers/LeaderboardsController.js - ENHANCED VERSION
const connection = require('../config/db');

// 🏆 Overall Leaderboard
exports.getOverallLeaderboard = (req, res) => {
    const query = `
        SELECT 
            u.id,
            u.name,
            u.email,
            (COALESCE(t.translation_count, 0) + 
             COALESCE(tts.tts_count, 0) + 
             COALESCE(ia.image_analysis_count, 0) + 
             COALESCE(iat.image_translator_count, 0)) as total_activities,
            u.created_at as member_since
        FROM users u
        LEFT JOIN (
            SELECT user_id, COUNT(*) as translation_count 
            FROM extracted_texts 
            GROUP BY user_id
        ) t ON u.id = t.user_id
        LEFT JOIN (
            SELECT user_id, COUNT(*) as tts_count 
            FROM tts_history 
            GROUP BY user_id
        ) tts ON u.id = tts.user_id
        LEFT JOIN (
            SELECT user_id, COUNT(*) as image_analysis_count 
            FROM image_analysis 
            GROUP BY user_id
        ) ia ON u.id = ia.user_id
        LEFT JOIN (
            SELECT user_id, COUNT(*) as image_translator_count 
            FROM image_analysis_translator 
            GROUP BY user_id
        ) iat ON u.id = iat.user_id
        WHERE (COALESCE(t.translation_count, 0) + 
               COALESCE(tts.tts_count, 0) + 
               COALESCE(ia.image_analysis_count, 0) + 
               COALESCE(iat.image_translator_count, 0)) > 0
        ORDER BY total_activities DESC
        LIMIT 20
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching overall leaderboard:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Database error', 
                error: err.message 
            });
        }
        res.json({
            success: true,
            data: results
        });
    });
};

// 📅 Weekly Leaderboard
exports.getWeeklyLeaderboard = (req, res) => {
    const query = `
        SELECT 
            u.id,
            u.name,
            u.email,
            COUNT(*) as activities_this_week,
            RANK() OVER (ORDER BY COUNT(*) DESC) as rank_position,
            u.created_at as member_since
        FROM (
            SELECT user_id, created_at FROM extracted_texts WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            UNION ALL
            SELECT user_id, created_at FROM tts_history WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            UNION ALL
            SELECT user_id, created_at FROM image_analysis WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            UNION ALL
            SELECT user_id, created_at FROM image_analysis_translator WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ) weekly_activities
        JOIN users u ON weekly_activities.user_id = u.id
        GROUP BY u.id, u.name, u.email, u.created_at
        ORDER BY activities_this_week DESC
        LIMIT 10
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching weekly leaderboard:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Database error', 
                error: err.message 
            });
        }
        res.json({
            success: true,
            data: results
        });
    });
};

// 📅 Monthly Leaderboard
exports.getMonthlyLeaderboard = (req, res) => {
    const query = `
        SELECT 
            u.id,
            u.name,
            u.email,
            COUNT(*) as activities_this_month,
            RANK() OVER (ORDER BY COUNT(*) DESC) as rank_position,
            u.created_at as member_since
        FROM (
            SELECT user_id, created_at FROM extracted_texts WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            UNION ALL
            SELECT user_id, created_at FROM tts_history WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            UNION ALL
            SELECT user_id, created_at FROM image_analysis WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            UNION ALL
            SELECT user_id, created_at FROM image_analysis_translator WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ) monthly_activities
        JOIN users u ON monthly_activities.user_id = u.id
        GROUP BY u.id, u.name, u.email, u.created_at
        ORDER BY activities_this_month DESC
        LIMIT 10
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching monthly leaderboard:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Database error', 
                error: err.message 
            });
        }
        res.json({
            success: true,
            data: results
        });
    });
};

// 🎯 Engagement Levels
exports.getEngagementLevels = (req, res) => {
    const query = `
        SELECT 
            CASE 
                WHEN total_activities >= 100 THEN 'Power User (100+)'
                WHEN total_activities >= 50 THEN 'Active User (50-99)'
                WHEN total_activities >= 20 THEN 'Regular User (20-49)'
                WHEN total_activities >= 5 THEN 'Casual User (5-19)'
                ELSE 'New User (1-4)'
            END as user_level,
            COUNT(*) as user_count,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users), 2) as percentage
        FROM (
            SELECT 
                u.id,
                (COALESCE(t.cnt, 0) + COALESCE(tts.cnt, 0) + 
                 COALESCE(ia.cnt, 0) + COALESCE(iat.cnt, 0)) as total_activities
            FROM users u
            LEFT JOIN (SELECT user_id, COUNT(*) as cnt FROM extracted_texts GROUP BY user_id) t ON u.id = t.user_id
            LEFT JOIN (SELECT user_id, COUNT(*) as cnt FROM tts_history GROUP BY user_id) tts ON u.id = tts.user_id
            LEFT JOIN (SELECT user_id, COUNT(*) as cnt FROM image_analysis GROUP BY user_id) ia ON u.id = ia.user_id
            LEFT JOIN (SELECT user_id, COUNT(*) as cnt FROM image_analysis_translator GROUP BY user_id) iat ON u.id = iat.user_id
        ) user_activities
        GROUP BY user_level
        ORDER BY MIN(total_activities) DESC
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching engagement levels:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Database error', 
                error: err.message 
            });
        }
        res.json({
            success: true,
            data: results
        });
    });
};

// 🌍 Most Used Languages
exports.getLanguagePopularity = (req, res) => {
    const query = `
        SELECT 
            language,
            SUM(usage_count) as total_usage,
            ROUND(SUM(usage_count) * 100.0 / (SELECT SUM(usage_count) FROM (
                SELECT COUNT(*) as usage_count FROM extracted_texts WHERE source_language IS NOT NULL
                UNION ALL SELECT COUNT(*) FROM extracted_texts WHERE target_language IS NOT NULL
                UNION ALL SELECT COUNT(*) FROM tts_history WHERE language_used IS NOT NULL
                UNION ALL SELECT COUNT(*) FROM image_analysis WHERE language_used IS NOT NULL
                UNION ALL SELECT COUNT(*) FROM image_analysis_translator WHERE source_language IS NOT NULL
                UNION ALL SELECT COUNT(*) FROM image_analysis_translator WHERE target_language IS NOT NULL
            ) total), 2) as percentage
        FROM (
            SELECT source_language as language, COUNT(*) as usage_count 
            FROM extracted_texts WHERE source_language IS NOT NULL GROUP BY source_language
            UNION ALL
            SELECT target_language, COUNT(*) 
            FROM extracted_texts WHERE target_language IS NOT NULL GROUP BY target_language
            UNION ALL
            SELECT language_used, COUNT(*) 
            FROM tts_history WHERE language_used IS NOT NULL GROUP BY language_used
            UNION ALL
            SELECT language_used, COUNT(*) 
            FROM image_analysis WHERE language_used IS NOT NULL GROUP BY language_used
            UNION ALL
            SELECT source_language, COUNT(*) 
            FROM image_analysis_translator WHERE source_language IS NOT NULL GROUP BY source_language
            UNION ALL
            SELECT target_language, COUNT(*) 
            FROM image_analysis_translator WHERE target_language IS NOT NULL GROUP BY target_language
        ) all_languages
        GROUP BY language
        ORDER BY total_usage DESC
        LIMIT 20
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching language popularity:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Database error', 
                error: err.message 
            });
        }
        res.json({
            success: true,
            data: results
        });
    });
};

// 🔊 Most Used TTS Engines
exports.getTTSEngineStats = (req, res) => {
    const query = `
        SELECT 
            engine_used,
            COUNT(*) as total_usage,
            COUNT(DISTINCT user_id) as unique_users,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tts_history), 2) as percentage
        FROM tts_history
        WHERE engine_used IS NOT NULL
        GROUP BY engine_used
        ORDER BY total_usage DESC
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching TTS engine stats:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Database error', 
                error: err.message 
            });
        }
        res.json({
            success: true,
            data: results
        });
    });
};

// 📊 User Statistics
exports.getUserStatistics = (req, res) => {
    const query = `
        SELECT 
            COUNT(*) as total_users,
            COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as new_users_last_7_days,
            COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as new_users_last_30_days
        FROM users
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching user statistics:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Database error', 
                error: err.message 
            });
        }
        res.json({
            success: true,
            data: results[0]
        });
    });
};