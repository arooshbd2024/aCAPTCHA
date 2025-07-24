
// CAPTCHA Web Component
class CaptchaElement extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.challenges = [
            {
                title: "Select all text boxes with cars",
                correctImages: [0, 2, 5],
                imageTypes: ["car", "tree", "car", "house", "dog", "car", "bird", "flower", "mountain"],
                difficulty: "easy"
            },
            {
                title: "Select all text boxes with traffic lights",
                correctImages: [1, 4, 7],
                imageTypes: ["building", "traffic light", "cat", "beach", "traffic light", "sunset", "forest", "traffic light", "river"],
                difficulty: "medium"
            },
            {
                title: "Select all text boxes with bicycles",
                correctImages: [0, 3, 8],
                imageTypes: ["bicycle", "flower", "mountain", "bicycle", "tree", "house", "dog", "bird", "bicycle"],
                difficulty: "easy"
            },
            {
                title: "Select all text boxes with crosswalks",
                correctImages: [2, 4, 6, 8],
                imageTypes: ["car", "tree", "crosswalk", "house", "crosswalk", "dog", "crosswalk", "bird", "crosswalk"],
                difficulty: "hard"
            },
            {
                title: "Select all text boxes with fire hydrants",
                correctImages: [1, 5, 7],
                imageTypes: ["building", "fire hydrant", "cat", "beach", "sunset", "fire hydrant", "forest", "fire hydrant", "river"],
                difficulty: "medium"
            },
            {
                title: "Select all text boxes with motorcycles",
                correctImages: [0, 4, 6],
                imageTypes: ["motorcycle", "flower", "mountain", "tree", "motorcycle", "house", "motorcycle", "bird", "dog"],
                difficulty: "hard"
            },
            {
                title: "Select all text boxes with cars until none left",
                correctImages: [0, 2, 5],
                imageTypes: ["car", "tree", "car", "house", "dog", "car", "bird", "flower", "mountain"],
                difficulty: "extreme",
                mode: "until_none_left"
            },
            {
                title: "Select all text boxes with traffic lights until none left",
                correctImages: [1, 4, 7],
                imageTypes: ["building", "traffic light", "cat", "beach", "traffic light", "sunset", "forest", "traffic light", "river"],
                difficulty: "extreme",
                mode: "until_none_left"
            }
        ];

        this.currentChallenge = null;
        this.selectedImages = new Set();
        this.isVerified = false;
        this.attempts = 0;
        this.maxAttempts = 3;
        this.startTime = null;
        this.analytics = {
            totalAttempts: 0,
            successRate: 0,
            averageTime: 0,
            difficultyCounts: { easy: 0, medium: 0, hard: 0, extreme: 0 }
        };
        this.soundEnabled = true;
        this.darkMode = false;

        this.render();
        this.bindEvents();
        this.loadSettings();
    }

    static get observedAttributes() {
        return ['status', 'difficulty', 'sound-enabled', 'dark-mode'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'status' && oldValue !== newValue) {
            this.dispatchEvent(new CustomEvent('statuschange', {
                detail: { status: newValue },
                bubbles: true
            }));
        }
        if (name === 'sound-enabled') {
            this.soundEnabled = newValue !== 'false';
        }
        if (name === 'dark-mode') {
            this.darkMode = newValue === 'true';
            this.updateTheme();
        }
    }

    get status() {
        return this.getAttribute('status');
    }

    set status(value) {
        this.setAttribute('status', value);
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                :host {
                    font-family: 'Roboto', Arial, sans-serif;
                    display: block;
                    width: 100%;
                    max-width: 304px;
                }

                .captcha-container {
                    background: var(--bg-color, white);
                    border: 2px solid var(--border-color, #d3d3d3);
                    border-radius: 3px;
                    padding: 0;
                    width: 100%;
                    min-width: 280px;
                    max-width: 304px;
                    height: 78px;
                    position: relative;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    transition: all 0.3s ease;
                }

                .captcha-container.dark {
                    --bg-color: #2d2d2d;
                    --border-color: #555;
                    --text-color: #fff;
                    --logo-color: #64b5f6;
                }

                .captcha-container.verified {
                    border-color: #4caf50;
                    background: linear-gradient(135deg, #e8f5e8, #f1f8e9);
                }

                .captcha-container.failed {
                    border-color: #f44336;
                    animation: shake 0.5s ease-in-out;
                }

                .captcha-checkbox {
                    display: flex;
                    align-items: center;
                    padding: 20px;
                    height: 100%;
                }

                .checkbox-input {
                    display: none;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    flex: 1;
                }

                .checkmark {
                    width: 28px;
                    height: 28px;
                    border: 2px solid var(--border-color, #d3d3d3);
                    border-radius: 2px;
                    margin-right: 12px;
                    position: relative;
                    transition: all 0.3s ease;
                }

                .checkbox-input:checked + .checkbox-label .checkmark {
                    background-color: #4285f4;
                    border-color: #4285f4;
                }

                .checkbox-input:checked + .checkbox-label .checkmark::after {
                    content: '✓';
                    position: absolute;
                    color: white;
                    font-size: 18px;
                    font-weight: bold;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                }

                .checkbox-text {
                    font-size: 14px;
                    color: var(--text-color, #333);
                    user-select: none;
                    transition: color 0.3s ease;
                }

                .captcha-logo {
                    margin-left: auto;
                    text-align: center;
                    font-size: 10px;
                    color: #666;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                }

                .logo-text {
                    color: var(--logo-color, #4285f4);
                    font-weight: bold;
                    font-size: 12px;
                }

                .logo-subtext {
                    color: #999;
                    font-size: 9px;
                    margin-top: 2px;
                }

                .logo-controls {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    margin-top: 2px;
                }

                .settings-btn, .reset-btn {
                    background: none;
                    border: none;
                    color: #666;
                    font-size: 11px;
                    cursor: pointer;
                    padding: 2px 4px;
                    border-radius: 2px;
                    transition: all 0.2s ease;
                    min-width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0.7;
                }

                .settings-btn:hover, .reset-btn:hover {
                    opacity: 1;
                    background-color: rgba(0,0,0,0.1);
                    transform: scale(1.1);
                }

                .challenge-popup {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background-color: rgba(0, 0, 0, 0.5);
                    z-index: 10000;
                    justify-content: center;
                    align-items: center;
                }

                .challenge-popup.active {
                    display: flex;
                }

                .challenge-content {
                    background: var(--bg-color, white);
                    border-radius: 4px;
                    width: 450px;
                    max-width: 90vw;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .challenge-header {
                    background-color: #4285f4;
                    color: white;
                    padding: 15px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .challenge-header h3 {
                    font-size: 16px;
                    font-weight: normal;
                }

                .header-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .difficulty-badge {
                    background-color: rgba(255,255,255,0.2);
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: bold;
                    white-space: nowrap;
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .close-btn:hover {
                    background-color: rgba(255,255,255,0.1);
                    border-radius: 50%;
                }

                .challenge-body {
                    padding: 20px;
                    color: var(--text-color, #333);
                }

                .progress-bar {
                    width: 100%;
                    height: 4px;
                    background-color: #f0f0f0;
                    border-radius: 2px;
                    margin-bottom: 15px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background-color: #4285f4;
                    width: 0%;
                    transition: width 0.3s ease;
                }

                .text-box-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 4px;
                    margin-bottom: 20px;
                    background-color: var(--grid-bg, #f0f0f0);
                    padding: 4px;
                    border-radius: 4px;
                }

                .grid-text-box {
                    width: 100%;
                    height: 110px;
                    background-size: cover;
                    background-position: center;
                    cursor: pointer;
                    border: 3px solid transparent;
                    transition: all 0.2s ease;
                    border-radius: 2px;
                    position: relative;
                    background-color: #e0e0e0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    color: #666;
                    overflow: hidden;
                }

                .grid-text-box:hover {
                    opacity: 0.8;
                    transform: scale(1.02);
                }

                .grid-text-box.selected {
                    border-color: #4285f4;
                    opacity: 0.7;
                }

                .grid-text-box.selected::after {
                    content: '✓';
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background-color: #4285f4;
                    color: white;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: bold;
                    animation: checkmark 0.3s ease;
                }

                @keyframes checkmark {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }

                .challenge-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    font-size: 12px;
                    color: #666;
                }

                .timer {
                    font-weight: bold;
                    color: #4285f4;
                }

                .attempts-counter {
                    color: #f44336;
                }

                .challenge-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                }

                .control-group {
                    display: flex;
                    gap: 5px;
                }

                .refresh-btn, .audio-btn, .hint-btn {
                    background: none;
                    border: 1px solid var(--border-color, #d3d3d3);
                    padding: 8px 12px;
                    cursor: pointer;
                    border-radius: 2px;
                    font-size: 16px;
                    transition: all 0.2s ease;
                    color: var(--text-color, #333);
                }

                .refresh-btn:hover, .audio-btn:hover, .hint-btn:hover {
                    background-color: var(--hover-bg, #f0f0f0);
                    transform: translateY(-1px);
                }

                .verify-btn {
                    background-color: #4285f4;
                    color: white;
                    border: none;
                    padding: 10px 24px;
                    cursor: pointer;
                    border-radius: 2px;
                    font-size: 14px;
                    font-weight: bold;
                    transition: all 0.2s ease;
                }

                .verify-btn:hover {
                    background-color: #3367d6;
                    transform: translateY(-1px);
                }

                .verify-btn:disabled {
                    background-color: #ccc;
                    cursor: not-allowed;
                    transform: none;
                }

                .challenge-footer {
                    background-color: var(--footer-bg, #f8f9fa);
                    padding: 10px 20px;
                    border-top: 1px solid var(--border-color, #e0e0e0);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .analytics-info {
                    font-size: 9px;
                    color: #666;
                }

                .captcha-logo-small {
                    font-size: 9px;
                    color: #666;
                }

                .logo-text-small {
                    color: var(--logo-color, #4285f4);
                    font-weight: bold;
                    font-size: 10px;
                }

                .success-message {
                    display: none;
                    background: linear-gradient(135deg, #4caf50, #66bb6a);
                    color: white;
                    padding: 15px;
                    border-radius: 4px;
                    margin-top: 20px;
                    font-size: 16px;
                    font-weight: bold;
                    text-align: center;
                    box-shadow: 0 2px 10px rgba(76, 175, 80, 0.3);
                }

                .success-message.show {
                    display: block;
                    animation: slideIn 0.5s ease;
                }

                .settings-panel {
                    display: none;
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background: var(--bg-color, white);
                    border: 1px solid var(--border-color, #d3d3d3);
                    border-radius: 4px;
                    padding: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    z-index: 1000;
                    min-width: 150px;
                }

                .settings-panel.show {
                    display: block;
                }

                .setting-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                    font-size: 12px;
                    color: var(--text-color, #333);
                }

                .setting-toggle {
                    width: 30px;
                    height: 16px;
                    background-color: #ccc;
                    border-radius: 8px;
                    position: relative;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                }

                .setting-toggle.active {
                    background-color: #4285f4;
                }

                .setting-toggle::after {
                    content: '';
                    width: 12px;
                    height: 12px;
                    background-color: white;
                    border-radius: 50%;
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    transition: transform 0.3s ease;
                }

                .setting-toggle.active::after {
                    transform: translateX(14px);
                }

                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }

                .loading {
                    position: relative;
                    overflow: hidden;
                }

                .loading::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
                    animation: loading 1.5s infinite;
                }

                @keyframes loading {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }

                .hint-text {
                    background-color: #fff3cd;
                    border: 1px solid #ffeaa7;
                    padding: 10px;
                    border-radius: 4px;
                    margin-bottom: 15px;
                    font-size: 12px;
                    color: #856404;
                    display: none;
                }

                .hint-text.show {
                    display: block;
                    animation: slideIn 0.3s ease;
                }

                .dark .hint-text {
                    background-color: #3a3a3a;
                    border-color: #555;
                    color: #ffd700;
                }

                .dark .challenge-content {
                    --bg-color: #2d2d2d;
                    --text-color: #fff;
                    --border-color: #555;
                    --grid-bg: #3a3a3a;
                    --footer-bg: #1e1e1e;
                    --hover-bg: #3a3a3a;
                    --logo-color: #64b5f6;
                }

                .audio-challenge {
                    text-align: center;
                    padding: 20px 0;
                }

                .audio-header h4 {
                    color: var(--text-color, #333);
                    margin-bottom: 10px;
                    font-size: 18px;
                }

                .audio-header p {
                    color: #666;
                    margin-bottom: 20px;
                    font-size: 14px;
                }

                .audio-controls {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .play-again-btn {
                    background: linear-gradient(135deg, #4285f4, #3367d6);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                    transition: all 0.2s ease;
                }

                .play-again-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
                }

                .play-again-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none;
                }

                .volume-indicator {
                    display: flex;
                    gap: 3px;
                    align-items: flex-end;
                    height: 30px;
                }

                .volume-bar {
                    width: 4px;
                    background-color: #ddd;
                    border-radius: 2px;
                    transition: all 0.3s ease;
                }

                .volume-bar:nth-child(1) { height: 10px; }
                .volume-bar:nth-child(2) { height: 15px; }
                .volume-bar:nth-child(3) { height: 20px; }
                .volume-bar:nth-child(4) { height: 25px; }

                .volume-indicator.playing .volume-bar {
                    background-color: #4285f4;
                    animation: volume-pulse 0.8s infinite alternate;
                }

                .volume-indicator.playing .volume-bar:nth-child(2) { animation-delay: 0.1s; }
                .volume-indicator.playing .volume-bar:nth-child(3) { animation-delay: 0.2s; }
                .volume-indicator.playing .volume-bar:nth-child(4) { animation-delay: 0.3s; }

                @keyframes volume-pulse {
                    0% { opacity: 0.5; transform: scaleY(0.5); }
                    100% { opacity: 1; transform: scaleY(1); }
                }

                .audio-input-container {
                    margin: 20px 0;
                }

                .audio-input {
                    width: 200px;
                    padding: 15px;
                    font-size: 18px;
                    text-align: center;
                    letter-spacing: 8px;
                    border: 2px solid #ddd;
                    border-radius: 6px;
                    background: var(--bg-color, white);
                    color: var(--text-color, #333);
                    transition: all 0.2s ease;
                }

                .audio-input:focus {
                    outline: none;
                    border-color: #4285f4;
                    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
                }

                .input-hint {
                    font-size: 12px;
                    color: #666;
                    margin-top: 8px;
                }

                .audio-challenge-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 30px;
                    gap: 15px;
                }

                .back-btn {
                    background: none;
                    border: 1px solid var(--border-color, #ddd);
                    color: var(--text-color, #333);
                    padding: 10px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                    transition: all 0.2s ease;
                }

                .back-btn:hover {
                    background: var(--hover-bg, #f0f0f0);
                    transform: translateY(-1px);
                }

                .verify-audio-btn {
                    background: linear-gradient(135deg, #34a853, #2d7d34);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                    transition: all 0.2s ease;
                }

                .verify-audio-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(52, 168, 83, 0.3);
                }

                .verify-audio-btn:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                    transform: none;
                }

                .audio-status {
                    margin-top: 20px;
                    padding: 10px;
                    border-radius: 4px;
                    font-weight: bold;
                    transition: all 0.3s ease;
                }

                .audio-status.success {
                    background: linear-gradient(135deg, #d4edda, #c3e6cb);
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }

                .audio-status.error {
                    background: linear-gradient(135deg, #f8d7da, #f1c2c7);
                    color: #721c24;
                    border: 1px solid #f1c2c7;
                }

                .success-status, .error-status {
                    font-size: 16px;
                }

                .dark .audio-input {
                    background: #3a3a3a;
                    border-color: #555;
                    color: #fff;
                }

                .dark .input-hint {
                    color: #999;
                }

                @media (max-width: 500px) {
                    :host {
                        width: 100%;
                        max-width: 100%;
                    }
                    
                    .captcha-container {
                        min-width: 260px;
                        max-width: 100%;
                    }
                    
                    .captcha-checkbox {
                        padding: 15px;
                    }
                    
                    .checkmark {
                        width: 24px;
                        height: 24px;
                        margin-right: 10px;
                    }
                    
                    .checkbox-text {
                        font-size: 13px;
                    }
                    
                    .captcha-logo {
                        font-size: 9px;
                    }
                    
                    .logo-text {
                        font-size: 11px;
                    }
                    
                    .logo-subtext {
                        font-size: 8px;
                    }
                    
                    .settings-btn, .reset-btn {
                        font-size: 10px;
                        min-width: 14px;
                        height: 14px;
                    }
                    
                    .challenge-content {
                        width: 95vw;
                        margin: 10px;
                    }
                    
                    .grid-text-box {
                        height: 80px;
                        font-size: 10px;
                    }
                }
            </style>
            
            <div class="captcha-container">
                <div class="captcha-checkbox">
                    <input type="checkbox" id="captcha-check" class="checkbox-input">
                    <label for="captcha-check" class="checkbox-label">
                        <div class="checkmark"></div>
                        <span class="checkbox-text">I'm not a robot</span>
                    </label>
                    <div class="captcha-logo">
                        <div class="logo-text">reCAPTCHA</div>
                        <div class="logo-subtext">Privacy - Terms</div>
                        <div class="logo-controls">
                            <button class="settings-btn" id="settings-btn" title="Settings">⚙️</button>
                            <button class="reset-btn" id="reset-btn" title="Reset">↻</button>
                        </div>
                    </div>
                </div>
                
                <div class="settings-panel" id="settings-panel">
                    <div class="setting-item">
                        <span>Sound</span>
                        <div class="setting-toggle" id="sound-toggle"></div>
                    </div>
                    <div class="setting-item">
                        <span>Dark Mode</span>
                        <div class="setting-toggle" id="dark-toggle"></div>
                    </div>
                </div>
            </div>

            <div class="challenge-popup" id="challenge-popup">
                <div class="challenge-content">
                    <div class="challenge-header">
                        <div class="header-content">
                            <h3 id="challenge-title">Select all text boxes with cars</h3>
                            <span class="difficulty-badge" id="difficulty-badge">Easy</span>
                        </div>
                        <button class="close-btn" id="close-btn">&times;</button>
                    </div>
                    
                    <div class="challenge-body">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progress-fill"></div>
                        </div>
                        
                        <div class="challenge-info">
                            <span class="timer" id="timer">00:00</span>
                            <span class="attempts-counter" id="attempts-counter">Attempts: 0/3</span>
                        </div>
                        
                        <div class="hint-text" id="hint-text"></div>
                        
                        <div class="text-box-grid" id="text-box-grid"></div>
                        
                        <div class="challenge-controls">
                            <div class="control-group">
                                <button class="refresh-btn" id="refresh-btn" title="New Challenge">↻</button>
                                <button class="audio-btn" id="audio-btn" title="Audio Challenge">🔊</button>
                                <button class="hint-btn" id="hint-btn" title="Get Hint">💡</button>
                            </div>
                            <button class="verify-btn" id="verify-btn">VERIFY</button>
                        </div>
                    </div>
                    
                    <div class="challenge-footer">
                        <div class="analytics-info" id="analytics-info">
                            Success Rate: 0% | Avg Time: 0s
                        </div>
                        <div class="captcha-logo-small">
                            <div class="logo-text-small">reCAPTCHA</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="success-message" id="success-message">
                🎉 Verification successful!
            </div>
        `;
    }

    bindEvents() {
        const checkbox = this.shadowRoot.getElementById('captcha-check');
        const challengePopup = this.shadowRoot.getElementById('challenge-popup');
        const closeBtn = this.shadowRoot.getElementById('close-btn');
        const refreshBtn = this.shadowRoot.getElementById('refresh-btn');
        const audioBtn = this.shadowRoot.getElementById('audio-btn');
        const verifyBtn = this.shadowRoot.getElementById('verify-btn');
        const hintBtn = this.shadowRoot.getElementById('hint-btn');
        const resetBtn = this.shadowRoot.getElementById('reset-btn');
        const settingsBtn = this.shadowRoot.getElementById('settings-btn');
        const settingsPanel = this.shadowRoot.getElementById('settings-panel');
        const soundToggle = this.shadowRoot.getElementById('sound-toggle');
        const darkToggle = this.shadowRoot.getElementById('dark-toggle');

        checkbox.addEventListener('change', (e) => {
            if (this.isVerified) {
                // Prevent any changes if already verified
                e.preventDefault();
                e.target.checked = true;
                return;
            }

            if (e.target.checked && !this.isVerified) {
                this.showLoadingAnimation();
                setTimeout(() => {
                    this.openChallenge();
                }, 1000);
            } else if (!this.isVerified) {
                e.preventDefault();
                e.target.checked = false;
            }
        });

        resetBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.resetCaptcha();
        });

        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsPanel.classList.toggle('show');
        });

        soundToggle.addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            soundToggle.classList.toggle('active', this.soundEnabled);
            this.saveSettings();
            this.playSound('click');
        });

        darkToggle.addEventListener('click', () => {
            this.darkMode = !this.darkMode;
            darkToggle.classList.toggle('active', this.darkMode);
            this.updateTheme();
            this.saveSettings();
            this.playSound('click');
        });

        document.addEventListener('click', () => {
            settingsPanel.classList.remove('show');
        });

        closeBtn.addEventListener('click', () => {
            this.closeChallenge();
        });

        challengePopup.addEventListener('click', (e) => {
            if (e.target === challengePopup) {
                this.closeChallenge();
            }
        });

        refreshBtn.addEventListener('click', () => {
            this.refreshChallenge();
            this.playSound('refresh');
        });

        audioBtn.addEventListener('click', () => {
            this.playAudioChallenge();
        });

        hintBtn.addEventListener('click', () => {
            this.showHint();
            this.playSound('hint');
        });

        verifyBtn.addEventListener('click', () => {
            this.verifySelection();
        });

        // Start timer when popup opens
        this.timerInterval = null;
    }

    updateTheme() {
        const container = this.shadowRoot.querySelector('.captcha-container');
        const challengeContent = this.shadowRoot.querySelector('.challenge-content');

        container.classList.toggle('dark', this.darkMode);
        challengeContent.classList.toggle('dark', this.darkMode);
    }

    saveSettings() {
        const settings = {
            soundEnabled: this.soundEnabled,
            darkMode: this.darkMode
        };
        localStorage.setItem('captcha-settings', JSON.stringify(settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('captcha-settings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.soundEnabled = settings.soundEnabled !== false;
            this.darkMode = settings.darkMode === true;

            const soundToggle = this.shadowRoot.getElementById('sound-toggle');
            const darkToggle = this.shadowRoot.getElementById('dark-toggle');

            soundToggle.classList.toggle('active', this.soundEnabled);
            darkToggle.classList.toggle('active', this.darkMode);

            this.updateTheme();
        }
    }

    playSound(type) {
        if (!this.soundEnabled) return;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        let frequency = 440;
        switch (type) {
            case 'success': frequency = 523; break;
            case 'error': frequency = 220; break;
            case 'click': frequency = 330; break;
            case 'refresh': frequency = 440; break;
            case 'hint': frequency = 660; break;
        }

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    createPlaceholderImage(type, index) {
        const colors = {
            car: '#ff6b6b', 'traffic light': '#4ecdc4', bicycle: '#45b7d1',
            tree: '#96ceb4', house: '#ffeaa7', dog: '#dda0dd',
            bird: '#98d8c8', flower: '#f7dc6f', mountain: '#85c1e9',
            building: '#f8c471', cat: '#bb8fce', beach: '#5dade2',
            sunset: '#f1948a', forest: '#82e0aa', river: '#7fb3d3',
            crosswalk: '#34495e', 'fire hydrant': '#e74c3c', motorcycle: '#9b59b6'
        };

        const color = colors[type] || '#cccccc';
        const svg = `
            <svg width="110" height="110" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad${index}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:${this.adjustColor(color, -20)};stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="110" height="110" fill="url(#grad${index})" rx="4"/>
                <text x="55" y="45" font-family="Arial" font-size="10" fill="white" text-anchor="middle" font-weight="bold">${type.toUpperCase()}</text>
                <text x="55" y="65" font-family="Arial" font-size="8" fill="rgba(255,255,255,0.8)" text-anchor="middle">#${index + 1}</text>
                <circle cx="55" cy="80" r="3" fill="rgba(255,255,255,0.3)"/>
            </svg>
        `;

        return 'data:image/svg+xml;base64,' + btoa(svg);
    }

    adjustColor(color, amount) {
        const clamp = (val) => Math.min(255, Math.max(0, val));
        const hex = color.replace('#', '');
        const r = clamp(parseInt(hex.substr(0, 2), 16) + amount);
        const g = clamp(parseInt(hex.substr(2, 2), 16) + amount);
        const b = clamp(parseInt(hex.substr(4, 2), 16) + amount);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    fadeAndReplaceBox(index, imageElement) {
        // Add the index to selected for tracking
        this.selectedImages.add(index);

        // Fade out animation
        imageElement.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        imageElement.style.opacity = '0.3';
        imageElement.style.transform = 'scale(0.8)';

        setTimeout(() => {
            // Generate a new random image type that's not the target
            const targetType = this.getTargetTypeFromTitle();
            const availableTypes = ['tree', 'house', 'dog', 'bird', 'flower', 'mountain', 'building', 'cat', 'beach', 'sunset', 'forest', 'river'];
            const nonTargetTypes = availableTypes.filter(type => type !== targetType);
            const newType = nonTargetTypes[Math.floor(Math.random() * nonTargetTypes.length)];

            // Update the image type in the challenge
            this.currentChallenge.imageTypes[index] = newType;

            // Update the visual
            const imageSrc = this.createPlaceholderImage(newType, index);
            imageElement.style.backgroundImage = `url(${imageSrc})`;

            // Fade back in
            imageElement.style.opacity = '1';
            imageElement.style.transform = 'scale(1)';

            // Remove from correct images array since it's no longer a target
            const correctIndex = this.currentChallenge.correctImages.indexOf(index);
            if (correctIndex > -1) {
                this.currentChallenge.correctImages.splice(correctIndex, 1);
            }

            // Check if challenge is complete (no more correct images left)
            if (this.currentChallenge.correctImages.length === 0) {
                this.handleUntilNoneLeftComplete();
            }

        }, 500);
    }

    getTargetTypeFromTitle() {
        const title = this.currentChallenge.title.toLowerCase();
        if (title.includes('cars')) return 'car';
        if (title.includes('traffic lights')) return 'traffic light';
        if (title.includes('bicycles')) return 'bicycle';
        if (title.includes('crosswalks')) return 'crosswalk';
        if (title.includes('fire hydrants')) return 'fire hydrant';
        if (title.includes('motorcycles')) return 'motorcycle';
        return 'car'; // default
    }

    handleUntilNoneLeftComplete() {
        // All target items have been removed - show verify button and enable it
        const verifyBtn = this.shadowRoot.getElementById('verify-btn');
        verifyBtn.style.display = 'block';
        verifyBtn.disabled = false;
        verifyBtn.textContent = 'VERIFY - All Clear!';
        verifyBtn.style.backgroundColor = '#4caf50';
    }

    showLoadingAnimation() {
        const captchaContainer = this.shadowRoot.querySelector('.captcha-container');
        captchaContainer.classList.add('loading');
        this.playSound('click');

        setTimeout(() => {
            captchaContainer.classList.remove('loading');
        }, 1000);
    }

    startTimer() {
        this.startTime = Date.now();
        const timerElement = this.shadowRoot.getElementById('timer');

        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        return this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
    }

    updateProgress() {
        const progressFill = this.shadowRoot.getElementById('progress-fill');

        if (this.currentChallenge.mode === 'until_none_left') {
            // For until none left mode, progress based on how many correct items are left
            const originalCorrectCount = this.challenges.find(c => c.title === this.currentChallenge.title)?.correctImages.length || 3;
            const remaining = this.currentChallenge.correctImages.length;
            const progress = ((originalCorrectCount - remaining) / originalCorrectCount) * 100;
            progressFill.style.width = `${Math.min(progress, 100)}%`;
        } else {
            // Classic mode progress
            const progress = (this.selectedImages.size / this.currentChallenge.correctImages.length) * 100;
            progressFill.style.width = `${Math.min(progress, 100)}%`;
        }
    }

    openChallenge() {
        this.currentChallenge = this.challenges[Math.floor(Math.random() * this.challenges.length)];
        this.selectedImages.clear();
        this.attempts = 0;

        // Make a deep copy of the challenge to avoid modifying the original
        this.currentChallenge = {
            ...this.currentChallenge,
            correctImages: [...this.currentChallenge.correctImages],
            imageTypes: [...this.currentChallenge.imageTypes]
        };

        const popup = this.shadowRoot.getElementById('challenge-popup');
        const title = this.shadowRoot.getElementById('challenge-title');
        const difficultyBadge = this.shadowRoot.getElementById('difficulty-badge');
        const textBoxGrid = this.shadowRoot.getElementById('text-box-grid');
        const attemptsCounter = this.shadowRoot.getElementById('attempts-counter');
        const hintText = this.shadowRoot.getElementById('hint-text');
        const verifyBtn = this.shadowRoot.getElementById('verify-btn');

        title.textContent = this.currentChallenge.title;
        difficultyBadge.textContent = this.currentChallenge.difficulty.toUpperCase();
        difficultyBadge.className = `difficulty-badge ${this.currentChallenge.difficulty}`;

        attemptsCounter.textContent = `Attempts: ${this.attempts}/${this.maxAttempts}`;
        hintText.classList.remove('show');

        // Initially hide verify button for until none left mode
        if (this.currentChallenge.mode === 'until_none_left') {
            verifyBtn.style.display = 'none';
            verifyBtn.textContent = 'VERIFY';
            verifyBtn.style.backgroundColor = '#4285f4';
        } else {
            verifyBtn.style.display = 'block';
        }

        textBoxGrid.innerHTML = '';

        this.currentChallenge.imageTypes.forEach((type, index) => {
            const textBoxDiv = document.createElement('div');
            textBoxDiv.className = 'grid-text-box';
            const imageSrc = this.createPlaceholderImage(type, index);
            textBoxDiv.style.backgroundImage = `url(${imageSrc})`;
            textBoxDiv.dataset.index = index;

            textBoxDiv.addEventListener('click', () => {
                this.toggleImageSelection(index, textBoxDiv);
                this.playSound('click');
            });

            textBoxGrid.appendChild(textBoxDiv);
        });

        popup.classList.add('active');
        this.updateVerifyButton();
        this.updateProgress();
        this.startTimer();
        this.updateAnalytics();
    }

    closeChallenge() {
        const popup = this.shadowRoot.getElementById('challenge-popup');
        const checkbox = this.shadowRoot.getElementById('captcha-check');

        popup.classList.remove('active');
        this.stopTimer();

        if (!this.isVerified) {
            checkbox.checked = false;
        }
    }

    toggleImageSelection(index, imageElement) {
        if (this.currentChallenge.mode === 'until_none_left') {
            // For until none left mode, handle differently
            if (this.currentChallenge.correctImages.includes(index)) {
                // Correct selection - fade out and replace
                this.fadeAndReplaceBox(index, imageElement);
            } else {
                // Wrong selection - show error feedback
                imageElement.style.animation = 'shake 0.5s ease-in-out';
                setTimeout(() => {
                    imageElement.style.animation = '';
                }, 500);
            }
        } else {
            // Classic mode behavior
            if (this.selectedImages.has(index)) {
                this.selectedImages.delete(index);
                imageElement.classList.remove('selected');
            } else {
                this.selectedImages.add(index);
                imageElement.classList.add('selected');
            }
        }

        this.updateVerifyButton();
        this.updateProgress();
    }

    updateVerifyButton() {
        const verifyBtn = this.shadowRoot.getElementById('verify-btn');

        if (this.currentChallenge.mode === 'until_none_left') {
            // For until none left mode, button is only enabled when all correct images are cleared
            // The button visibility is controlled in handleUntilNoneLeftComplete()
            return;
        } else {
            // Classic mode - button enabled when at least one image is selected
            verifyBtn.disabled = this.selectedImages.size === 0;
        }
    }

    showHint() {
        const hintText = this.shadowRoot.getElementById('hint-text');
        const correctCount = this.currentChallenge.correctImages.length;
        const selectedCount = this.selectedImages.size;

        let hint = '';
        if (selectedCount === 0) {
            hint = `Look for ${correctCount} text boxes that match the description.`;
        } else if (selectedCount < correctCount) {
            hint = `You need to select ${correctCount - selectedCount} more text box(es).`;
        } else if (selectedCount > correctCount) {
            hint = `You have selected too many text boxes. Try removing ${selectedCount - correctCount}.`;
        } else {
            hint = `You have the right number of selections. Click VERIFY to check!`;
        }

        hintText.textContent = hint;
        hintText.classList.add('show');

        setTimeout(() => {
            hintText.classList.remove('show');
        }, 5000);
    }

    verifySelection() {
        this.attempts++;
        this.analytics.totalAttempts++;

        let isCorrect = false;

        if (this.currentChallenge.mode === 'until_none_left') {
            // For until none left mode, check if all correct images have been cleared
            isCorrect = this.currentChallenge.correctImages.length === 0;
        } else {
            // Classic mode verification
            const correctSet = new Set(this.currentChallenge.correctImages);
            const selectedArray = Array.from(this.selectedImages);

            isCorrect = selectedArray.length === correctSet.size &&
                selectedArray.every(index => correctSet.has(index));
        }

        const attemptsCounter = this.shadowRoot.getElementById('attempts-counter');
        attemptsCounter.textContent = `Attempts: ${this.attempts}/${this.maxAttempts}`;

        if (isCorrect) {
            this.handleSuccessfulVerification();
        } else {
            this.handleFailedVerification();
        }
    }

    handleSuccessfulVerification() {
        this.isVerified = true;
        const timeSpent = this.stopTimer();

        // Update analytics
        this.analytics.difficultyCounts[this.currentChallenge.difficulty]++;
        this.analytics.averageTime = ((this.analytics.averageTime * (this.analytics.totalAttempts - 1)) + timeSpent) / this.analytics.totalAttempts;
        this.analytics.successRate = ((this.analytics.successRate * (this.analytics.totalAttempts - 1)) + 100) / this.analytics.totalAttempts;

        const popup = this.shadowRoot.getElementById('challenge-popup');
        const successMessage = this.shadowRoot.getElementById('success-message');
        const checkbox = this.shadowRoot.getElementById('captcha-check');
        const checkboxLabel = this.shadowRoot.querySelector('.checkbox-label');
        const container = this.shadowRoot.querySelector('.captcha-container');

        popup.classList.remove('active');
        checkbox.checked = true;
        checkbox.disabled = true;
        checkboxLabel.style.cursor = 'not-allowed';
        checkboxLabel.style.opacity = '0.8';
        container.classList.add('verified');
        successMessage.classList.add('show');

        this.status = 'true';
        this.playSound('success');

        setTimeout(() => {
            successMessage.classList.remove('show');
        }, 3000);

        const checkboxText = this.shadowRoot.querySelector('.checkbox-text');
        checkboxText.textContent = "Verified ✓";

        this.dispatchEvent(new CustomEvent('verified', {
            detail: {
                verified: true,
                timeSpent,
                attempts: this.attempts,
                difficulty: this.currentChallenge.difficulty
            },
            bubbles: true
        }));
    }

    handleFailedVerification() {
        this.playSound('error');
        const challengeContent = this.shadowRoot.querySelector('.challenge-content');
        const container = this.shadowRoot.querySelector('.captcha-container');

        container.classList.add('failed');
        challengeContent.style.animation = 'shake 0.5s ease-in-out';

        setTimeout(() => {
            challengeContent.style.animation = '';
            container.classList.remove('failed');

            if (this.attempts >= this.maxAttempts) {
                this.closeChallenge();
                this.resetCaptcha();
            } else {
                this.refreshChallenge();
            }
        }, 500);
    }

    refreshChallenge() {
        this.selectedImages.clear();

        let newChallenge;
        do {
            newChallenge = this.challenges[Math.floor(Math.random() * this.challenges.length)];
        } while (newChallenge === this.currentChallenge && this.challenges.length > 1);

        this.currentChallenge = newChallenge;

        const title = this.shadowRoot.getElementById('challenge-title');
        const difficultyBadge = this.shadowRoot.getElementById('difficulty-badge');
        const textBoxGrid = this.shadowRoot.getElementById('text-box-grid');
        const hintText = this.shadowRoot.getElementById('hint-text');

        title.textContent = this.currentChallenge.title;
        difficultyBadge.textContent = this.currentChallenge.difficulty.toUpperCase();
        hintText.classList.remove('show');

        textBoxGrid.innerHTML = '';

        this.currentChallenge.imageTypes.forEach((type, index) => {
            const textBoxDiv = document.createElement('div');
            textBoxDiv.className = 'grid-text-box';
            const imageSrc = this.createPlaceholderImage(type, index);
            textBoxDiv.style.backgroundImage = `url(${imageSrc})`;
            textBoxDiv.dataset.index = index;

            textBoxDiv.addEventListener('click', () => {
                this.toggleImageSelection(index, textBoxDiv);
                this.playSound('click');
            });

            textBoxGrid.appendChild(textBoxDiv);
        });

        this.updateVerifyButton();
        this.updateProgress();
    }

    updateAnalytics() {
        const analyticsInfo = this.shadowRoot.getElementById('analytics-info');
        analyticsInfo.textContent = `Success Rate: ${Math.round(this.analytics.successRate)}% | Avg Time: ${Math.round(this.analytics.averageTime)}s`;
    }

    resetChallengeBody() {
        const challengeBody = this.shadowRoot.querySelector('.challenge-body');
        challengeBody.innerHTML = `
            <div class="progress-bar">
                <div class="progress-fill" id="progress-fill"></div>
            </div>
            
            <div class="challenge-info">
                <span class="timer" id="timer">00:00</span>
                <span class="attempts-counter" id="attempts-counter">Attempts: 0/3</span>
            </div>
            
            <div class="hint-text" id="hint-text"></div>
            
            <div class="text-box-grid" id="text-box-grid"></div>
            
            <div class="challenge-controls">
                <div class="control-group">
                    <button class="refresh-btn" id="refresh-btn" title="New Challenge">↻</button>
                    <button class="audio-btn" id="audio-btn" title="Audio Challenge">🔊</button>
                    <button class="hint-btn" id="hint-btn" title="Get Hint">💡</button>
                </div>
                <button class="verify-btn" id="verify-btn">VERIFY</button>
            </div>
        `;

        // Re-bind events for the restored interface
        this.bindChallengeEvents();
    }

    bindChallengeEvents() {
        const refreshBtn = this.shadowRoot.getElementById('refresh-btn');
        const audioBtn = this.shadowRoot.getElementById('audio-btn');
        const verifyBtn = this.shadowRoot.getElementById('verify-btn');
        const hintBtn = this.shadowRoot.getElementById('hint-btn');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshChallenge();
                this.playSound('refresh');
            });
        }

        if (audioBtn) {
            audioBtn.addEventListener('click', () => {
                this.playAudioChallenge();
            });
        }

        if (hintBtn) {
            hintBtn.addEventListener('click', () => {
                this.showHint();
                this.playSound('hint');
            });
        }

        if (verifyBtn) {
            verifyBtn.addEventListener('click', () => {
                this.verifySelection();
            });
        }
    }

    playAudioChallenge() {
        // Generate 4 random numbers
        const numbers = [
            Math.floor(Math.random() * 10),
            Math.floor(Math.random() * 10),
            Math.floor(Math.random() * 10),
            Math.floor(Math.random() * 10)
        ];

        this.audioNumbers = numbers.join('');

        // Hide the main challenge content and show audio challenge
        this.showAudioChallengeInterface();

        // Play the numbers with delays between them
        this.playNumberSequence(numbers);
    }

    showAudioChallengeInterface() {
        const challengeBody = this.shadowRoot.querySelector('.challenge-body');
        challengeBody.innerHTML = `
            <div class="audio-challenge">
                <div class="audio-header">
                    <h4>🔊 Audio Challenge</h4>
                    <p>Listen carefully and type the numbers you hear:</p>
                </div>
                
                <div class="audio-controls">
                    <button class="play-again-btn" id="play-again-btn">🔊 Play Again</button>
                    <div class="volume-indicator" id="volume-indicator">
                        <div class="volume-bar"></div>
                        <div class="volume-bar"></div>
                        <div class="volume-bar"></div>
                        <div class="volume-bar"></div>
                    </div>
                </div>
                
                <div class="audio-input-container">
                    <input type="text" 
                           id="audio-input" 
                           placeholder="Type the numbers you heard..." 
                           maxlength="4"
                           class="audio-input">
                    <div class="input-hint">Enter 4 digits (0-9)</div>
                </div>
                
                <div class="audio-challenge-controls">
                    <button class="back-btn" id="back-to-visual">👁️ Visual Challenge</button>
                    <button class="verify-audio-btn" id="verify-audio-btn">VERIFY AUDIO</button>
                </div>
                
                <div class="audio-status" id="audio-status"></div>
            </div>
        `;

        // Add event listeners
        const playAgainBtn = this.shadowRoot.getElementById('play-again-btn');
        const audioInput = this.shadowRoot.getElementById('audio-input');
        const verifyAudioBtn = this.shadowRoot.getElementById('verify-audio-btn');
        const backToVisualBtn = this.shadowRoot.getElementById('back-to-visual');

        playAgainBtn.addEventListener('click', () => {
            this.playNumberSequence(this.audioNumbers.split('').map(n => parseInt(n)));
        });

        audioInput.addEventListener('input', (e) => {
            // Only allow digits
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            verifyAudioBtn.disabled = e.target.value.length === 0;
        });

        audioInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && audioInput.value.length > 0) {
                this.verifyAudioInput();
            }
        });

        verifyAudioBtn.addEventListener('click', () => {
            this.verifyAudioInput();
        });

        backToVisualBtn.addEventListener('click', () => {
            this.resetChallengeBody(); // Restore visual challenge interface
            this.openChallenge(); // Go back to visual challenge
        });

        // Focus the input
        setTimeout(() => audioInput.focus(), 100);
    }

    playNumberSequence(numbers) {
        const volumeIndicator = this.shadowRoot.getElementById('volume-indicator');
        const playAgainBtn = this.shadowRoot.getElementById('play-again-btn');

        // Disable play again button during playback
        playAgainBtn.disabled = true;
        playAgainBtn.textContent = '🔊 Playing...';

        // Animate volume indicator
        volumeIndicator.classList.add('playing');

        let currentIndex = 0;

        const playNext = () => {
            if (currentIndex < numbers.length) {
                const audio = new Audio(`apis/sounds/${numbers[currentIndex]}.mp3`);

                audio.onloadeddata = () => {
                    audio.play().catch(err => {
                        console.warn('Audio play failed:', err);
                        // Fallback to speech synthesis if audio files fail
                        this.fallbackSpeech(numbers[currentIndex]);
                    });
                };

                audio.onended = () => {
                    currentIndex++;
                    setTimeout(playNext, 800); // 800ms delay between numbers
                };

                audio.onerror = () => {
                    console.warn('Audio file not found, using speech synthesis');
                    this.fallbackSpeech(numbers[currentIndex]);
                    currentIndex++;
                    setTimeout(playNext, 800);
                };

            } else {
                // Finished playing sequence
                volumeIndicator.classList.remove('playing');
                playAgainBtn.disabled = false;
                playAgainBtn.textContent = '🔊 Play Again';
            }
        };

        // Start playing after a short delay
        setTimeout(playNext, 500);
    }

    fallbackSpeech(number) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(number.toString());
            utterance.rate = 0.8;
            utterance.pitch = 1;
            speechSynthesis.speak(utterance);
        }
    }

    verifyAudioInput() {
        const audioInput = this.shadowRoot.getElementById('audio-input');
        const audioStatus = this.shadowRoot.getElementById('audio-status');
        const userInput = audioInput.value;

        if (userInput === this.audioNumbers) {
            audioStatus.innerHTML = '<div class="success-status">✅ Correct! Verification successful!</div>';
            audioStatus.className = 'audio-status success';

            setTimeout(() => {
                this.handleSuccessfulVerification();
            }, 1000);
        } else {
            audioStatus.innerHTML = '<div class="error-status">❌ Incorrect. Please try again.</div>';
            audioStatus.className = 'audio-status error';

            // Clear input and allow retry
            setTimeout(() => {
                audioInput.value = '';
                audioStatus.innerHTML = '';
                audioStatus.className = 'audio-status';
                audioInput.focus();
            }, 2000);
        }
    }

    resetCaptcha() {
        this.isVerified = false;
        this.status = 'null';
        this.attempts = 0;
        this.selectedImages.clear();
        this.stopTimer();

        const checkbox = this.shadowRoot.getElementById('captcha-check');
        const checkboxLabel = this.shadowRoot.querySelector('.checkbox-label');
        const checkboxText = this.shadowRoot.querySelector('.checkbox-text');
        const container = this.shadowRoot.querySelector('.captcha-container');

        checkbox.checked = false;
        checkbox.disabled = false;
        checkboxLabel.style.cursor = 'pointer';
        checkboxLabel.style.opacity = '1';
        checkboxText.textContent = "I'm not a robot";
        container.classList.remove('verified', 'failed');

        // Reset the challenge body to the original visual interface
        this.resetChallengeBody();

        this.closeChallenge();
        this.playSound('refresh');

        this.dispatchEvent(new CustomEvent('reset', {
            detail: { reset: true },
            bubbles: true
        }));
    }

    // Public API methods
    reset() {
        this.resetCaptcha();
    }

    getStatus() {
        return this.status;
    }

    isValid() {
        return this.status === 'true';
    }

    getAnalytics() {
        return { ...this.analytics };
    }
}

// Register the custom element
customElements.define('captcha-element', CaptchaElement);

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CaptchaElement;
}
