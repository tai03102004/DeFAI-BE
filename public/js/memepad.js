class MemePadManager {
    constructor() {
        this.userId = this.getUserId();
        this.username = this.getUsername();
        this.userProfile = null;
        this.selectedCoin = 'bitcoin';
        this.selectedDirection = null;
        this.marketData = {
            bitcoin: {
                price: 117000,
                change24h: 2.45
            },
            ethereum: {
                price: 2840,
                change24h: 1.78
            }
        };
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
        await this.loadMarketData();
        this.initEventListeners();
        await this.loadActivePredictions();
        await this.loadPredictionHistory();
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

    async loadMarketData() {
        try {
            const response = await fetch('/api/analysis/market-status');
            const result = await response.json();
            if (result.success) {
                this.marketData = result.data;
            }
        } catch (error) {
            console.error('❌ Failed to load market data, using defaults');
        }
        this.updatePriceDisplay();
    }

    updateBalanceDisplay() {
        const balanceEl = document.getElementById('userBalance');
        if (balanceEl && this.userProfile) {
            balanceEl.textContent = this.userProfile.guiBalance || 0;
        }
    }

    updatePriceDisplay() {
        const btcPriceEl = document.getElementById('btcPrice');
        const ethPriceEl = document.getElementById('ethPrice');

        if (btcPriceEl) {
            btcPriceEl.textContent = `$${this.marketData.bitcoin.price.toLocaleString()}`;
        }
        if (ethPriceEl) {
            ethPriceEl.textContent = `$${this.marketData.ethereum.price.toLocaleString()}`;
        }
    }

    initEventListeners() {
        // Coin selection
        document.querySelectorAll('.coin-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.coin-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                this.selectedCoin = option.dataset.coin;
            });
        });

        // Direction selection
        document.querySelectorAll('.direction-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.direction-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedDirection = btn.dataset.direction;
            });
        });

        // Submit prediction
        const submitBtn = document.getElementById('submitPrediction');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitPrediction());
        }

        // Wager input validation
        const wagerInput = document.getElementById('wagerAmount');
        if (wagerInput) {
            wagerInput.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                const maxWager = this.userProfile?.guiBalance || 100;

                if (value > maxWager) {
                    e.target.value = maxWager;
                }
                if (value < 10) {
                    e.target.value = 10;
                }
            });
        }
    }

    async submitPrediction() {
        if (!this.selectedDirection) {
            this.showError('Please select UP or DOWN direction');
            return;
        }

        const wagerAmount = parseInt(document.getElementById('wagerAmount').value);
        if (!wagerAmount || wagerAmount < 10) {
            this.showError('Minimum wager is 10 GUI');
            return;
        }

        if (wagerAmount > (this.userProfile?.guiBalance || 0)) {
            this.showError('Insufficient GUI balance');
            return;
        }

        try {
            const currentPrice = this.marketData[this.selectedCoin].price;
            const response = await fetch('/api/gamification/prediction/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.userId,
                    coin: this.selectedCoin, // Change from 'symbol' to 'coin'
                    direction: this.selectedDirection, // Change from 'predictedDirection' to 'direction'
                    currentPrice: currentPrice,
                    wager: wagerAmount // Add wager field
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess(`🎯 Prediction submitted! ${this.selectedCoin.toUpperCase()} will go ${this.selectedDirection.toUpperCase()}`);

                // Reset form
                document.querySelectorAll('.direction-btn').forEach(btn => btn.classList.remove('active'));
                this.selectedDirection = null;
                document.getElementById('wagerAmount').value = 10;

                // Reload data
                await this.loadUserProfile();
                await this.loadActivePredictions();
            } else {
                this.showError(result.error || 'Failed to submit prediction');
            }
        } catch (error) {
            console.error('❌ Prediction submission failed:', error);
            this.showError('Failed to submit prediction. Please try again.');
        }
    }

    async loadActivePredictions() {
        try {
            const response = await fetch(`/api/gamification/predictions/active/${this.userId}`);
            const result = await response.json();

            const container = document.getElementById('activePredictions');
            if (!result.success || !result.data.length) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-chart-line"></i>
                        <p>No active predictions</p>
                        <small>Make your first prediction below!</small>
                    </div>
                `;
                return;
            }

            container.innerHTML = result.data.map(prediction => {
                const timeLeft = this.getTimeLeft(prediction.expiresAt);
                console.log("Prediction data:", prediction);
                const direction = prediction.predictedDirection;

                return `
                    <div class="prediction-item active">
                        <div class="prediction-coin">
                            <span class="coin-symbol">${(prediction.symbol || '').replace('USDT', '')}</span>
                            <div class="prediction-direction ${direction}">
                                <i class="fas fa-arrow-${direction === 'up' ? 'up' : direction === 'down' ? 'down' : 'right'}"></i>
                                ${direction.toUpperCase()}
                            </div>
                        </div>
                        <div class="prediction-details">
                            <div class="prediction-price">Entry: $${(prediction.currentPrice || 0).toLocaleString()}</div>
                            <div class="prediction-wager">Wager: ${prediction.wager || 0} GUI</div>
                            <div class="prediction-time">Expires: ${timeLeft}</div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('❌ Failed to load active predictions:', error);
            const container = document.getElementById('activePredictions');
            if (container) {
                container.innerHTML = '<div class="empty-state">Failed to load active predictions</div>';
            }
        }
    }

    async loadPredictionHistory() {
        try {
            const response = await fetch(`/api/gamification/predictions/history/${this.userId}`);
            const result = await response.json();

            const container = document.getElementById('predictionHistory');
            if (!result.success || !result.data.length) {
                container.innerHTML = '<div class="empty-state">No prediction history</div>';
                return;
            }

            container.innerHTML = result.data.map(prediction => {
                // Add safety checks for undefined values
                const direction = prediction.predictedDirection || 'unknown';
                const outcome = prediction.status === 'resolved' ?
                    (prediction.won ? 'won' : 'lost') : 'pending';

                return `
                    <div class="prediction-item ${outcome}">
                        <div class="prediction-coin">
                            <span class="coin-symbol">${(prediction.symbol || '').replace('USDT', '')}</span>
                            <div class="prediction-direction ${direction}">
                                <i class="fas fa-arrow-${direction === 'up' ? 'up' : direction === 'down' ? 'down' : 'right'}"></i>
                                ${direction.toUpperCase()}
                            </div>
                        </div>
                        <div class="prediction-details">
                            <div class="prediction-prices">
                                <span>Entry: $${(prediction.currentPrice || 0).toLocaleString()}</span>
                                ${prediction.actualPrice ? `<span>Final: $${prediction.actualPrice.toLocaleString()}</span>` : ''}
                            </div>
                            <div class="prediction-result">
                                <span class="wager">Wager: ${prediction.wager || 0} GUI</span>
                                ${prediction.reward ? `<span class="reward">+${prediction.reward} GUI</span>` : ''}
                            </div>
                        </div>
                        <div class="prediction-status ${outcome}">
                            ${outcome === 'won' ? '✅ Won' : outcome === 'lost' ? '❌ Lost' : '⏳ Pending'}
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('❌ Failed to load prediction history:', error);
            // Show error state in UI
            const container = document.getElementById('predictionHistory');
            if (container) {
                container.innerHTML = '<div class="empty-state">Failed to load prediction history</div>';
            }
        }
    }

    getTimeLeft(expiresAt) {
        const now = new Date();
        const expires = new Date(expiresAt);
        const diff = expires - now;

        if (diff <= 0) return 'Expired';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m`;
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
const memePadManager = new MemePadManager();
window.memePadManager = memePadManager;