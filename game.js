/**
 * Math Adventure - Interactive Multiplication & Division Learning App
 * Designed with ADHD-friendly features and research-backed learning methods
 */

// =============================================================================
// Game State & Configuration
// =============================================================================

const GameState = {
    // Player info
    playerName: '',
    level: 1,
    totalPoints: 0,
    totalCorrect: 0,
    totalAttempts: 0,

    // Session state
    sessionActive: false,
    sessionProblems: 0,
    sessionCorrect: 0,
    sessionPoints: 0,
    currentProblem: null,
    problemsCompleted: 0,

    // Streak tracking
    currentStreak: 0,
    bestStreak: 0,

    // Timing
    sessionStartTime: null,
    lastBreakTime: null,

    // Achievements
    badges: [],
    newBadges: [],

    // Spaced repetition - tracks difficulty of each fact
    factPerformance: {}, // { "3x4": { correct: 5, incorrect: 2, lastSeen: timestamp } }

    // Progress history - track daily progress over time
    progressHistory: [], // [{ date: "2024-01-15", correct: 45, attempts: 50, points: 520, sessions: 3 }]

    // Mastered facts (accuracy > 90% with at least 5 attempts)
    masteredFacts: [],
};

const Settings = {
    mode: 'multiplication', // 'multiplication', 'division', 'mixed' - Start with multiplication for 9-year-olds
    tableRange: 'easy', // 'beginner', 'easy', 'medium', 'hard', 'expert' - Easy (1,2,5,10) for starting out
    sessionLength: 10,
    breakInterval: 10, // minutes, 0 = off
    showVisuals: true,
    animationsEnabled: true,
    soundsEnabled: true,
    focusMode: false,
    largeText: false,
    highContrast: false,
};

const TableRanges = {
    beginner: [2, 5, 10],
    easy: [1, 2, 5, 10],
    medium: [2, 3, 4, 5, 6, 10],
    hard: [2, 3, 4, 5, 6, 7, 8, 9],
    expert: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};

const Badges = {
    firstProblem: { id: 'firstProblem', name: 'First Step', icon: '&#127775;', description: 'Complete your first problem' },
    streak5: { id: 'streak5', name: 'On Fire!', icon: '&#128293;', description: 'Get 5 correct in a row' },
    streak10: { id: 'streak10', name: 'Unstoppable', icon: '&#9889;', description: 'Get 10 correct in a row' },
    perfectSession: { id: 'perfectSession', name: 'Perfect!', icon: '&#127942;', description: 'Complete a session with 100% accuracy' },
    level5: { id: 'level5', name: 'Rising Star', icon: '&#11088;', description: 'Reach level 5' },
    level10: { id: 'level10', name: 'Math Wizard', icon: '&#129497;', description: 'Reach level 10' },
    points100: { id: 'points100', name: 'Century', icon: '&#128175;', description: 'Earn 100 points in one session' },
    multiplyMaster: { id: 'multiplyMaster', name: 'Multiply Master', icon: '&#10006;', description: 'Get 20 multiplication problems correct' },
    divideMaster: { id: 'divideMaster', name: 'Division Pro', icon: '&#10135;', description: 'Get 20 division problems correct' },
};

// Positive feedback messages
const CorrectMessages = [
    "Excellent!",
    "Great job!",
    "You got it!",
    "Perfect!",
    "Awesome!",
    "Well done!",
    "Fantastic!",
    "Super!",
    "Amazing!",
    "Brilliant!",
    "You're on fire!",
    "Math superstar!",
    "Nailed it!",
];

// Encouraging messages for wrong answers - supportive and helpful
const EncouragingMessages = [
    "That's okay! Mistakes help us learn.",
    "Good try! Let's see the answer together.",
    "You're learning! That's what matters.",
    "Almost! You're getting better every time.",
    "No worries! Even math experts make mistakes.",
    "Keep going! You're doing great.",
    "Nice effort! Let's try another one.",
    "That was a tricky one! You'll get it next time.",
    "Learning takes practice - you're doing amazing!",
    "Every mistake makes your brain stronger!",
];

// Helpful hints based on problem type
const HelpfulHints = {
    multiplication: [
        "Tip: Think of it as groups! {num1} groups of {num2}.",
        "Try skip counting by {num2}: {skipCount}",
        "Remember: {num1} × {num2} is the same as {num2} × {num1}!",
        "Picture {num1} rows with {num2} dots in each row.",
    ],
    division: [
        "Tip: Division is sharing equally. {num1} shared into groups of {num2}.",
        "Think: What times {num2} equals {num1}?",
        "How many groups of {num2} fit into {num1}?",
    ],
};

// =============================================================================
// DOM Elements
// =============================================================================

