<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LinguaLens - Interactive Quiz Platform</title>
    <script src="https://js.puter.com/v2/"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            min-height: 100vh;
            position: relative;
            overflow-x: hidden;
            color: #333;
        }

        /* Animated Background Particles */
        .particles {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            z-index: 0;
            pointer-events: none;
        }

        .particle {
            position: absolute;
            width: 3px;
            height: 3px;
            background: rgba(33, 150, 243, 0.4);
            border-radius: 50%;
            animation: float 20s infinite;
        }

        @keyframes float {
            0%, 100% {
                transform: translateY(0) translateX(0) scale(1);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateY(-100vh) translateX(50px) scale(1.5);
                opacity: 0;
            }
        }

        /* Header Section */
        .header {
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
            border: 3px solid #0D47A1;
            padding: 15px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            z-index: 100;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            animation: slideDown 0.6s ease-out;
        }

        @keyframes slideDown {
            from {
                transform: translateY(-100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .header-title {
            font-size: 32px;
            font-weight: bold;
            color: white;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
            letter-spacing: 2px;
            animation: fadeIn 0.8s ease-out 0.2s both;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: scale(0.9);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }

        .user-profile {
            display: flex;
            align-items: center;
            gap: 15px;
            cursor: pointer;
            padding: 8px 15px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 30px;
            transition: all 0.3s ease;
            animation: slideLeft 0.6s ease-out 0.3s both;
        }

        @keyframes slideLeft {
            from {
                opacity: 0;
                transform: translateX(50px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .user-profile:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }

        .user-name {
            color: white;
            font-weight: 600;
            font-size: 16px;
        }

        .user-avatar {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
        }

        .user-profile:hover .user-avatar {
            transform: rotate(360deg);
        }

        /* Main Content */
        .main-content {
            padding: 40px;
            position: relative;
            max-width: 1400px;
            margin: 0 auto;
        }

        .content-header {
            text-align: center;
            margin-bottom: 50px;
            animation: fadeInUp 0.8s ease-out 0.6s both;
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .content-title {
            font-size: 36px;
            font-weight: bold;
            color: #0D47A1;
            margin-bottom: 15px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }

        .content-description {
            font-size: 18px;
            color: #1976D2;
            font-weight: 500;
            max-width: 900px;
            margin: 0 auto;
            line-height: 1.7;
            padding: 20px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
        }

        /* Feature Cards Grid */
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 35px;
            margin: 0 auto 60px;
            padding: 20px;
        }

        .feature-card {
            background: white;
            border: 3px solid #2196F3;
            border-radius: 20px;
            padding: 40px 30px;
            text-align: center;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 8px 25px rgba(33, 150, 243, 0.15);
            position: relative;
            overflow: hidden;
            opacity: 0;
            animation: cardAppear 0.6s ease-out forwards;
        }

        .feature-card:nth-child(1) { animation-delay: 0.7s; }
        .feature-card:nth-child(2) { animation-delay: 0.85s; }
        .feature-card:nth-child(3) { animation-delay: 1s; }
        .feature-card:nth-child(4) { animation-delay: 1.15s; }

        @keyframes cardAppear {
            from {
                opacity: 0;
                transform: translateY(50px) scale(0.9);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .feature-card::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, rgba(33, 150, 243, 0.1), transparent);
            transform: rotate(45deg);
            transition: all 0.6s ease;
        }

        .feature-card:hover::before {
            left: 100%;
        }

        .feature-card:hover {
            transform: translateY(-15px) scale(1.05);
            box-shadow: 0 20px 40px rgba(33, 150, 243, 0.3);
            border-color: #1976D2;
            background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
        }

        .feature-card:active {
            transform: translateY(-12px) scale(1.02);
        }

        .feature-icon {
            width: 120px;
            height: 120px;
            margin: 0 auto 25px;
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 50px;
            transition: all 0.4s ease;
            box-shadow: 0 8px 20px rgba(33, 150, 243, 0.3);
            position: relative;
        }

        .feature-card:hover .feature-icon {
            transform: rotateY(360deg) scale(1.1);
            box-shadow: 0 12px 30px rgba(33, 150, 243, 0.5);
        }

        .feature-icon::after {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 20px;
            background: inherit;
            filter: blur(20px);
            opacity: 0.5;
            z-index: -1;
        }

        .feature-title {
            font-size: 22px;
            font-weight: bold;
            color: #0D47A1;
            margin-bottom: 12px;
            transition: all 0.3s ease;
        }

        .feature-card:hover .feature-title {
            color: #1976D2;
            transform: scale(1.05);
        }

        .feature-description {
            font-size: 14px;
            color: #546E7A;
            line-height: 1.6;
            transition: all 0.3s ease;
        }

        .feature-card:hover .feature-description {
            color: #37474F;
        }

        /* Ripple Effect */
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(33, 150, 243, 0.5);
            transform: scale(0);
            animation: ripple-effect 0.6s ease-out;
            pointer-events: none;
        }

        @keyframes ripple-effect {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }

        /* Leaderboards and History Section */
        .stats-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 30px;
            margin-bottom: 60px;
        }

        .stats-card {
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            border: 2px solid #BBDEFB;
            transition: all 0.3s ease;
        }

        .stats-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
            border-color: #2196F3;
        }

        .stats-header {
            display: flex;
            align-items: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #E3F2FD;
        }

        .stats-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            margin-right: 15px;
            box-shadow: 0 4px 10px rgba(33, 150, 243, 0.3);
        }

        .stats-title {
            font-size: 24px;
            font-weight: bold;
            color: #0D47A1;
        }

        .stats-list {
            list-style-type: none;
        }

        .stats-item {
            padding: 15px 0;
            border-bottom: 1px solid #E3F2FD;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s ease;
        }

        .stats-item:hover {
            background: #F5FBFF;
            padding-left: 10px;
            border-radius: 8px;
        }

        .stats-item:last-child {
            border-bottom: none;
        }

        .user-rank {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .rank-number {
            width: 30px;
            height: 30px;
            background: #2196F3;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
        }

        .rank-1 .rank-number {
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
        }

        .rank-2 .rank-number {
            background: linear-gradient(135deg, #C0C0C0 0%, #A9A9A9 100%);
        }

        .rank-3 .rank-number {
            background: linear-gradient(135deg, #CD7F32 0%, #8B4513 100%);
        }

        .user-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .user-avatar-small {
            width: 35px;
            height: 35px;
            border-radius: 50%;
            background: #E3F2FD;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }

        .user-score {
            font-weight: bold;
            color: #0D47A1;
            font-size: 18px;
        }

        .history-item {
            padding: 15px 0;
            border-bottom: 1px solid #E3F2FD;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s ease;
        }

        .history-item:hover {
            background: #F5FBFF;
            padding-left: 10px;
            border-radius: 8px;
        }

        .history-item:last-child {
            border-bottom: none;
        }

        .history-info {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .history-title {
            font-weight: bold;
            color: #0D47A1;
        }

        .history-date {
            font-size: 12px;
            color: #78909C;
        }

        .history-score {
            font-weight: bold;
            color: #2196F3;
            font-size: 18px;
        }

        /* Interactive Quiz Preview */
        .quiz-preview {
            background: white;
            border-radius: 20px;
            padding: 30px;
            margin-top: 40px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            border: 2px solid #BBDEFB;
            text-align: center;
        }

        .quiz-preview-title {
            font-size: 28px;
            font-weight: bold;
            color: #0D47A1;
            margin-bottom: 20px;
        }

        .quiz-preview-description {
            font-size: 16px;
            color: #546E7A;
            margin-bottom: 30px;
            line-height: 1.6;
        }

        .quiz-stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-bottom: 30px;
        }

        .quiz-stat {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #2196F3;
        }

        .stat-label {
            font-size: 14px;
            color: #78909C;
        }

        .quiz-button {
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
            color: white;
            border: none;
            border-radius: 50px;
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 8px 20px rgba(33, 150, 243, 0.3);
        }

        .quiz-button:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 25px rgba(33, 150, 243, 0.4);
        }

        .quiz-button:active {
            transform: translateY(-2px);
        }

        /* Floating Chat Button */
        #chat-toggle-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 70px;
            height: 70px;
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
            color: white;
            border: none;
            border-radius: 50%;
            font-size: 32px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 25px rgba(33, 150, 243, 0.5);
            z-index: 1000;
            transition: all 0.3s ease;
            opacity: 0;
            animation: bounceIn 0.8s ease forwards;
            animation-delay: 1.3s;
        }

        @keyframes bounceIn {
            0% {
                opacity: 0;
                transform: scale(0);
            }
            50% {
                transform: scale(1.2);
            }
            70% {
                transform: scale(0.9);
            }
            100% {
                opacity: 1;
                transform: scale(1);
            }
        }

        #chat-toggle-btn:hover {
            transform: scale(1.15) rotate(15deg);
            box-shadow: 0 12px 35px rgba(33, 150, 243, 0.7);
        }

        #chat-toggle-btn:active {
            transform: scale(0.95);
        }

        #chat-toggle-btn::before {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: inherit;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
                opacity: 1;
            }
            50% {
                transform: scale(1.3);
                opacity: 0;
            }
        }

        /* Chat Window */
        #chatbox-container {
            position: fixed;
            bottom: 120px;
            right: 30px;
            width: 380px;
            height: 500px;
            background: white;
            border-radius: 25px;
            box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
            display: none;
            flex-direction: column;
            overflow: hidden;
            border: 3px solid #2196F3;
            z-index: 1000;
            transform-origin: bottom right;
        }

        #chatbox-container.open {
            display: flex;
            animation: chatboxOpen 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes chatboxOpen {
            from {
                opacity: 0;
                transform: scale(0.7) translateY(30px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }

        #chatbox-header {
            padding: 20px;
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
            color: white;
            font-weight: bold;
            text-align: center;
            font-size: 18px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }

        #chatbox-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            font-size: 14px;
            background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 30%, #E3F2FD 100%);
        }

        #chatbox-messages::-webkit-scrollbar {
            width: 8px;
        }

        #chatbox-messages::-webkit-scrollbar-track {
            background: #E3F2FD;
            border-radius: 10px;
        }

        #chatbox-messages::-webkit-scrollbar-thumb {
            background: #2196F3;
            border-radius: 10px;
        }

        #chatbox-messages::-webkit-scrollbar-thumb:hover {
            background: #1976D2;
        }

        .message {
            margin-bottom: 15px;
            padding: 12px 16px;
            border-radius: 20px;
            max-width: 75%;
            word-wrap: break-word;
            animation: messageSlide 0.3s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        @keyframes messageSlide {
            from {
                opacity: 0;
                transform: translateY(15px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .user-message {
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
            color: white;
            margin-left: auto;
            text-align: right;
            border-bottom-right-radius: 5px;
        }

        .bot-message {
            background: white;
            color: #333;
            margin-right: auto;
            border-bottom-left-radius: 5px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        #chatbox-input {
            display: flex;
            border-top: 2px solid #E3F2FD;
            background: white;
        }

        #chatbox-input input {
            flex: 1;
            padding: 18px;
            border: none;
            outline: none;
            font-size: 15px;
            border-radius: 0 0 0 22px;
        }

        #chatbox-input button {
            width: 80px;
            border: none;
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
            color: white;
            cursor: pointer;
            font-weight: 600;
            font-size: 15px;
            transition: all 0.3s ease;
            border-radius: 0 0 22px 0;
        }

        #chatbox-input button:hover {
            background: linear-gradient(135deg, #1976D2 0%, #0D47A1 100%);
        }

        #chatbox-input button:active {
            transform: scale(0.95);
        }

        .loading-dots {
            display: inline-block;
            padding: 12px 16px;
            background: white;
            border-radius: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .loading-dots span {
            display: inline-block;
            width: 10px;
            height: 10px;
            margin: 0 3px;
            background: #2196F3;
            border-radius: 50%;
            animation: dotPulse 1.4s infinite ease-in-out;
        }

        .loading-dots span:nth-child(1) {
            animation-delay: -0.32s;
        }

        .loading-dots span:nth-child(2) {
            animation-delay: -0.16s;
        }

        @keyframes dotPulse {
            0%, 80%, 100% {
                transform: scale(0.6);
                opacity: 0.4;
            }
            40% {
                transform: scale(1);
                opacity: 1;
            }
        }

        /* Dropdown Menu */
        .dropdown-menu {
            position: absolute;
            top: 70px;
            right: 20px;
            background: white;
            border: 2px solid #2196F3;
            border-radius: 15px;
            padding: 10px 0;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            display: none;
            z-index: 200;
            min-width: 200px;
            animation: dropdownSlide 0.3s ease;
        }

        @keyframes dropdownSlide {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .dropdown-menu.show {
            display: block;
        }

        .dropdown-item {
            padding: 12px 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            color: #0D47A1;
            font-weight: 500;
        }

        .dropdown-item:hover {
            background: #E3F2FD;
            padding-left: 25px;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            .header-title {
                font-size: 24px;
            }

            .main-content {
                padding: 20px;
            }

            .content-title {
                font-size: 28px;
            }

            .content-description {
                font-size: 16px;
                padding: 15px;
            }

            .features-grid {
                grid-template-columns: 1fr;
                gap: 25px;
                padding: 10px;
            }

            .stats-section {
                grid-template-columns: 1fr;
            }

            .stats-card {
                padding: 20px;
            }

            #chatbox-container {
                width: 90%;
                right: 5%;
                left: 5%;
            }

            #chat-toggle-btn {
                width: 60px;
                height: 60px;
                font-size: 28px;
            }
        }

        /* Loading Animation */
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <!-- Animated Background Particles -->
    <div class="particles" id="particles"></div>

    <!-- Header -->
    <div class="header">
        <div class="header-title">LinguaLens</div>
        <div class="user-profile" id="userProfile">
            <span class="user-name" id="userName">Quiz Master</span>
            <div class="user-avatar">👤</div>
        </div>
    </div>

    <!-- Dropdown Menu -->
    <div class="dropdown-menu" id="dropdownMenu">
        <div class="dropdown-item" onclick="window.location.href='profile.html'">👤 Edit Profile</div>
        <div class="dropdown-item" id="logoutBtn">🚪 Logout</div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
        <div class="content-header">
            <h1 class="content-title">Interactive Language Learning Platform</h1>
            <p class="content-description">
                Welcome to LinguaLens, your ultimate destination for language mastery! Our platform combines cutting-edge AI technology with engaging learning experiences to help you master new languages faster and more effectively. Whether you're a beginner looking to build foundational skills or an advanced learner aiming for fluency, our comprehensive suite of tools will guide you every step of the way. With interactive quizzes, real-time translation, text extraction from images, and text-to-speech capabilities, you'll have everything you need to break down language barriers and communicate confidently in any situation.
            </p>
        </div>

        <!-- Feature Cards Grid -->
        <div class="features-grid">
            <!-- Text Extract -->
            <div class="feature-card" onclick="window.location.href='pictureToTextTranslator.html'">
                <div class="feature-icon">📸</div>
                <h3 class="feature-title">Text Extract</h3>
                <p class="feature-description">
                    Extract text from images instantly with advanced OCR technology. Perfect for digitizing documents and capturing information from signs, menus, or any printed text.
                </p>
            </div>

            <!-- Text Translate -->
            <div class="feature-card" onclick="window.location.href='translator.html'">
                <div class="feature-icon">🌐</div>
                <h3 class="feature-title">Text Translate</h3>
                <p class="feature-description">
                    Translate text between 100+ languages with high accuracy. Break language barriers effortlessly with our advanced translation algorithms.
                </p>
            </div>

            <!-- Text to Speech -->
            <div class="feature-card" onclick="window.location.href='txttospeechwt.html'">
                <div class="feature-icon">🔊</div>
                <h3 class="feature-title">Text to Speech</h3>
                <p class="feature-description">
                    Convert written text to natural-sounding speech. Listen to content in multiple languages and voices to improve your pronunciation and comprehension.
                </p>
            </div>

            <!-- Quiz -->
            <div class="feature-card" onclick="window.location.href='quiz.html'">
                <div class="feature-icon">🧠</div>
                <h3 class="feature-title">Interactive Quiz</h3>
                <p class="feature-description">
                    Test your language skills with our engaging quizzes. Challenge yourself with various difficulty levels and track your progress over time.
                </p>
            </div>
        </div>

        <!-- Leaderboards and History Section -->
        <div class="stats-section">
            <!-- Leaderboards -->
            <div class="stats-card">
                <div class="stats-header">
                    <div class="stats-icon">🏆</div>
                    <h2 class="stats-title">Leaderboards</h2>
                </div>
                <ul class="stats-list">
                    <li class="stats-item rank-1">
                        <div class="user-rank">
                            <div class="rank-number">1</div>
                            <div class="user-info">
                                <div class="user-avatar-small">👑</div>
                                <span>LanguageMaster</span>
                            </div>
                        </div>
                        <div class="user-score">9,850</div>
                    </li>
                    <li class="stats-item rank-2">
                        <div class="user-rank">
                            <div class="rank-number">2</div>
                            <div class="user-info">
                                <div class="user-avatar-small">🌟</div>
                                <span>PolyglotPro</span>
                            </div>
                        </div>
                        <div class="user-score">8,920</div>
                    </li>
                    <li class="stats-item rank-3">
                        <div class="user-rank">
                            <div class="rank-number">3</div>
                            <div class="user-info">
                                <div class="user-avatar-small">⭐</div>
                                <span>WordWizard</span>
                            </div>
                        </div>
                        <div class="user-score">7,640</div>
                    </li>
                    <li class="stats-item">
                        <div class="user-rank">
                            <div class="rank-number">4</div>
                            <div class="user-info">
                                <div class="user-avatar-small">👤</div>
                                <span>GrammarGuru</span>
                            </div>
                        </div>
                        <div class="user-score">6,980</div>
                    </li>
                    <li class="stats-item">
                        <div class="user-rank">
                            <div class="rank-number">5</div>
                            <div class="user-info">
                                <div class="user-avatar-small">👤</div>
                                <span>VocabVirtuoso</span>
                            </div>
                        </div>
                        <div class="user-score">6,520</div>
                    </li>
                </ul>
            </div>

            <!-- History -->
            <div class="stats-card">
                <div class="stats-header">
                    <div class="stats-icon">📋</div>
                    <h2 class="stats-title">Recent Activity</h2>
                </div>
                <ul class="stats-list">
                    <li class="history-item">
                        <div class="history-info">
                            <div class="history-title">Advanced French Quiz</div>
                            <div class="history-date">Today, 14:30</div>
                        </div>
                        <div class="history-score">92%</div>
                    </li>
                    <li class="history-item">
                        <div class="history-info">
                            <div class="history-title">Spanish Text Translation</div>
                            <div class="history-date">Today, 11:15</div>
                        </div>
                        <div class="history-score">45 words</div>
                    </li>
                    <li class="history-item">
                        <div class="history-info">
                            <div class="history-title">German Text-to-Speech</div>
                            <div class="history-date">Yesterday, 16:45</div>
                        </div>
                        <div class="history-score">3 min</div>
                    </li>
                    <li class="history-item">
                        <div class="history-info">
                            <div class="history-title">Italian Text Extraction</div>
                            <div class="history-date">Yesterday, 09:20</div>
                        </div>
                        <div class="history-score">2 images</div>
                    </li>
                    <li class="history-item">
                        <div class="history-info">
                            <div class="history-title">Intermediate Japanese Quiz</div>
                            <div class="history-date">2 days ago</div>
                        </div>
                        <div class="history-score">78%</div>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Interactive Quiz Preview -->
        <div class="quiz-preview">
            <h2 class="quiz-preview-title">Ready for a Language Challenge?</h2>
            <p class="quiz-preview-description">
                Test your language skills with our interactive quiz system! Choose from multiple languages and difficulty levels, track your progress, and compete with other learners on our global leaderboard. Each quiz is carefully designed to improve your vocabulary, grammar, and comprehension skills through engaging question formats.
            </p>
            <div class="quiz-stats">
                <div class="quiz-stat">
                    <div class="stat-value">15+</div>
                    <div class="stat-label">Languages</div>
                </div>
                <div class="quiz-stat">
                    <div class="stat-value">500+</div>
                    <div class="stat-label">Quizzes</div>
                </div>
                <div class="quiz-stat">
                    <div class="stat-value">10k+</div>
                    <div class="stat-label">Questions</div>
                </div>
            </div>
            <button class="quiz-button" onclick="window.location.href='quiz.html'">Start Quiz Now</button>
        </div>
    </div>

    <!-- Floating Chat Button -->
    <button id="chat-toggle-btn">💬</button>

    <!-- Chat Window -->
    <div id="chatbox-container">
        <div id="chatbox-header">🤖 LinguaLens AI</div>
        <div id="chatbox-messages"></div>
        <div id="chatbox-input">
            <input type="text" id="userMessage" placeholder="Ask me anything..." />
            <button id="sendMessageBtn">Send</button>
        </div>
    </div>

    <script>
        // Generate animated particles
        const particlesContainer = document.getElementById('particles');
        for (let i = 0; i < 60; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 20 + 's';
            particle.style.animationDuration = (Math.random() * 15 + 15) + 's';
            particlesContainer.appendChild(particle);
        }

        // User profile dropdown
        const userProfile = document.getElementById('userProfile');
        const dropdownMenu = document.getElementById('dropdownMenu');

        userProfile.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            dropdownMenu.classList.remove('show');
        });

        dropdownMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        // Ripple effect for feature cards
        document.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('click', function(e) {
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const ripple = document.createElement('span');
                ripple.className = 'ripple';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                
                this.appendChild(ripple);
                
                setTimeout(() => ripple.remove(), 600);
            });
        });

        // Chat toggle functionality
        const chatToggleBtn = document.getElementById('chat-toggle-btn');
        const chatboxContainer = document.getElementById('chatbox-container');
        
        chatToggleBtn.addEventListener('click', function() {
            if (chatboxContainer.classList.contains('open')) {
                chatboxContainer.classList.remove('open');
                setTimeout(() => {
                    chatboxContainer.style.display = 'none';
                }, 300);
                this.innerHTML = '💬';
            } else {
                chatboxContainer.style.display = 'flex';
                setTimeout(() => {
                    chatboxContainer.classList.add('open');
                }, 10);
                this.innerHTML = '✖️';
            }
        });

        // Send message functionality
        const sendMessageBtn = document.getElementById('sendMessageBtn');
        const userMessageInput = document.getElementById('userMessage');
        const chatboxMessages = document.getElementById('chatbox-messages');

        // ✅ Add message in Messenger style
        function addMessage(sender, message, isUser = false) {
            const msgWrapper = document.createElement('div');
            msgWrapper.style.display = 'flex';
            msgWrapper.style.marginBottom = '10px';
            msgWrapper.style.alignItems = 'flex-end';

            const msgBubble = document.createElement('div');
            msgBubble.textContent = message;
            msgBubble.style.padding = '10px 14px';
            msgBubble.style.borderRadius = '15px';
            msgBubble.style.maxWidth = '70%';
            msgBubble.style.fontSize = '14px';
            msgBubble.style.wordWrap = 'break-word';

            if (isUser) {
                // ✅ User message (right + blue)
                msgWrapper.style.justifyContent = 'flex-end';
                msgBubble.style.backgroundColor = '#3498db';
                msgBubble.style.color = '#fff';
                msgBubble.style.borderBottomRightRadius = '3px';
            } else {
                // ✅ AI message (left + icon + white)
                msgWrapper.style.justifyContent = 'flex-start';

                const icon = document.createElement('img');
                icon.src = 'https://cdn-icons-png.flaticon.com/512/4712/4712109.png';
                icon.alt = 'AI';
                icon.style.width = '30px';
                icon.style.height = '30px';
                icon.style.marginRight = '8px';

                msgWrapper.appendChild(icon);

                msgBubble.style.backgroundColor = '#f1f1f1';
                msgBubble.style.color = '#000';
                msgBubble.style.borderBottomLeftRadius = '3px';
            }

            msgWrapper.appendChild(msgBubble);
            chatboxMessages.appendChild(msgWrapper);
            chatboxMessages.scrollTop = chatboxMessages.scrollHeight;
        }

        // ✅ Loading animation while AI responds
        function addLoadingMessage() {
            const loadingMsg = document.createElement('div');
            loadingMsg.style.display = 'flex';
            loadingMsg.style.alignItems = 'center';
            loadingMsg.style.marginBottom = '10px';

            const text = document.createElement('span');
            text.textContent = 'AI: ';
            loadingMsg.appendChild(text);

            const dots = document.createElement('span');
            dots.textContent = '.';
            dots.style.marginLeft = '4px';
            loadingMsg.appendChild(dots);

            chatboxMessages.appendChild(loadingMsg);
            chatboxMessages.scrollTop = chatboxMessages.scrollHeight;

            let dotCount = 1;
            const interval = setInterval(() => {
                dotCount = (dotCount % 3) + 1;
                dots.textContent = '.'.repeat(dotCount);
            }, 400);

            return { loadingMsg, interval };
        }

        // ✅ Auto-authenticate once
        (async function autoAuth() {
            try {
                if (puter?.auth?.signInAnonymously) {
                    await puter.auth.signInAnonymously();
                } else if (puter?.auth?.anonymous) {
                    await puter.auth.anonymous();
                } else if (puter?.auth?.signIn) {
                    await puter.auth.signIn();
                } else {
                    console.error("No valid Puter auth method found.");
                }
                console.log("✅ Auto signed-in");
            } catch (err) {
                console.error("Auth Error:", err);
            }
        })();

        // ✅ Send message
        sendMessageBtn.addEventListener('click', async () => {
            const message = userMessageInput.value.trim();
            if (!message) return;

            addMessage('You', message, true);
            userMessageInput.value = '';

            // ✅ Show loading
            const { loadingMsg, interval } = addLoadingMessage();

            try {
                const aiReply = await puter.ai.chat(message);

                // ✅ Remove loading and show AI reply
                clearInterval(interval);
                chatboxMessages.removeChild(loadingMsg);
                addMessage('AI', aiReply || 'No response', false);
            } catch (error) {
                clearInterval(interval);
                chatboxMessages.removeChild(loadingMsg);
                console.error(error);
                addMessage('AI', 'Error connecting to AI service.', false);
            }
        });

        userMessageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessageBtn.click();
            }
        });

        // Logout functionality
        const logoutBtn = document.getElementById('logoutBtn');

        function handleLogout() {
            console.log("Logging out...");
            
            // Create logout animation
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                animation: fadeIn 0.5s ease;
            `;
            
            const message = document.createElement('div');
            message.style.cssText = `
                color: white;
                font-size: 24px;
                font-weight: bold;
                text-align: center;
            `;
            message.innerHTML = 'Logging out...<br><div class="loading" style="margin-top: 20px;"></div>';
            
            overlay.appendChild(message);
            document.body.appendChild(overlay);
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        }

        logoutBtn.addEventListener('click', handleLogout);

        // Welcome text animation
        const welcomeText = document.querySelector('.content-description');
        const welcomeMessages = [
            "Welcome to LinguaLens, your ultimate destination for language mastery! Our platform combines cutting-edge AI technology with engaging learning experiences to help you master new languages faster and more effectively. Whether you're a beginner looking to build foundational skills or an advanced learner aiming for fluency, our comprehensive suite of tools will guide you every step of the way. With interactive quizzes, real-time translation, text extraction from images, and text-to-speech capabilities, you'll have everything you need to break down language barriers and communicate confidently in any situation.",
            "Transform how you learn languages with our interactive platform designed for modern learners. Our adaptive learning system personalizes your experience based on your progress, strengths, and areas for improvement. From vocabulary building to conversational practice, we provide a comprehensive learning ecosystem that makes language acquisition enjoyable and effective.",
            "Join thousands of language enthusiasts who have transformed their communication skills with LinguaLens. Our community-driven approach combines the latest in educational technology with proven language learning methodologies to deliver results you can measure and feel confident about in real-world situations."
        ];
        
        let currentMessageIndex = 0;
        
        function changeWelcomeMessage() {
            welcomeText.style.opacity = 0;
            
            setTimeout(() => {
                currentMessageIndex = (currentMessageIndex + 1) % welcomeMessages.length;
                welcomeText.textContent = welcomeMessages[currentMessageIndex];
                welcomeText.style.opacity = 1;
            }, 500);
        }
        
        setInterval(changeWelcomeMessage, 8000);
    </script>
</body>
</html>