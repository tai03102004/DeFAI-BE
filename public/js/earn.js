class EarnManager {
    constructor() {
        this.userId = this.getUserId();
        this.username = this.getUsername();
        this.userProfile = null;
        this.init();
    }

    getUserId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('user_id') || '5648969247';
    }

    getUsername() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('username') || 'jashon_chang';
    }

    async init() {
        await this.loadUserProfile();
        this.initEventListeners();
        this.loadLeaderboard();
        this.loadAchievements();
    }

    async loadUserProfile() {
        try {
            const response = await fetch(`/api/gamification/user/${this.userId}`);
            const result = await response.json();
            if (result.success) {
                this.userProfile = result.data;
                this.updateBalanceDisplay();
            }
        } catch (error) {
            console.error('❌ Failed to load user profile:', error);
        }
    }

    updateBalanceDisplay() {
        const balanceEl = document.getElementById('userBalance');
        if (balanceEl && this.userProfile) {
            balanceEl.textContent = this.userProfile.guiBalance || 0;
        }
    }

    initEventListeners() {
        // Daily Login
        const dailyBtn = document.querySelector('#dailyReward .claim-btn, #dailyReward .start-btn');
        if (dailyBtn) {
            dailyBtn.addEventListener('click', () => this.claimDaily());
        }

        // Quiz Task
        const quizBtn = document.querySelector('#quizTask .start-btn');
        if (quizBtn) {
            quizBtn.addEventListener('click', () => this.openQuiz());
        }

        // Prediction Task
        const predictionBtn = document.querySelector('#predictionTask .start-btn');
        if (predictionBtn) {
            predictionBtn.addEventListener('click', () => this.openPrediction());
        }

        // Quiz Modal Close
        const closeBtn = document.querySelector('#quizModal .close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeQuizModal());
        }
    }

    async claimDaily() {
        try {
            const response = await fetch('/api/gamification/daily-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.userId
                })
            });

            const result = await response.json();
            const btn = document.querySelector('#dailyReward .claim-btn, #dailyReward .start-btn');

            if (result.success) {
                this.showSuccess(`🎉 Claimed ${result.data.reward} GUI! Streak: ${result.data.newStreak} days`);
                btn.textContent = 'Claimed';
                btn.disabled = true;
                await this.loadUserProfile();
            } else {
                this.showError(result.error || 'Already claimed today');
                btn.textContent = 'Claimed';
                btn.disabled = true;
            }
        } catch (error) {
            console.error('❌ Daily claim failed:', error);
            this.showError('Request failed. Please try again.');
        }
    }

    async openQuiz() {
        try {
            const response = await fetch(`/api/gamification/quiz/create?userId=${this.userId}`);
            const result = await response.json();

            if (!result.data?.success) {
                this.showError(result.data?.error || 'Quiz not available');
                return;
            }

            const question = result.data.question;
            document.getElementById('quizQuestion').textContent = question.question;
            document.getElementById('quizReward').textContent = question.reward;

            const optionsEl = document.getElementById('quizOptions');
            optionsEl.innerHTML = question.options.map((option, index) =>
                `<button class="quiz-option" data-answer="${index}">${option}</button>`
            ).join('');

            // Add click handlers
            optionsEl.addEventListener('click', (e) => {
                if (e.target.classList.contains('quiz-option')) {
                    this.submitQuizAnswer(parseInt(e.target.dataset.answer));
                }
            });

            document.getElementById('quizModal').style.display = 'block';
        } catch (error) {
            console.error('❌ Quiz open failed:', error);
            this.showError('Failed to load quiz');
        }
    }

    async submitQuizAnswer(selectedAnswer) {
        try {
            const response = await fetch('/api/gamification/quiz/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.userId,
                    questionIndex: 0,
                    selectedAnswer
                })
            });

            const result = await response.json();

            // Disable all options
            document.querySelectorAll('.quiz-option').forEach(btn => btn.disabled = true);

            if (result.success) {
                const message = result.correct ?
                    `🎉 Correct! +${result.reward} GUI` :
                    `❌ Wrong answer! ${result.explanation || ''}`;

                document.getElementById('quizQuestion').innerHTML = `
                    <div class="quiz-result ${result.correct ? 'success' : 'error'}">
                        ${message}
                    </div>
                `;

                if (result.correct) {
                    await this.loadUserProfile();
                    document.querySelector('#quizTask .start-btn').textContent = 'Completed';
                    document.querySelector('#quizTask .start-btn').disabled = true;
                }
            }
        } catch (error) {
            console.error('❌ Quiz submit failed:', error);
        }
    }

    openPrediction() {
        // Create prediction modal
        const modal = this.createModal('prediction-modal', 'Price Prediction', `
            <div class="prediction-content">
                <h4>Predict Bitcoin price in 24 hours</h4>
                <div class="current-price">Current: $117,000</div>
                <div class="prediction-buttons">
                    <button class="predict-btn up" onclick="earnManager.makePrediction('bitcoin', 'up')">
                        📈 Price will go UP
                    </button>
                    <button class="predict-btn down" onclick="earnManager.makePrediction('bitcoin', 'down')">
                        📉 Price will go DOWN
                    </button>
                </div>
                <div class="prediction-reward">Reward: 50 GUI if correct</div>
            </div>
        `);
        document.body.appendChild(modal);
    }

    async makePrediction(coin, direction) {
        try {
            const response = await fetch('/api/gamification/prediction/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.userId,
                    symbol: coin.toUpperCase() + 'USDT',
                    direction: direction === 'up' ? 120000 : 115000,
                    currentPrice: 10
                })
            });

            const result = await response.json();
            this.closeModal('prediction-modal');

            if (result.success) {
                this.showSuccess(`🎯 Prediction submitted! ${coin.toUpperCase()} will go ${direction.toUpperCase()}`);
                document.querySelector('#predictionTask .start-btn').textContent = 'Predicted';
                document.querySelector('#predictionTask .start-btn').disabled = true;
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            console.error('❌ Prediction failed:', error);
        }
    }

    async loadLeaderboard() {
        try {
            const response = await fetch('/api/gamification/leaderboard');
            const result = await response.json();

            const leaderboardEl = document.getElementById('leaderboardList');
            if (leaderboardEl && result.success) {
                leaderboardEl.innerHTML = result.data.map((user, index) => `
                    <div class="leaderboard-item">
                        <span class="rank">#${index + 1}</span>
                        <span class="username">${user.username}</span>
                        <span class="tokens">${user.guiTokens} GUI</span>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('❌ Leaderboard load failed:', error);
        }
    }

    async loadAchievements() {
        if (!this.userProfile?.achievements) return;

        const achievementCards = document.querySelectorAll('.achievement-card');
        const userAchievements = this.userProfile.achievements;

        achievementCards.forEach((card, index) => {
            const statusEl = card.querySelector('.achievement-status');
            const achievementTypes = ['new_user', 'streak_master', 'quiz_expert'];

            if (userAchievements.includes(achievementTypes[index])) {
                statusEl.textContent = '✓';
                statusEl.className = 'achievement-status completed';
                card.classList.add('completed');
            }
        });
    }

    closeQuizModal() {
        document.getElementById('quizModal').style.display = 'none';
    }

    createModal(id, title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = id;
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="close-btn" onclick="earnManager.closeModal('${id}')">×</button>
                </div>
                <div class="modal-body">${content}</div>
            </div>
        `;
        return modal;
    }

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.remove();
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 9999;
            padding: 15px; border-radius: 8px; color: white;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

// Initialize
const earnManager = new EarnManager();
window.earnManager = earnManager;