const DOM = {
    // Screens
    welcomeScreen: document.getElementById('welcome-screen'),
    gameScreen: document.getElementById('game-screen'),
    breakScreen: document.getElementById('break-screen'),
    completeScreen: document.getElementById('complete-screen'),

    // Welcome
    playerNameInput: document.getElementById('player-name'),
    startBtn: document.getElementById('start-btn'),
    settingsBtnWelcome: document.getElementById('settings-btn-welcome'),
    progressBtnWelcome: document.getElementById('progress-btn-welcome'),

    // Progress Modal
    progressModal: document.getElementById('progress-modal'),
    closeProgress: document.getElementById('close-progress'),
    totalProblemsSolved: document.getElementById('total-problems-solved'),
    overallAccuracy: document.getElementById('overall-accuracy'),
    totalPointsEarned: document.getElementById('total-points-earned'),
    factsMastered: document.getElementById('facts-mastered'),
    recentActivity: document.getElementById('recent-activity'),
    masteredFactsList: document.getElementById('mastered-facts-list'),
    badgesCollection: document.getElementById('badges-collection'),

    // Game UI
    playerDisplayName: document.getElementById('player-display-name'),
    currentLevel: document.getElementById('current-level'),
    pointsDisplay: document.getElementById('points-display'),
    streakDisplay: document.getElementById('streak-display'),
    sessionProgress: document.getElementById('session-progress'),
    progressText: document.getElementById('progress-text'),

    // Problem
    visualArea: document.getElementById('visual-area'),
    num1: document.getElementById('num1'),
    operator: document.getElementById('operator'),
    num2: document.getElementById('num2'),
    answerDisplay: document.getElementById('answer-display'),
    answerInput: document.getElementById('answer-input'),
    submitBtn: document.getElementById('submit-btn'),
    feedbackArea: document.getElementById('feedback-area'),
    feedbackMessage: document.getElementById('feedback-message'),
    feedbackExplanation: document.getElementById('feedback-explanation'),
    hintBtn: document.getElementById('hint-btn'),

    // Buttons
    pauseBtn: document.getElementById('pause-btn'),
    settingsBtnGame: document.getElementById('settings-btn-game'),

    // Break screen
    breakCountdown: document.getElementById('break-countdown'),
    skipBreakBtn: document.getElementById('skip-break-btn'),

    // Complete screen
    completeTitle: document.getElementById('complete-title'),
    sessionCorrectDisplay: document.getElementById('session-correct'),
    sessionAccuracy: document.getElementById('session-accuracy'),
    sessionPointsDisplay: document.getElementById('session-points'),
    badgesEarned: document.getElementById('badges-earned'),
    newBadges: document.getElementById('new-badges'),
    continueBtn: document.getElementById('continue-btn'),
    finishBtn: document.getElementById('finish-btn'),

    // Modals
    settingsModal: document.getElementById('settings-modal'),
    closeSettings: document.getElementById('close-settings'),
    saveSettings: document.getElementById('save-settings'),
    pauseModal: document.getElementById('pause-modal'),
    resumeBtn: document.getElementById('resume-btn'),
    quitBtn: document.getElementById('quit-btn'),

    // Settings inputs
    modeSelect: document.getElementById('mode-select'),
    tableSelect: document.getElementById('table-select'),
    sessionLengthSelect: document.getElementById('session-length'),
    breakIntervalSelect: document.getElementById('break-interval'),
    showVisualsToggle: document.getElementById('show-visuals'),
    animationsToggle: document.getElementById('animations-enabled'),
    soundsToggle: document.getElementById('sounds-enabled'),
    focusModeToggle: document.getElementById('focus-mode'),
    largeTextToggle: document.getElementById('large-text'),
    highContrastToggle: document.getElementById('high-contrast'),

    // Toast
    achievementToast: document.getElementById('achievement-toast'),
    toastTitle: document.getElementById('toast-title'),
    toastMessage: document.getElementById('toast-message'),
};

// =============================================================================
// Sound Effects (Web Audio API)
// =============================================================================

const AudioManager = {
    context: null,

    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio not supported');
        }
    },

    playTone(frequency, duration, type = 'sine') {
        if (!Settings.soundsEnabled || !this.context) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
    },

    playCorrect() {
        this.playTone(523.25, 0.1); // C5
        setTimeout(() => this.playTone(659.25, 0.1), 100); // E5
        setTimeout(() => this.playTone(783.99, 0.15), 200); // G5
    },

    playIncorrect() {
        this.playTone(200, 0.3, 'triangle');
    },

    playLevelUp() {
        const notes = [523.25, 587.33, 659.25, 783.99, 880];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15), i * 100);
        });
    },

    playAchievement() {
        const notes = [659.25, 783.99, 987.77, 1174.66];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2), i * 150);
        });
    },
};

// =============================================================================
// Problem Generation & Math Engine
// =============================================================================

