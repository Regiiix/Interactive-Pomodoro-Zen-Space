/**
 * Zen Space - Interactive Pomodoro Timer
 * A productivity timer wrapped in a beautiful environment
 */

class ZenPomodoro {
    constructor() {
        // Timer state
        this.timeRemaining = 25 * 60; // seconds
        this.totalTime = 25 * 60;
        this.isRunning = false;
        this.timerInterval = null;
        this.currentSession = 'work';
        this.completedSessions = 0;
        
        // Settings
        this.settings = {
            workDuration: 25,
            shortBreakDuration: 5,
            longBreakDuration: 15,
            sessionsUntilLong: 4,
            autoStartBreaks: true,
            autoStartWork: false,
            soundNotifications: true
        };
        
        // Audio context and sounds
        this.audioContext = null;
        this.activeSounds = {};
        this.masterVolume = 0.5;
        
        // Sound configurations for procedural audio generation
        this.soundConfigs = {
            rain: { type: 'rain', baseFreq: 800 },
            forest: { type: 'forest', baseFreq: 2000 },
            cafe: { type: 'cafe', baseFreq: 400 },
            waves: { type: 'waves', baseFreq: 100 },
            whitenoise: { type: 'whitenoise', baseFreq: 0 }
        };
        
        // DOM Elements
        this.elements = {};
        
        // Initialize
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.loadSettings();
        this.bindEvents();
        this.updateDisplay();
        this.updateProgressRing();
    }
    
    cacheElements() {
        this.elements = {
            timerDisplay: document.getElementById('timerDisplay'),
            sessionLabel: document.getElementById('sessionLabel'),
            progressRing: document.getElementById('progressRing'),
            startBtn: document.getElementById('startBtn'),
            resetBtn: document.getElementById('resetBtn'),
            skipBtn: document.getElementById('skipBtn'),
            sessionCounter: document.getElementById('sessionCounter'),
            timerSection: document.querySelector('.timer-section'),
            
            // Tabs
            tabs: document.querySelectorAll('.tab'),
            
            // Scene buttons
            sceneButtons: document.querySelectorAll('.scene-btn'),
            backgroundContainer: document.getElementById('backgroundContainer'),
            
            // Sound buttons
            soundButtons: document.querySelectorAll('.sound-btn'),
            volumeSlider: document.getElementById('volumeSlider'),
            volumeValue: document.getElementById('volumeValue'),
            
            // Settings modal
            settingsBtn: document.getElementById('settingsBtn'),
            settingsModal: document.getElementById('settingsModal'),
            closeSettings: document.getElementById('closeSettings'),
            saveSettings: document.getElementById('saveSettings'),
            
            // Settings inputs
            workDuration: document.getElementById('workDuration'),
            shortBreakDuration: document.getElementById('shortBreakDuration'),
            longBreakDuration: document.getElementById('longBreakDuration'),
            sessionsUntilLong: document.getElementById('sessionsUntilLong'),
            autoStartBreaks: document.getElementById('autoStartBreaks'),
            autoStartWork: document.getElementById('autoStartWork'),
            soundNotifications: document.getElementById('soundNotifications'),
            
            // Toast
            toast: document.getElementById('toast'),
            toastMessage: document.getElementById('toastMessage')
        };
    }
    