const MathEngine = {
    // Track recent problems to avoid repetition
    recentProblems: [],
    maxRecentProblems: 8,
    problemPool: [],
    poolIndex: 0,

    /**
     * Generate all possible problem combinations for the current settings
     */
    generateProblemPool() {
        const tables = TableRanges[Settings.tableRange];
        this.problemPool = [];

        // Generate all unique combinations
        for (let i = 0; i < tables.length; i++) {
            for (let j = i; j < tables.length; j++) {
                const num1 = tables[i];
                const num2 = tables[j];

                // Add multiplication problem
                this.problemPool.push({
                    type: 'multiplication',
                    num1: num1,
                    num2: num2,
                    answer: num1 * num2,
                    display: { num1, operator: '×', num2 },
                    key: `${num1}x${num2}`
                });

                // Add reverse if different (e.g., 2×5 and 5×2)
                if (num1 !== num2) {
                    this.problemPool.push({
                        type: 'multiplication',
                        num1: num2,
                        num2: num1,
                        answer: num1 * num2,
                        display: { num1: num2, operator: '×', num2: num1 },
                        key: `${num2}x${num1}`
                    });
                }
            }
        }

        // Shuffle the pool
        this.shufflePool();
        this.poolIndex = 0;
    },

    /**
     * Fisher-Yates shuffle
     */
    shufflePool() {
        for (let i = this.problemPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.problemPool[i], this.problemPool[j]] = [this.problemPool[j], this.problemPool[i]];
        }
    },

    /**
     * Generate a new problem with better variety
     */
    generateProblem() {
        const isMultiplication = this.shouldDoMultiplication();

        // Regenerate pool if empty or settings changed
        if (this.problemPool.length === 0) {
            this.generateProblemPool();
        }

        // Find a problem that wasn't recently shown
        let attempts = 0;
        let problem = null;

        while (attempts < this.problemPool.length) {
            // Get next problem from shuffled pool
            problem = this.problemPool[this.poolIndex];
            this.poolIndex = (this.poolIndex + 1) % this.problemPool.length;

            // Reshuffle when we've gone through all problems
            if (this.poolIndex === 0) {
                this.shufflePool();
            }

            // Check if this problem was recently shown
            const problemKey = `${problem.display.num1}${problem.display.operator}${problem.display.num2}`;
            if (!this.recentProblems.includes(problemKey)) {
                // Add to recent problems
                this.recentProblems.push(problemKey);
                if (this.recentProblems.length > this.maxRecentProblems) {
                    this.recentProblems.shift();
                }
                break;
            }

            attempts++;
        }

        // Convert to division if needed
        if (!isMultiplication && problem.type === 'multiplication') {
            const product = problem.num1 * problem.num2;
            return {
                type: 'division',
                num1: product,
                num2: problem.num2,
                answer: problem.num1,
                display: { num1: product, operator: '÷', num2: problem.num2 },
            };
        }

        return {
            type: problem.type,
            num1: problem.num1,
            num2: problem.num2,
            answer: problem.answer,
            display: { ...problem.display },
        };
    },

    shouldDoMultiplication() {
        if (Settings.mode === 'multiplication') return true;
        if (Settings.mode === 'division') return false;
        return Math.random() < 0.5;
    },

    /**
     * Reset problem pool (call when settings change)
     */
    resetPool() {
        this.problemPool = [];
        this.recentProblems = [];
        this.poolIndex = 0;
    },

    /**
     * Record performance on a fact for spaced repetition
     */
    recordFactPerformance(num1, num2, correct) {
        const key = `${Math.min(num1, num2)}x${Math.max(num1, num2)}`;

        if (!GameState.factPerformance[key]) {
            GameState.factPerformance[key] = { correct: 0, incorrect: 0, lastSeen: 0 };
        }

        const fact = GameState.factPerformance[key];
        fact.lastSeen = Date.now();

        if (correct) {
            fact.correct++;
        } else {
            fact.incorrect++;
        }
    },

    /**
     * Calculate points for a correct answer
     */
    calculatePoints(problem, timeToAnswer) {
        let points = 10; // Base points

        // Streak bonus
        if (GameState.currentStreak >= 3) {
            points += Math.min(GameState.currentStreak, 10);
        }

        // Speed bonus (if answered in under 5 seconds)
        if (timeToAnswer < 5000) {
            points += 5;
        }

        // Difficulty bonus
        const maxNum = Math.max(problem.num1, problem.num2);
        if (maxNum >= 7) points += 3;
        if (maxNum >= 10) points += 5;

        return points;
    },
};

// =============================================================================
// Visual Representations
// =============================================================================

const Visualizer = {
    /**
     * Render visual representation of the current problem
     */
    render(problem) {
        if (!Settings.showVisuals) {
            DOM.visualArea.classList.add('hidden');
            return;
        }

        DOM.visualArea.classList.remove('hidden');
        DOM.visualArea.innerHTML = '';

        if (problem.type === 'multiplication') {
            this.renderArray(problem.display.num1, problem.display.num2);
        } else {
            this.renderDivisionGroups(problem.display.num1, problem.display.num2);
        }
    },

    /**
     * Render an array for multiplication (rows x columns)
     */
    renderArray(rows, cols) {
        // Limit display size
        const maxDisplay = 8;
        const displayRows = Math.min(rows, maxDisplay);
        const displayCols = Math.min(cols, maxDisplay);

        const container = document.createElement('div');
        container.className = 'array-grid';
        container.style.gridTemplateColumns = `repeat(${displayCols}, 24px)`;

        for (let i = 0; i < displayRows * displayCols; i++) {
            const dot = document.createElement('div');
            dot.className = 'array-dot multiply';

            // Animate dots appearing
            if (Settings.animationsEnabled) {
                dot.style.opacity = '0';
                dot.style.transform = 'scale(0)';
                setTimeout(() => {
                    dot.style.opacity = '1';
                    dot.style.transform = 'scale(1)';
                }, i * 30);
            }

            container.appendChild(dot);
        }

        // Add label
        const label = document.createElement('div');
        label.style.marginTop = '12px';
        label.style.color = 'var(--text-secondary)';
        label.style.fontSize = 'var(--font-size-sm)';
        label.textContent = `${rows} rows × ${cols} columns`;

        if (rows > maxDisplay || cols > maxDisplay) {
            label.textContent += ' (showing part)';
        }

        DOM.visualArea.appendChild(container);
        DOM.visualArea.appendChild(label);
    },

    /**
     * Render groups for division
     */
    renderDivisionGroups(total, divisor) {
        const result = Math.floor(total / divisor);
        const maxGroups = 6;
        const maxPerGroup = 8;

        const displayGroups = Math.min(result, maxGroups);
        const displayPerGroup = Math.min(divisor, maxPerGroup);

        const container = document.createElement('div');
        container.className = 'groups-container';

        for (let g = 0; g < displayGroups; g++) {
            const group = document.createElement('div');
            group.className = 'group';

            for (let i = 0; i < displayPerGroup; i++) {
                const item = document.createElement('div');
                item.className = 'group-item';

                if (Settings.animationsEnabled) {
                    item.style.opacity = '0';
                    setTimeout(() => {
                        item.style.opacity = '1';
                    }, (g * displayPerGroup + i) * 50);
                }

                group.appendChild(item);
            }

            container.appendChild(group);
        }

        // Add label
        const label = document.createElement('div');
        label.style.marginTop = '12px';
        label.style.color = 'var(--text-secondary)';
        label.style.fontSize = 'var(--font-size-sm)';
        label.textContent = `${total} items ÷ ${divisor} per group = ? groups`;

        if (result > maxGroups) {
            label.textContent = `Showing ${displayGroups} of ${result} groups`;
        }

        DOM.visualArea.appendChild(container);
        DOM.visualArea.appendChild(label);
    },

    /**
     * Show hint visualization
     */
    showHint(problem) {
        if (problem.type === 'multiplication') {
            // Highlight rows one by one
            const dots = DOM.visualArea.querySelectorAll('.array-dot');
            const cols = problem.display.num2;
            let row = 0;

            const highlightRow = () => {
                if (row >= problem.display.num1) return;

                for (let c = 0; c < cols; c++) {
                    const idx = row * cols + c;
                    if (dots[idx]) {
                        dots[idx].classList.add('highlight');
                    }
                }

                row++;
                if (row < problem.display.num1) {
                    setTimeout(highlightRow, 500);
                }
            };

            highlightRow();
        }
    },
};

// =============================================================================
// UI Management
// =============================================================================

const UI = {
    /**
     * Switch between screens
     */
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    },

    /**
     * Display the current problem
     */
    displayProblem(problem) {
        DOM.num1.textContent = problem.display.num1;
        DOM.num2.textContent = problem.display.num2;
        DOM.answerDisplay.textContent = '?';

        // Update operator styling
        DOM.operator.textContent = problem.display.operator;
        DOM.operator.className = 'problem-operator ' + problem.type.replace('iplication', '');
        if (problem.type === 'multiplication') {
            DOM.operator.classList.add('multiply');
        } else {
            DOM.operator.classList.add('divide');
        }

        // Reset input
        DOM.answerInput.value = '';
        DOM.answerInput.className = 'answer-input';
        DOM.answerInput.focus();

        // Hide feedback
        DOM.feedbackArea.classList.add('hidden');

        // Render visual
        Visualizer.render(problem);
    },

    /**
     * Show feedback after answer submission
     */
    showFeedback(correct, problem, userAnswer) {
        DOM.feedbackArea.classList.remove('hidden', 'success', 'error');
        DOM.feedbackArea.classList.add(correct ? 'success' : 'error');

        const playerName = GameState.playerName || 'Friend';

        if (correct) {
            // Personalized correct message
            let message = CorrectMessages[Math.floor(Math.random() * CorrectMessages.length)];

            // Add streak encouragement
            if (GameState.currentStreak >= 3) {
                message += ` ${GameState.currentStreak} in a row, ${playerName}!`;
            }

            DOM.feedbackMessage.textContent = message;
            DOM.feedbackExplanation.textContent = `${problem.display.num1} ${problem.display.operator} ${problem.display.num2} = ${problem.answer}`;
            DOM.answerInput.classList.add('correct');
            DOM.answerDisplay.textContent = problem.answer;
        } else {
            // Supportive message with player's name
            let message = EncouragingMessages[Math.floor(Math.random() * EncouragingMessages.length)];

            DOM.feedbackMessage.textContent = message;
            DOM.feedbackExplanation.innerHTML = this.getHelpfulExplanation(problem, userAnswer);
            DOM.answerInput.classList.add('incorrect');
            DOM.answerDisplay.textContent = problem.answer;
        }
    },

    /**
     * Generate helpful explanation for wrong answer
     */
    getHelpfulExplanation(problem, userAnswer) {
        const num1 = problem.display.num1;
        const num2 = problem.display.num2;
        const answer = problem.answer;

        let explanation = `<strong>The answer is ${answer}</strong><br>`;

        if (problem.type === 'multiplication') {
            // Generate skip counting hint
            const skipCount = [];
            for (let i = 1; i <= num1 && i <= 5; i++) {
                skipCount.push(num2 * i);
            }
            if (num1 > 5) skipCount.push('...');
            skipCount.push(answer);

            explanation += `${num1} × ${num2} = ${num1} groups of ${num2}<br>`;
            explanation += `<span style="color: var(--text-muted)">Count by ${num2}s: ${skipCount.join(', ')}</span>`;
        } else {
            explanation += `${num1} ÷ ${num2} = How many ${num2}s fit in ${num1}?<br>`;
            explanation += `<span style="color: var(--text-muted)">${num2} × ${answer} = ${num1}</span>`;
        }

        return explanation;
    },

    /**
     * Update progress bar
     */
    updateProgress() {
        const progress = (GameState.problemsCompleted / Settings.sessionLength) * 100;
        DOM.sessionProgress.style.width = `${progress}%`;
        DOM.progressText.textContent = `${GameState.problemsCompleted} / ${Settings.sessionLength}`;
    },

    /**
     * Update stats display
     */
    updateStats() {
        DOM.pointsDisplay.textContent = GameState.totalPoints;
        DOM.streakDisplay.textContent = GameState.currentStreak;
        DOM.currentLevel.textContent = GameState.level;
    },

    /**
     * Show achievement toast
     */
    showAchievement(badge) {
        DOM.toastTitle.textContent = badge.name;
        DOM.toastMessage.textContent = badge.description;
        DOM.achievementToast.classList.remove('hidden');

        AudioManager.playAchievement();

        setTimeout(() => {
            DOM.achievementToast.classList.add('hidden');
        }, 3000);
    },

    /**
     * Apply visual settings to body
     */
    applySettings() {
        document.body.classList.toggle('no-animations', !Settings.animationsEnabled);
        document.body.classList.toggle('focus-mode', Settings.focusMode);
        document.body.classList.toggle('large-text', Settings.largeText);
        document.body.classList.toggle('high-contrast', Settings.highContrast);
    },
};