    bindEvents() {
        // Timer controls
        this.elements.startBtn.addEventListener('click', () => this.toggleTimer());
        this.elements.resetBtn.addEventListener('click', () => this.resetTimer());
        this.elements.skipBtn.addEventListener('click', () => this.skipSession());
        
        // Session tabs
        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchSession(tab.dataset.session));
        });
        
        // Scene switching
        this.elements.sceneButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchScene(btn.dataset.bg));
        });
        
        // Sound controls
        this.elements.soundButtons.forEach(btn => {
            btn.addEventListener('click', () => this.toggleSound(btn.dataset.sound));
        });
        
        // Volume control
        this.elements.volumeSlider.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });
        
        // Settings modal
        this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
        this.elements.closeSettings.addEventListener('click', () => this.closeSettingsModal());
        this.elements.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.elements.settingsModal) {
                this.closeSettingsModal();
            }
        });
        this.elements.saveSettings.addEventListener('click', () => this.saveSettingsAndClose());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Visibility change (pause timer when tab is hidden - optional)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isRunning) {
                // Timer continues in background
            }
        });
    }
    
    // Timer Methods
    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }
    
    startTimer() {
        if (this.timeRemaining <= 0) return;
        
        this.isRunning = true;
        this.updatePlayPauseButton();
        
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateDisplay();
            this.updateProgressRing();
            
            if (this.timeRemaining <= 0) {
                this.completeSession();
            }
        }, 1000);
    }
    
    pauseTimer() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
        this.updatePlayPauseButton();
    }
    
    resetTimer() {
        this.pauseTimer();
        this.timeRemaining = this.totalTime;
        this.updateDisplay();
        this.updateProgressRing();
    }
    
    skipSession() {
        this.completeSession();
    }
    
    completeSession() {
        this.pauseTimer();
        
        // Play notification sound
        if (this.settings.soundNotifications) {
            this.playNotificationSound();
        }
        
        // Update session count
        if (this.currentSession === 'work') {
            this.completedSessions++;
            this.updateSessionCounter();
            
            // Determine next break type
            if (this.completedSessions % this.settings.sessionsUntilLong === 0) {
                this.switchSession('longBreak');
                this.showToast('Great work! Time for a long break.');
            } else {
                this.switchSession('shortBreak');
                this.showToast('Nice focus session! Take a short break.');
            }
            
            if (this.settings.autoStartBreaks) {
                setTimeout(() => this.startTimer(), 1000);
            }
        } else {
            this.switchSession('work');
            this.showToast('Break complete! Ready to focus?');
            
            if (this.settings.autoStartWork) {
                setTimeout(() => this.startTimer(), 1000);
            }
        }
    }
    
    switchSession(sessionType) {
        this.pauseTimer();
        this.currentSession = sessionType;
        
        // Update time based on session type
        switch (sessionType) {
            case 'work':
                this.totalTime = this.settings.workDuration * 60;
                this.elements.sessionLabel.textContent = 'Focus Time';
                break;
            case 'shortBreak':
                this.totalTime = this.settings.shortBreakDuration * 60;
                this.elements.sessionLabel.textContent = 'Short Break';
                break;
            case 'longBreak':
                this.totalTime = this.settings.longBreakDuration * 60;
                this.elements.sessionLabel.textContent = 'Long Break';
                break;
        }
        
        this.timeRemaining = this.totalTime;
        
        // Update UI
        this.updateDisplay();
        this.updateProgressRing();
        this.updateTabs();
        this.elements.timerSection.setAttribute('data-session', sessionType);
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        this.elements.timerDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update page title
        document.title = `${this.elements.timerDisplay.textContent} - Zen Space`;
    }
    
    updateProgressRing() {
        const circumference = 2 * Math.PI * 140; // r = 140
        const progress = this.timeRemaining / this.totalTime;
        const offset = circumference * (1 - progress);
        this.elements.progressRing.style.strokeDashoffset = offset;
    }
    
    updatePlayPauseButton() {
        const playIcon = this.elements.startBtn.querySelector('.play-icon');
        const pauseIcon = this.elements.startBtn.querySelector('.pause-icon');
        
        if (this.isRunning) {
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
        } else {
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
        }
    }
    
    updateTabs() {
        this.elements.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.session === this.currentSession);
        });
    }
    
    updateSessionCounter() {
        const currentInCycle = (this.completedSessions % this.settings.sessionsUntilLong) || this.settings.sessionsUntilLong;
        this.elements.sessionCounter.textContent = 
            `Session ${currentInCycle} of ${this.settings.sessionsUntilLong}`;
    }
    
    // Scene Methods
    switchScene(sceneId) {
        // Update buttons
        this.elements.sceneButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.bg === sceneId);
        });
        
        // Switch background
        document.querySelectorAll('.bg-scene').forEach(scene => {
            scene.classList.remove('active');
        });
        
        const newScene = document.getElementById(`bg-${sceneId}`);
        if (newScene) {
            newScene.classList.add('active');
        }
    }
    
    // Audio Methods
    initAudioContext() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.error('Web Audio API not supported:', e);
                this.showToast('Audio not supported in this browser');
                return null;
            }
        }
        return this.audioContext;
    }
    
    async toggleSound(soundType) {
        const btn = document.querySelector(`[data-sound="${soundType}"]`);
        
        if (this.activeSounds[soundType]) {
            // Stop the sound
            this.stopSound(soundType);
            btn.classList.remove('active');
        } else {
            // Start the sound
            const success = await this.startSound(soundType);
            if (success) {
                btn.classList.add('active');
            }
        }
    }
    
    async startSound(soundType) {
        const ctx = this.initAudioContext();
        if (!ctx) return false;
        
        // Resume audio context if suspended (required for autoplay policy)
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (e) {
                console.error('Failed to resume audio context:', e);
                this.showToast('Click to enable audio');
                return false;
            }
        }
        
        try {
            let nodes = {};
            
            switch (soundType) {
                case 'whitenoise':
                    nodes = this.createWhiteNoise();
                    break;
                case 'rain':
                    nodes = this.createRainSound();
                    break;
                case 'waves':
                    nodes = this.createWavesSound();
                    break;
                case 'forest':
                    nodes = this.createForestSound();
                    break;
                case 'cafe':
                    nodes = this.createCafeSound();
                    break;
                default:
                    nodes = this.createWhiteNoise();
            }
            
            this.activeSounds[soundType] = nodes;
            return true;
        } catch (e) {
            console.error('Error creating sound:', e);
            this.showToast('Error playing sound');
            return false;
        }
    }
    
    stopSound(soundType) {
        const nodes = this.activeSounds[soundType];
        if (nodes) {
            // Fade out using linear ramp (exponential fails near zero)
            if (nodes.gainNode) {
                const now = this.audioContext.currentTime;
                nodes.gainNode.gain.setValueAtTime(nodes.gainNode.gain.value, now);
                nodes.gainNode.gain.linearRampToValueAtTime(0.001, now + 0.3);
            }
            
            // Also fade additional gains if present
            if (nodes.gains) {
                const now = this.audioContext.currentTime;
                nodes.gains.forEach(gain => {
                    gain.gain.setValueAtTime(gain.gain.value, now);
                    gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
                });
            }
            
            // Stop all sources after fade
            setTimeout(() => {
                if (nodes.sources) {
                    nodes.sources.forEach(source => {
                        try { source.stop(); } catch(e) {}
                    });
                }
                if (nodes.source) {
                    try { nodes.source.stop(); } catch(e) {}
                }
                if (nodes.intervals) {
                    nodes.intervals.forEach(interval => clearInterval(interval));
                }
            }, 350);
            
            delete this.activeSounds[soundType];
        }
    }
    
    createWhiteNoise() {
        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = this.audioContext.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = this.masterVolume * 0.3;
        
        // Add filter for softer sound
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 3000;
        
        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        whiteNoise.start();
        
        return { source: whiteNoise, gainNode, filter };
    }
    
    createRainSound() {
        const sources = [];
        const gains = [];
        
        // Create multiple noise layers for rain texture
        for (let i = 0; i < 3; i++) {
            const bufferSize = 2 * this.audioContext.sampleRate;
            const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            
            for (let j = 0; j < bufferSize; j++) {
                output[j] = Math.random() * 2 - 1;
            }
            
            const source = this.audioContext.createBufferSource();
            source.buffer = noiseBuffer;
            source.loop = true;
            
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 2000 + i * 1000;
            filter.Q.value = 0.5;
            
            const gain = this.audioContext.createGain();
            gain.gain.value = this.masterVolume * 0.15;
            
            source.connect(filter);
            filter.connect(gain);
            gain.connect(this.audioContext.destination);
            
            source.start();
            sources.push(source);
            gains.push(gain);
        }
        
        return { sources, gainNode: gains[0], gains };
    }
    
    createWavesSound() {
        const sources = [];
        
        // Create wave oscillations
        const lfo = this.audioContext.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1;
        
        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.value = 0.3;
        
        // White noise base
        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = this.masterVolume * 0.4;
        
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        noise.start();
        lfo.start();
        sources.push(noise, lfo);
        
        return { sources, gainNode };
    }
    
    createForestSound() {
        const sources = [];
        const intervals = [];
        
        // Ambient base layer
        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 0.3;
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = this.masterVolume * 0.15;
        
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        noise.start();
        sources.push(noise);
        
        // Bird chirps (random intervals)
        const createChirp = () => {
            const osc = this.audioContext.createOscillator();
            const chirpGain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = 2000 + Math.random() * 2000;
            
            chirpGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            chirpGain.gain.linearRampToValueAtTime(this.masterVolume * 0.1, this.audioContext.currentTime + 0.05);
            chirpGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
            
            osc.connect(chirpGain);
            chirpGain.connect(this.audioContext.destination);
            
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.3);
        };
        
        const chirpInterval = setInterval(() => {
            if (Math.random() > 0.5) {
                createChirp();
            }
        }, 2000 + Math.random() * 3000);
        
        intervals.push(chirpInterval);
        
        return { sources, gainNode, intervals };
    }
    
    createCafeSound() {
        const sources = [];
        const intervals = [];
        
        // Ambient chatter base
        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        
        // Multiple filters to simulate voices
        const filter1 = this.audioContext.createBiquadFilter();
        filter1.type = 'bandpass';
        filter1.frequency.value = 300;
        filter1.Q.value = 1;
        
        const filter2 = this.audioContext.createBiquadFilter();
        filter2.type = 'bandpass';
        filter2.frequency.value = 500;
        filter2.Q.value = 0.5;
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = this.masterVolume * 0.25;
        
        noise.connect(filter1);
        filter1.connect(filter2);
        filter2.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        noise.start();
        sources.push(noise);
        
        // Occasional cup/saucer sounds
        const createClink = () => {
            const osc = this.audioContext.createOscillator();
            const clinkGain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = 3000 + Math.random() * 1000;
            
            clinkGain.gain.setValueAtTime(this.masterVolume * 0.08, this.audioContext.currentTime);
            clinkGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
            
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 2000;
            
            osc.connect(filter);
            filter.connect(clinkGain);
            clinkGain.connect(this.audioContext.destination);
            
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.15);
        };
        
        const clinkInterval = setInterval(() => {
            if (Math.random() > 0.7) {
                createClink();
            }
        }, 3000 + Math.random() * 4000);
        
        intervals.push(clinkInterval);
        
        return { sources, gainNode, intervals };
    }
    
    setVolume(value) {
        this.masterVolume = value;
        this.elements.volumeValue.textContent = `${Math.round(value * 100)}%`;
        
        // Update all active sounds
        Object.keys(this.activeSounds).forEach(soundType => {
            const nodes = this.activeSounds[soundType];
            if (nodes) {
                const baseVolume = this.getBaseVolume(soundType);
                const newVolume = value * baseVolume;
                
                if (nodes.gainNode && this.audioContext) {
                    nodes.gainNode.gain.setValueAtTime(newVolume, this.audioContext.currentTime);
                }
                // Also update additional gains for multi-layer sounds like rain
                if (nodes.gains) {
                    nodes.gains.forEach(gain => {
                        gain.gain.setValueAtTime(newVolume, this.audioContext.currentTime);
                    });
                }
            }
        });
        
        // Save volume preference
        localStorage.setItem('zenPomodoroVolume', value.toString());
    }
    
    getBaseVolume(soundType) {
        const volumes = {
            whitenoise: 0.3,
            rain: 0.15,
            waves: 0.4,
            forest: 0.15,
            cafe: 0.25
        };
        return volumes[soundType] || 0.3;
    }
    
    playNotificationSound() {
        const ctx = this.initAudioContext();
        if (!ctx) return;
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        try {
            // Create a pleasant notification chime
            const playTone = (freq, startTime, duration) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'sine';
                osc.frequency.value = freq;
                
                gain.gain.setValueAtTime(0.001, startTime);
                gain.gain.linearRampToValueAtTime(this.masterVolume * 0.3, startTime + 0.05);
                gain.gain.linearRampToValueAtTime(0.001, startTime + duration);
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.start(startTime);
                osc.stop(startTime + duration + 0.1);
            };
            
            const now = this.audioContext.currentTime;
            playTone(523.25, now, 0.3);      // C5
            playTone(659.25, now + 0.1, 0.3); // E5
            playTone(783.99, now + 0.2, 0.5); // G5
        } catch (e) {
            console.error('Error playing notification sound:', e);
        }
    }
    
    // Settings Methods
    loadSettings() {
        const saved = localStorage.getItem('zenPomodoroSettings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
                this.applySettings();
            } catch (e) {
                console.error('Error loading settings:', e);
            }
        }
        
        // Load volume
        const savedVolume = localStorage.getItem('zenPomodoroVolume');
        if (savedVolume) {
            this.masterVolume = parseFloat(savedVolume);
            this.elements.volumeSlider.value = this.masterVolume * 100;
            this.elements.volumeValue.textContent = `${Math.round(this.masterVolume * 100)}%`;
        }
        
        // Load last scene
        const savedScene = localStorage.getItem('zenPomodoroScene');
        if (savedScene) {
            this.switchScene(savedScene);
        }
    }
    
    applySettings() {
        // Update total time based on current session
        this.switchSession(this.currentSession);
        this.updateSessionCounter();
    }
    
    openSettings() {
        // Populate settings inputs
        this.elements.workDuration.value = this.settings.workDuration;
        this.elements.shortBreakDuration.value = this.settings.shortBreakDuration;
        this.elements.longBreakDuration.value = this.settings.longBreakDuration;
        this.elements.sessionsUntilLong.value = this.settings.sessionsUntilLong;
        this.elements.autoStartBreaks.checked = this.settings.autoStartBreaks;
        this.elements.autoStartWork.checked = this.settings.autoStartWork;
        this.elements.soundNotifications.checked = this.settings.soundNotifications;
        
        // Show modal
        this.elements.settingsModal.classList.remove('hidden');
    }
    
    closeSettingsModal() {
        this.elements.settingsModal.classList.add('hidden');
    }
    
    saveSettingsAndClose() {
        // Get values from inputs
        this.settings.workDuration = parseInt(this.elements.workDuration.value) || 25;
        this.settings.shortBreakDuration = parseInt(this.elements.shortBreakDuration.value) || 5;
        this.settings.longBreakDuration = parseInt(this.elements.longBreakDuration.value) || 15;
        this.settings.sessionsUntilLong = parseInt(this.elements.sessionsUntilLong.value) || 4;
        this.settings.autoStartBreaks = this.elements.autoStartBreaks.checked;
        this.settings.autoStartWork = this.elements.autoStartWork.checked;
        this.settings.soundNotifications = this.elements.soundNotifications.checked;
        
        // Validate
        this.settings.workDuration = Math.max(1, Math.min(120, this.settings.workDuration));
        this.settings.shortBreakDuration = Math.max(1, Math.min(30, this.settings.shortBreakDuration));
        this.settings.longBreakDuration = Math.max(1, Math.min(60, this.settings.longBreakDuration));
        this.settings.sessionsUntilLong = Math.max(2, Math.min(10, this.settings.sessionsUntilLong));
        
        // Save to localStorage
        localStorage.setItem('zenPomodoroSettings', JSON.stringify(this.settings));
        
        // Apply settings
        this.applySettings();
        
        // Close modal and show toast
        this.closeSettingsModal();
        this.showToast('Settings saved successfully!');
    }
    
    // Utility Methods
    showToast(message) {
        this.elements.toastMessage.textContent = message;
        this.elements.toast.classList.remove('hidden');
        
        setTimeout(() => {
            this.elements.toast.classList.add('hidden');
        }, 3000);
    }
    
    handleKeyboard(e) {
        // Ignore if typing in input
        if (e.target.tagName === 'INPUT') return;
        
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.toggleTimer();
                break;
            case 'KeyR':
                if (!e.ctrlKey && !e.metaKey) {
                    this.resetTimer();
                }
                break;
            case 'KeyS':
                if (!e.ctrlKey && !e.metaKey) {
                    this.skipSession();
                }
                break;
            case 'Escape':
                this.closeSettingsModal();
                break;
            case 'Digit1':
                this.switchSession('work');
                break;
            case 'Digit2':
                this.switchSession('shortBreak');
                break;
            case 'Digit3':
                this.switchSession('longBreak');
                break;
        }
    }
    
    // Save scene preference
    switchScene(sceneId) {
        // Update buttons
        this.elements.sceneButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.bg === sceneId);
        });
        
        // Switch background
        document.querySelectorAll('.bg-scene').forEach(scene => {
            scene.classList.remove('active');
        });
        
        const newScene = document.getElementById(`bg-${sceneId}`);
        if (newScene) {
            newScene.classList.add('active');
        }
        
        // Save preference
        localStorage.setItem('zenPomodoroScene', sceneId);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.zenPomodoro = new ZenPomodoro();
});

// Handle service worker for PWA (optional enhancement)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker registration would go here
    });
}