// =============================================================================
// Game Controller
// =============================================================================

const Game = {
    problemStartTime: null,
    breakTimer: null,
    breakCheckInterval: null,

    /**
     * Initialize the game
     */
    init() {
        this.loadSavedData();
        this.bindEvents();
        UI.applySettings();
        AudioManager.init();
    },

    /**
     * Load saved game data from localStorage
     */
    loadSavedData() {
        try {
            const savedState = localStorage.getItem('mathAdventure_state');
            const savedSettings = localStorage.getItem('mathAdventure_settings');

            if (savedState) {
                const state = JSON.parse(savedState);
                Object.assign(GameState, state);
            }

            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                Object.assign(Settings, settings);
                this.populateSettingsUI();
            }
        } catch (e) {
            console.log('Could not load saved data');
        }
    },

    /**
     * Save game data to localStorage
     */
    saveData() {
        try {
            // Update mastered facts
            this.updateMasteredFacts();

            localStorage.setItem('mathAdventure_state', JSON.stringify({
                playerName: GameState.playerName,
                level: GameState.level,
                totalPoints: GameState.totalPoints,
                totalCorrect: GameState.totalCorrect,
                totalAttempts: GameState.totalAttempts,
                bestStreak: GameState.bestStreak,
                badges: GameState.badges,
                factPerformance: GameState.factPerformance,
                progressHistory: GameState.progressHistory,
                masteredFacts: GameState.masteredFacts,
            }));
            localStorage.setItem('mathAdventure_settings', JSON.stringify(Settings));
        } catch (e) {
            console.log('Could not save data');
        }
    },

    /**
     * Update list of mastered facts (accuracy > 85% with at least 5 attempts)
     */
    updateMasteredFacts() {
        GameState.masteredFacts = [];
        for (const [key, perf] of Object.entries(GameState.factPerformance)) {
            const total = perf.correct + perf.incorrect;
            if (total >= 5) {
                const accuracy = perf.correct / total;
                if (accuracy >= 0.85) {
                    GameState.masteredFacts.push(key);
                }
            }
        }
    },

    /**
     * Record today's progress
     */
    recordDailyProgress() {
        const today = new Date().toISOString().split('T')[0]; // "2024-01-15" format

        // Find or create today's entry
        let todayEntry = GameState.progressHistory.find(entry => entry.date === today);

        if (!todayEntry) {
            todayEntry = {
                date: today,
                correct: 0,
                attempts: 0,
                points: 0,
                sessions: 0,
            };
            GameState.progressHistory.push(todayEntry);

            // Keep only last 30 days of history
            if (GameState.progressHistory.length > 30) {
                GameState.progressHistory.shift();
            }
        }

        // Update today's stats
        todayEntry.correct += GameState.sessionCorrect;
        todayEntry.attempts += GameState.sessionProblems;
        todayEntry.points += GameState.sessionPoints;
        todayEntry.sessions += 1;
    },

    /**
     * Bind all event listeners
     */
    bindEvents() {
        // Welcome screen
        DOM.startBtn.addEventListener('click', () => this.startGame());
        DOM.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startGame();
        });
        DOM.settingsBtnWelcome.addEventListener('click', () => this.openSettings());
        DOM.progressBtnWelcome.addEventListener('click', () => this.openProgress());
        DOM.closeProgress.addEventListener('click', () => this.closeProgress());
        DOM.progressModal.addEventListener('click', (e) => {
            if (e.target === DOM.progressModal) this.closeProgress();
        });

        // Game screen
        DOM.submitBtn.addEventListener('click', () => this.submitAnswer());
        DOM.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitAnswer();
        });
        DOM.hintBtn.addEventListener('click', () => this.showHint());
        DOM.pauseBtn.addEventListener('click', () => this.pauseGame());
        DOM.settingsBtnGame.addEventListener('click', () => this.openSettings());

        // Break screen
        DOM.skipBreakBtn.addEventListener('click', () => this.skipBreak());

        // Complete screen
        DOM.continueBtn.addEventListener('click', () => this.continueSession());
        DOM.finishBtn.addEventListener('click', () => this.finishSession());

        // Settings modal
        DOM.closeSettings.addEventListener('click', () => this.closeSettings());
        DOM.saveSettings.addEventListener('click', () => this.saveSettings());

        // Pause modal
        DOM.resumeBtn.addEventListener('click', () => this.resumeGame());
        DOM.quitBtn.addEventListener('click', () => this.quitSession());

        // Close modals on outside click
        DOM.settingsModal.addEventListener('click', (e) => {
            if (e.target === DOM.settingsModal) this.closeSettings();
        });
        DOM.pauseModal.addEventListener('click', (e) => {
            if (e.target === DOM.pauseModal) this.resumeGame();
        });
    },

    /**
     * Start a new game session
     */
    startGame() {
        // Get player name
        const name = DOM.playerNameInput.value.trim() || 'Player';
        GameState.playerName = name;
        DOM.playerDisplayName.textContent = name;

        // Reset session state
        GameState.sessionActive = true;
        GameState.sessionProblems = 0;
        GameState.sessionCorrect = 0;
        GameState.sessionPoints = 0;
        GameState.problemsCompleted = 0;
        GameState.currentStreak = 0;
        GameState.newBadges = [];
        GameState.sessionStartTime = Date.now();
        GameState.lastBreakTime = Date.now();

        // Update UI
        UI.updateStats();
        UI.updateProgress();
        UI.showScreen('game-screen');

        // Start break check interval
        if (Settings.breakInterval > 0) {
            this.breakCheckInterval = setInterval(() => this.checkForBreak(), 60000);
        }

        // Generate first problem
        this.nextProblem();

        this.saveData();
    },

    /**
     * Generate and display next problem
     */
    nextProblem() {
        GameState.currentProblem = MathEngine.generateProblem();
        this.problemStartTime = Date.now();
        UI.displayProblem(GameState.currentProblem);
    },

    /**
     * Handle answer submission
     */
    submitAnswer() {
        const userAnswer = parseInt(DOM.answerInput.value);
        const problem = GameState.currentProblem;

        if (isNaN(userAnswer)) {
            DOM.answerInput.focus();
            return;
        }

        const timeToAnswer = Date.now() - this.problemStartTime;
        const correct = userAnswer === problem.answer;

        // Update tracking
        GameState.totalAttempts++;
        GameState.sessionProblems++;

        // Record for spaced repetition
        if (problem.type === 'multiplication') {
            MathEngine.recordFactPerformance(problem.display.num1, problem.display.num2, correct);
        } else {
            MathEngine.recordFactPerformance(problem.answer, problem.display.num2, correct);
        }

        if (correct) {
            // Correct answer
            const points = MathEngine.calculatePoints(problem, timeToAnswer);
            GameState.totalPoints += points;
            GameState.sessionPoints += points;
            GameState.totalCorrect++;
            GameState.sessionCorrect++;
            GameState.currentStreak++;

            if (GameState.currentStreak > GameState.bestStreak) {
                GameState.bestStreak = GameState.currentStreak;
            }

            AudioManager.playCorrect();
            this.checkAchievements();
            this.checkLevelUp();
        } else {
            // Wrong answer
            GameState.currentStreak = 0;
            AudioManager.playIncorrect();
        }

        // Show feedback
        UI.showFeedback(correct, problem, userAnswer);
        UI.updateStats();

        // Move to next problem or end session after delay
        GameState.problemsCompleted++;
        UI.updateProgress();

        setTimeout(() => {
            if (GameState.problemsCompleted >= Settings.sessionLength) {
                this.endSession();
            } else {
                this.nextProblem();
            }
        }, correct ? 1500 : 2500);

        this.saveData();
    },

    /**
     * Show hint for current problem
     */
    showHint() {
        Visualizer.showHint(GameState.currentProblem);
    },

    /**
     * Check for achievements
     */
    checkAchievements() {
        const earnBadge = (badgeId) => {
            if (!GameState.badges.includes(badgeId)) {
                GameState.badges.push(badgeId);
                GameState.newBadges.push(badgeId);
                UI.showAchievement(Badges[badgeId]);
            }
        };

        // First problem
        if (GameState.totalCorrect === 1) {
            earnBadge('firstProblem');
        }

        // Streak badges
        if (GameState.currentStreak >= 5) {
            earnBadge('streak5');
        }
        if (GameState.currentStreak >= 10) {
            earnBadge('streak10');
        }

        // Points badge
        if (GameState.sessionPoints >= 100) {
            earnBadge('points100');
        }

        // Level badges
        if (GameState.level >= 5) {
            earnBadge('level5');
        }
        if (GameState.level >= 10) {
            earnBadge('level10');
        }
    },

    /**
     * Check if player should level up
     */
    checkLevelUp() {
        const pointsForNextLevel = GameState.level * 100;
        if (GameState.totalPoints >= pointsForNextLevel * GameState.level) {
            GameState.level++;
            AudioManager.playLevelUp();
            UI.updateStats();
        }
    },

    /**
     * Check if it's time for a break
     */
    checkForBreak() {
        if (Settings.breakInterval === 0) return;

        const minutesSinceBreak = (Date.now() - GameState.lastBreakTime) / 60000;
        if (minutesSinceBreak >= Settings.breakInterval) {
            this.showBreak();
        }
    },

    /**
     * Show break screen
     */
    showBreak() {
        UI.showScreen('break-screen');
        let countdown = 60;
        DOM.breakCountdown.textContent = countdown;

        this.breakTimer = setInterval(() => {
            countdown--;
            DOM.breakCountdown.textContent = countdown;
            if (countdown <= 0) {
                this.skipBreak();
            }
        }, 1000);
    },

    /**
     * Skip or end break
     */
    skipBreak() {
        if (this.breakTimer) {
            clearInterval(this.breakTimer);
            this.breakTimer = null;
        }
        GameState.lastBreakTime = Date.now();
        UI.showScreen('game-screen');
        DOM.answerInput.focus();
    },

    /**
     * End the current session
     */
    endSession() {
        GameState.sessionActive = false;

        if (this.breakCheckInterval) {
            clearInterval(this.breakCheckInterval);
            this.breakCheckInterval = null;
        }

        // Record daily progress
        this.recordDailyProgress();

        // Check for perfect session
        if (GameState.sessionCorrect === Settings.sessionLength) {
            if (!GameState.badges.includes('perfectSession')) {
                GameState.badges.push('perfectSession');
                GameState.newBadges.push('perfectSession');
            }
        }

        // Update complete screen
        const accuracy = Math.round((GameState.sessionCorrect / Settings.sessionLength) * 100);
        DOM.sessionCorrectDisplay.textContent = GameState.sessionCorrect;
        DOM.sessionAccuracy.textContent = accuracy + '%';
        DOM.sessionPointsDisplay.textContent = GameState.sessionPoints;

        // Set title based on performance
        if (accuracy === 100) {
            DOM.completeTitle.textContent = 'Perfect Score!';
        } else if (accuracy >= 80) {
            DOM.completeTitle.textContent = 'Great Job!';
        } else if (accuracy >= 60) {
            DOM.completeTitle.textContent = 'Good Effort!';
        } else {
            DOM.completeTitle.textContent = 'Keep Practicing!';
        }

        // Show new badges
        if (GameState.newBadges.length > 0) {
            DOM.badgesEarned.classList.remove('hidden');
            DOM.newBadges.innerHTML = '';
            for (const badgeId of GameState.newBadges) {
                const badge = Badges[badgeId];
                const badgeEl = document.createElement('div');
                badgeEl.className = 'badge';
                badgeEl.innerHTML = `
                    <span class="badge-icon">${badge.icon}</span>
                    <span class="badge-name">${badge.name}</span>
                `;
                DOM.newBadges.appendChild(badgeEl);
            }
        } else {
            DOM.badgesEarned.classList.add('hidden');
        }

        UI.showScreen('complete-screen');
        this.saveData();
    },

    /**
     * Continue with another session
     */
    continueSession() {
        GameState.sessionProblems = 0;
        GameState.sessionCorrect = 0;
        GameState.sessionPoints = 0;
        GameState.problemsCompleted = 0;
        GameState.newBadges = [];
        GameState.sessionActive = true;
        GameState.sessionStartTime = Date.now();
        GameState.lastBreakTime = Date.now();

        if (Settings.breakInterval > 0) {
            this.breakCheckInterval = setInterval(() => this.checkForBreak(), 60000);
        }

        UI.updateProgress();
        UI.showScreen('game-screen');
        this.nextProblem();
    },

    /**
     * Finish and return to welcome screen
     */
    finishSession() {
        UI.showScreen('welcome-screen');
        DOM.playerNameInput.value = GameState.playerName;
    },

    /**
     * Pause the game
     */
    pauseGame() {
        DOM.pauseModal.classList.remove('hidden');
    },

    /**
     * Resume from pause
     */
    resumeGame() {
        DOM.pauseModal.classList.add('hidden');
        DOM.answerInput.focus();
    },

    /**
     * Quit current session
     */
    quitSession() {
        DOM.pauseModal.classList.add('hidden');
        this.endSession();
    },

    /**
     * Open settings modal
     */
    openSettings() {
        this.populateSettingsUI();
        DOM.settingsModal.classList.remove('hidden');
    },

    /**
     * Open progress modal
     */
    openProgress() {
        this.populateProgressUI();
        DOM.progressModal.classList.remove('hidden');
    },

    /**
     * Close progress modal
     */
    closeProgress() {
        DOM.progressModal.classList.add('hidden');
    },

    /**
     * Populate progress modal with data
     */
    populateProgressUI() {
        // Overall stats
        DOM.totalProblemsSolved.textContent = GameState.totalCorrect;
        DOM.totalPointsEarned.textContent = GameState.totalPoints;
        DOM.factsMastered.textContent = GameState.masteredFacts ? GameState.masteredFacts.length : 0;

        // Calculate overall accuracy
        const accuracy = GameState.totalAttempts > 0
            ? Math.round((GameState.totalCorrect / GameState.totalAttempts) * 100)
            : 0;
        DOM.overallAccuracy.textContent = accuracy + '%';

        // Recent activity
        this.renderRecentActivity();

        // Mastered facts
        this.renderMasteredFacts();

        // Badges
        this.renderBadgesCollection();
    },

    /**
     * Render recent activity list
     */
    renderRecentActivity() {
        if (!GameState.progressHistory || GameState.progressHistory.length === 0) {
            DOM.recentActivity.innerHTML = '<p class="no-data">No activity yet. Start playing to track your progress!</p>';
            return;
        }

        // Show last 7 days, most recent first
        const recentDays = GameState.progressHistory.slice(-7).reverse();

        let html = '';
        for (const day of recentDays) {
            const date = new Date(day.date);
            const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const dayAccuracy = day.attempts > 0 ? Math.round((day.correct / day.attempts) * 100) : 0;

            html += `
                <div class="activity-day">
                    <span class="activity-date">${dateStr}</span>
                    <div class="activity-stats">
                        <span>${day.correct}/${day.attempts} correct</span>
                        <span class="activity-accuracy">${dayAccuracy}%</span>
                        <span>+${day.points} pts</span>
                    </div>
                </div>
            `;
        }

        DOM.recentActivity.innerHTML = html;
    },

    /**
     * Render mastered facts
     */
    renderMasteredFacts() {
        if (!GameState.masteredFacts || GameState.masteredFacts.length === 0) {
            DOM.masteredFactsList.innerHTML = '<p class="no-data">Keep practicing to master facts! (85%+ accuracy)</p>';
            return;
        }

        let html = '';
        for (const fact of GameState.masteredFacts) {
            // Convert "3x4" to "3 × 4"
            const display = fact.replace('x', ' × ');
            html += `<span class="mastered-fact">${display}</span>`;
        }

        DOM.masteredFactsList.innerHTML = html;
    },

    /**
     * Render badges collection
     */
    renderBadgesCollection() {
        let html = '';

        for (const [id, badge] of Object.entries(Badges)) {
            const earned = GameState.badges.includes(id);
            html += `
                <div class="badge-item ${earned ? '' : 'locked'}">
                    <span class="badge-item-icon">${badge.icon}</span>
                    <span class="badge-item-name">${badge.name}</span>
                </div>
            `;
        }

        DOM.badgesCollection.innerHTML = html;
    },

    /**
     * Close settings modal
     */
    closeSettings() {
        DOM.settingsModal.classList.add('hidden');
    },

    /**
     * Populate settings UI with current values
     */
    populateSettingsUI() {
        DOM.modeSelect.value = Settings.mode;
        DOM.tableSelect.value = Settings.tableRange;
        DOM.sessionLengthSelect.value = Settings.sessionLength;
        DOM.breakIntervalSelect.value = Settings.breakInterval;
        DOM.showVisualsToggle.checked = Settings.showVisuals;
        DOM.animationsToggle.checked = Settings.animationsEnabled;
        DOM.soundsToggle.checked = Settings.soundsEnabled;
        DOM.focusModeToggle.checked = Settings.focusMode;
        DOM.largeTextToggle.checked = Settings.largeText;
        DOM.highContrastToggle.checked = Settings.highContrast;
    },

    /**
     * Save settings
     */
    saveSettings() {
        Settings.mode = DOM.modeSelect.value;
        Settings.tableRange = DOM.tableSelect.value;
        Settings.sessionLength = parseInt(DOM.sessionLengthSelect.value);
        Settings.breakInterval = parseInt(DOM.breakIntervalSelect.value);
        Settings.showVisuals = DOM.showVisualsToggle.checked;
        Settings.animationsEnabled = DOM.animationsToggle.checked;
        Settings.soundsEnabled = DOM.soundsToggle.checked;
        Settings.focusMode = DOM.focusModeToggle.checked;
        Settings.largeText = DOM.largeTextToggle.checked;
        Settings.highContrast = DOM.highContrastToggle.checked;

        // Reset problem pool when settings change for fresh variety
        MathEngine.resetPool();

        UI.applySettings();
        this.saveData();
        this.closeSettings();
    },
};

// =============================================================================
// Initialize on DOM Ready
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
