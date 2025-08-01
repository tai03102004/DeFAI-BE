class GameFiManager {
    constructor() {
        this.username = 'jashon_chang';
        this.userId = 5648969247;
        this.userProfile = null;

        this.marketData = {
            bitcoin: {
                price: 117000,
                change24h: 2.45
            },
            ethereum: {
                price: 2840,
                change24h: 1.78
            },
            bnb: {
                price: 315,
                change24h: -0.85
            }
        };

        this.init();
    }

    async init() {
        try {
            localStorage.setItem('jashon_chang', this.userId);

            // Load real market data in background (non-blocking)
            setTimeout(() => this.loadMarketData(), 100);

            // Initialize user profile
            await this.initUserProfile();

            console.log('✅ GameFi Manager initialized');
        } catch (error) {
            console.error('❌ GameFi initialization failed:', error);
        }
    }

    async initUserProfile() {
        try {
            const response = await fetch('/api/gamification/user/init', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.userId,
                    username: this.username
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    await this.loadUserProfile();
                }
            }
        } catch (error) {
            console.error('❌ Profile initialization failed:', error);
        }
    }

    async loadUserProfile() {
        try {
            const response = await fetch(`/api/gamification/user/${this.userId}`);
            const result = await response.json();

            if (result.success) {
                this.userProfile = result.data;
                this.updateProfileUI();
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
                // Update with real data
                this.marketData = result.data;
                this.updateMarketDataUI();
                console.log('✅ Market data updated with real-time data');
            }
        } catch (error) {
            console.error('❌ Failed to load real-time market data:', error);
            // Keep using default data if API fails
        }
    }

    updateMarketDataUI() {
        const gainersContainer = document.querySelector('.gainers-list');
        if (!gainersContainer) return;

        gainersContainer.innerHTML = '';

        Object.entries(this.marketData).forEach(([coin, data]) => {
            if (coin === 'activeSignals') return;

            const symbol = coin.toUpperCase();
            const change24h = data.change24h || 0;
            const price = data.price || 0;

            const gainerItem = document.createElement('div');
            gainerItem.className = 'gainer-item';
            gainerItem.setAttribute('data-symbol', symbol);
            gainerItem.onclick = () => loadMarketData(symbol);

            gainerItem.innerHTML = `
                <div class="gainer-header">
                    <div class="token-icon">${this.getCoinIcon(coin)}</div>
                    <div class="token-info">
                        <div class="token-symbol">${symbol}</div>
                        <div class="token-price">$${price.toLocaleString()}</div>
                    </div>
                </div>
                <div class="token-gain ${change24h >= 0 ? 'positive' : 'negative'}">
                    ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%
                </div>
            `;

            gainersContainer.appendChild(gainerItem);
        });
    }

    getCoinIcon(coin) {
        const icons = {
            bitcoin: '₿',
            ethereum: 'Ξ',
            bnb: 'BNB',
            cardano: '₳',
            solana: '◎'
        };
        return icons[coin] || coin.substring(0, 2).toUpperCase();
    }

    updateProfileUI() {
        if (!this.userProfile) return;

        const guiElements = document.querySelectorAll('.gui-balance');
        guiElements.forEach(el => {
            el.textContent = `${this.userProfile.guiTokens} GUI`;
        });

        const levelElements = document.querySelectorAll('.user-level');
        levelElements.forEach(el => {
            el.textContent = `Lv.${this.userProfile.level}`;
        });
    }

    async openGame(gameType) {
        console.log(`🎮 Opening game: ${gameType}`);

        switch (gameType) {
            case 'daily':
                await this.openDailyRewards();
                break;
            case 'quiz':
                await this.openQuiz();
                break;
            case 'prediction':
                await this.openPrediction();
                break;
            case 'staking':
                await this.openStaking();
                break;
            case 'trading':
                await this.openTrading();
                break;
            case 'portfolio':
                await this.openPortfolio();
                break;
            default:
                console.log('Game coming soon:', gameType);
        }
    }

    async openDailyRewards() {
        const modal = this.createGameModal('daily-rewards', 'Daily Rewards', `
            <div class="daily-rewards-content">
                <div class="reward-icon">🎁</div>
                <h3>Claim Your Daily Rewards</h3>
                <p>Get 50 GUI tokens for logging in today!</p>
                <div class="streak-info">
                    <span>Current Streak: <strong id="daily-streak">${this.userProfile?.loginStreak || 0} days</strong></span>
                </div>
                <div id="daily-reward-body">
                    <button class="claim-btn" id="claim-daily-btn">
                        <i class="fas fa-gift"></i> Claim 50 GUI
                    </button>
                </div>
                <div class="next-reward">
                    <small id="next-reward-timer">Next reward in: --:--:--</small>
                </div>
            </div>
        `);

        document.body.appendChild(modal);
        const updateTimer = () => {
            const now = new Date();
            const next = new Date(now);
            next.setHours(24, 0, 0, 0);
            const diff = next - now;
            const hrs = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
            const mins = String(Math.floor((diff % (1000 * 60 * 60) / (1000 * 60)))).padStart(2, '0');
            const secs = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
            const timerEl = modal.querySelector('#next-reward-timer');
            if (timerEl) {
                timerEl.textContent = `Next reward in: ${hrs}:${mins}:${secs}`;
            }
        };
        updateTimer();
        this._dailyRewardInterval = setInterval(updateTimer, 1000);

        const claimBtn = modal.querySelector('#claim-daily-btn');
        if (claimBtn) {
            claimBtn.addEventListener('click', () => this.claimDaily());
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
            const modal = document.getElementById('daily-rewards');
            if (!modal) {
                console.warn('Daily rewards modal not found');
                return;
            }

            const body = modal.querySelector('#daily-reward-body');
            if (!body) {
                console.warn('Daily reward body container missing');
                return;
            }

            if (result.success) {
                body.innerHTML = `
                    <div class="success-result">
                        🎉 <strong>Claimed Successfully!</strong><br>
                        +${result.data.reward} GUI earned<br>
                        <small>Streak: ${result.data.newStreak} days</small><br>
                        <small>New Balance: ${result.data.totalTokens} GUI</small>
                    </div>
                `;
                // Update streak display if present
                const streakEl = modal.querySelector('#daily-streak');
                if (streakEl) {
                    streakEl.textContent = `${result.data.newStreak} days`;
                }
                await this.loadUserProfile();
            } else {
                body.innerHTML = `
                    <div class="error-result">
                        ⏰ <strong>Can't claim</strong><br>
                        ${result.error || 'Already claimed today.'}<br>
                        <small>Come back tomorrow!</small>
                    </div>
                `;
            }
        } catch (error) {
            console.error('❌ Daily claim failed:', error);
            const modal = document.getElementById('daily-rewards');
            if (modal) {
                const body = modal.querySelector('#daily-reward-body');
                if (body) {
                    body.innerHTML = `
                        <div class="error-result">
                            ⚠️ <strong>Request failed</strong><br>
                            Please try again later.
                        </div>
                    `;
                }
            }
        }
    }


    async openQuiz() {
        try {
            const response = await fetch(`/api/gamification/quiz/create?userId=${encodeURIComponent(this.userId)}`);
            const result = await response.json();
            console.log('Quiz create result:', result);

            if (!result.data.success) {
                const errorModal = this.createGameModal('quiz-error', 'Quiz', `
                    <div class="quiz-content">
                        <h3>🧠 Crypto Quiz</h3>
                        <div class="quiz-error-message">
                            ❌ ${result.data.error || 'No quiz available today.'}
                        </div>
                    </div>
                `);
                document.body.appendChild(errorModal);
                return;
            }

            const quizData = result.data;
            const question = quizData.data.question;

            const modal = this.createGameModal('quiz', 'Quiz', `
                <div class="quiz-content">
                    <h3>🧠 Crypto Quiz</h3>
                    <h4>${question.question}</h4>
                    <div class="quiz-options">
                        ${question.options
                            .map(
                                (option, index) =>
                                    `<button class="quiz-option" data-answer="${index}">${option}</button>`
                            )
                            .join('')}
                    </div>
                    <div class="quiz-result hidden"></div>
                </div>
            `);
            document.body.appendChild(modal);

            // Handle answer selection
            modal.addEventListener('click', async (e) => {
                if (!e.target.classList.contains('quiz-option')) return;

                const answer = parseInt(e.target.dataset.answer, 10);
                console.log('Selected answer:', answer);
                await this.submitAnswer(modal, answer);
            });
        } catch (err) {
            console.error('Failed to open quiz:', err);
            const fallback = this.createGameModal('quiz-error', 'Quiz', `
                <div class="quiz-content">
                    <h3>🧠 Crypto Quiz</h3>
                    <div class="quiz-error-message">
                        ❌ Something went wrong. Please try again later.
                    </div>
                </div>
            `);
            document.body.appendChild(fallback);
        }
    }


    async submitAnswer(modal, selectedAnswer) {
        try {
            const response = await fetch('/api/gamification/quiz/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: '5648969247',
                    questionIndex: 0,
                    selectedAnswer
                })
            });

            const result = await response.json();
            const resultEl = modal.querySelector('.quiz-result');
            console.log("Quiz result:", result);

            if (result.success) {
                const message = result.correct ?
                    `🎉 Correct! +${result.reward} GUI` :
                    '❌ Wrong answer!';

                resultEl.textContent = message;
                resultEl.className = `quiz-result ${result.correct ? 'success' : 'error'}`;

                if (result.correct) await this.loadUserProfile();
            }

            // Disable all options
            modal.querySelectorAll('.quiz-option').forEach(btn => btn.disabled = true);

        } catch (error) {
            console.error('Submit error:', error);
        }
    }


    async openPrediction() {
        const modal = this.createGameModal('prediction-game', 'Price Prediction', `
            <div class="prediction-content">
                <div class="prediction-header">
                    <h3>🎯 Price Prediction Game</h3>
                    <p>Predict where Bitcoin will be in 24 hours</p>
                </div>
                <div class="current-price">
                    <div class="price-display">
                        <span class="coin-name">Bitcoin (BTC)</span>
                        <span class="current-value">$${this.marketData.bitcoin.price.toLocaleString()}</span>
                        <span class="price-change ${this.marketData.bitcoin.change24h > 0 ? 'positive' : 'negative'}">
                            ${this.marketData.bitcoin.change24h > 0 ? '+' : ''}${this.marketData.bitcoin.change24h.toFixed(2)}%
                        </span>
                    </div>
                </div>
                <div class="prediction-options">
                    <button class="predict-btn up" onclick="gameFi.makePrediction('bitcoin', 'up')">
                        <i class="fas fa-arrow-up"></i>
                        <span>Price will go UP</span>
                        <small>+10% if correct</small>
                    </button>
                    <button class="predict-btn down" onclick="gameFi.makePrediction('bitcoin', 'down')">
                        <i class="fas fa-arrow-down"></i>
                        <span>Price will go DOWN</span>
                        <small>+10% if correct</small>
                    </button>
                </div>
                <div class="prediction-pool">
                    <span>Total Pool: 1,250 GUI</span>
                </div>
            </div>
        `);

        document.body.appendChild(modal);
    }

    async openStaking() {
        const modal = this.createGameModal('staking-game', 'Stake GUI Tokens', `
            <div class="staking-content">
                <div class="staking-header">
                    <h3>💎 Stake Your GUI Tokens</h3>
                    <p>Earn premium benefits and passive rewards</p>
                </div>
                <div class="current-balance">
                    <span>Available: <strong>${this.userProfile?.guiTokens || 0} GUI</strong></span>
                </div>
                <div class="staking-options">
                    <div class="stake-option">
                        <h4>Basic Staking</h4>
                        <p>500 GUI minimum • 5% APY</p>
                        <ul>
                            <li>✓ Premium game access</li>
                            <li>✓ 2x daily rewards</li>
                            <li>✓ Priority support</li>
                        </ul>
                        <button class="stake-btn" onclick="gameFi.openStakeModal(500)">
                            Stake 500 GUI
                        </button>
                    </div>
                    <div class="stake-option premium">
                        <h4>Premium Staking</h4>
                        <p>1000 GUI minimum • 10% APY</p>
                        <ul>
                            <li>✓ All Basic benefits</li>
                            <li>✓ Advanced trading bot</li>
                            <li>✓ Exclusive tournaments</li>
                            <li>✓ NFT airdrops</li>
                        </ul>
                        <button class="stake-btn premium" onclick="gameFi.openStakeModal(1000)">
                            Stake 1000 GUI
                        </button>
                    </div>
                </div>
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
                    coin: coin,
                    direction: direction,
                    currentPrice: this.marketData[coin].price,
                    wager: 10 // Add default wager amount
                })
            });

            const result = await response.json();

            // Close prediction modal
            this.closeGameModal('prediction-game');

            if (result.success) {
                const successModal = this.createGameModal('prediction-success', 'Prediction Submitted', `
                    <div class="prediction-success-content">
                        <div class="success-icon">🎯</div>
                        <h3>Prediction Submitted!</h3>
                        <div class="prediction-details">
                            <p>Coin: <strong>${coin.toUpperCase()}</strong></p>
                            <p>Direction: <strong>${direction.toUpperCase()}</strong></p>
                            <p>Current Price: <strong>$${this.marketData[coin].price.toLocaleString()}</strong></p>
                            <p>Wager: <strong>${result.data?.wager || 10} GUI</strong></p>
                            <p>Expires in: <strong>24 hours</strong></p>
                        </div>
                        <p class="reward-info">You'll earn <strong>50 GUI</strong> if correct!</p>
                        <button class="ok-btn" onclick="gameFi.closeGameModal('prediction-success')">
                            Got it!
                        </button>
                    </div>
                `);

                document.body.appendChild(successModal);

                // Reload user profile to update balance
                await this.loadUserProfile();
            } else {
                const errorModal = this.createGameModal('prediction-error', 'Prediction Failed', `
                    <div class="prediction-error-content">
                        <div class="error-icon">❌</div>
                        <h3>Prediction Failed</h3>
                        <p>${result.error}</p>
                        <button class="ok-btn" onclick="gameFi.closeGameModal('prediction-error')">
                            OK
                        </button>
                    </div>
                `);

                document.body.appendChild(errorModal);
            }

        } catch (error) {
            console.error('❌ Prediction failed:', error);

            // Show error modal for network issues
            const errorModal = this.createGameModal('prediction-error', 'Network Error', `
                <div class="prediction-error-content">
                    <div class="error-icon">🌐</div>
                    <h3>Connection Error</h3>
                    <p>Failed to submit prediction. Please check your connection and try again.</p>
                    <button class="ok-btn" onclick="gameFi.closeGameModal('prediction-error')">
                        OK
                    </button>
                </div>
            `);

            document.body.appendChild(errorModal);
        }
    }
    async openTrading() {
        // Load current status
        const statusResponse = await fetch('/api/analysis/trading/status').catch(() => null);
        let botStatus = {
            isRunning: false,
            dailyPnL: 0,
            winRate: 0,
            activePositions: 0
        };

        if (statusResponse?.ok) {
            const result = await statusResponse.json();
            if (result.success) botStatus = result.data;
        }

        const modal = this.createGameModal('trading-bot', 'AI Trading Bot', `
            <div class="trading-content">
                <div class="trading-header">
                    <h3>📈 AI Trading Bot</h3>
                    <p>Let AI manage your crypto portfolio</p>
                </div>
                <div class="bot-status">
                    <div class="status-indicator ${botStatus.isRunning ? 'active' : 'inactive'}"></div>
                    <span>Bot Status: ${botStatus.isRunning ? 'Active' : 'Inactive'}</span>
                </div>
                <div class="trading-stats">
                    <div class="stat-item">
                        <span class="stat-label">24h P&L</span>
                        <span class="stat-value ${botStatus.dailyPnL >= 0 ? 'positive' : 'negative'}" id="daily-pnl">
                            ${botStatus.dailyPnL >= 0 ? '+' : ''}${botStatus.dailyPnL.toFixed(2)}%
                        </span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Win Rate</span>
                        <span class="stat-value" id="win-rate">${botStatus.winRate}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Active Trades</span>
                        <span class="stat-value" id="active-trades">${botStatus.activePositions}</span>
                    </div>
                </div>
                <div class="trading-actions">
                    <button class="start-bot-btn" onclick="gameFi.${botStatus.isRunning ? 'stopBot' : 'startBot'}()">
                        <i class="fas fa-${botStatus.isRunning ? 'stop' : 'play'}"></i>
                        ${botStatus.isRunning ? 'Stop' : 'Start'} Bot
                    </button>
                </div>
                <div class="recent-signals" id="recent-signals">
                    <h4>Recent AI Signals</h4>
                    <div class="signals-list">Loading...</div>
                </div>
            </div>
        `);

        document.body.appendChild(modal);

        if (botStatus.isRunning) {
            this.startTradingMonitoring();
        }

        this.loadRecentSignals();
    }

    async startBot() {
        const response = await fetch('/api/analysis/trading/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: this.userId,
                mode: 'paper'
            })
        });

        if (response.ok) {
            this.updateBotUI(true);
            this.startTradingMonitoring();
        }
    }

    async stopBot() {
        const response = await fetch('/api/analysis/trading/stop', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: this.userId
            })
        });

        if (response.ok) {
            this.updateBotUI(false);
            this.stopTradingMonitoring();
        }
    }

    updateBotUI(isActive) {
        const modal = document.getElementById('trading-bot');
        if (!modal) return;

        const indicator = modal.querySelector('.status-indicator');
        const statusText = modal.querySelector('.bot-status span');
        const button = modal.querySelector('.start-bot-btn');

        if (indicator) indicator.className = `status-indicator ${isActive ? 'active' : 'inactive'}`;
        if (statusText) statusText.textContent = `Bot Status: ${isActive ? 'Active' : 'Inactive'}`;
        if (button) {
            button.innerHTML = `<i class="fas fa-${isActive ? 'stop' : 'play'}"></i> ${isActive ? 'Stop' : 'Start'} Bot`;
            button.onclick = () => isActive ? this.stopBot() : this.startBot();
        }
    }

    startTradingMonitoring() {
        this.tradingInterval = setInterval(async () => {
            await this.updateTradingStats();
        }, 5000);
    }

    stopTradingMonitoring() {
        if (this.tradingInterval) {
            clearInterval(this.tradingInterval);
            this.tradingInterval = null;
        }
    }

    async updateTradingStats() {
        const response = await fetch('/api/analysis/trading/status');
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                const modal = document.getElementById('trading-bot');
                if (modal) {
                    const dailyPnlEl = modal.querySelector('#daily-pnl');
                    const winRateEl = modal.querySelector('#win-rate');
                    const activeTradesEl = modal.querySelector('#active-trades');

                    if (dailyPnlEl) {
                        dailyPnlEl.textContent = `${result.data.dailyPnL >= 0 ? '+' : ''}${result.data.dailyPnL.toFixed(2)}%`;
                        dailyPnlEl.className = `stat-value ${result.data.dailyPnL >= 0 ? 'positive' : 'negative'}`;
                    }
                    if (winRateEl) winRateEl.textContent = `${result.data.winRate}%`;
                    if (activeTradesEl) activeTradesEl.textContent = result.data.activePositions;
                }
            }
        }
    }

    async loadRecentSignals() {
        const response = await fetch('/api/analysis/recent-signals');
        if (response.ok) {
            const result = await response.json();
            const signalsList = document.querySelector('.signals-list');

            if (signalsList && result.success) {
                signalsList.innerHTML = result.data.length ? result.data.map(signal => `
                    <div class="signal-item ${signal.action.toLowerCase()}">
                        <div class="signal-coin">${signal.coin.toUpperCase()}</div>
                        <div class="signal-action">${signal.action}</div>
                        <div class="signal-confidence">${(signal.confidence * 100).toFixed(0)}%</div>
                        <div class="signal-time">${new Date(signal.timestamp).toLocaleTimeString()}</div>
                    </div>
                `).join('') : '<div class="no-signals">No signals yet</div>';
            }
        }
    }

    async openPortfolio() {
        // Load portfolio data
        const response = await fetch('/api/analysis/trading/portfolio');
        let portfolioData = {
            totalValue: 0,
            totalChange: 0,
            positions: []
        };

        if (response.ok) {
            const result = await response.json();
            if (result.success) portfolioData = result.data;
        }

        const modal = this.createGameModal('portfolio-tracker', 'Portfolio Tracker', `
            <div class="portfolio-content">
                <div class="portfolio-header">
                    <h3>💼 Your Portfolio</h3>
                    <p>Track your crypto investments</p>
                </div>
                <div class="portfolio-summary">
                    <div class="total-value">
                        <span class="label">Total Value</span>
                        <span class="value" id="total-value">$${portfolioData.totalValue?.toFixed(2) || '0.00'}</span>
                        <span class="change ${(portfolioData.totalChange || 0) >= 0 ? 'positive' : 'negative'}" id="total-change">
                            ${(portfolioData.totalChange || 0) >= 0 ? '+' : ''}${(portfolioData.totalChange || 0).toFixed(2)}%
                        </span>
                    </div>
                </div>
                <div class="portfolio-assets" id="portfolio-assets">
                    ${this.renderPortfolioAssets(portfolioData.positions)}
                </div>
                <div class="portfolio-actions">
                    <button class="refresh-btn" onclick="gameFi.refreshPortfolio()">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>
        `);

        document.body.appendChild(modal);
        this.startPortfolioMonitoring();
    }

    renderPortfolioAssets(positions) {
        if (!positions || positions.length === 0) {
            return `
                <div class="empty-portfolio">
                    <div class="empty-icon">📭</div>
                    <p>No positions yet</p>
                    <small>Start trading to see your portfolio here</small>
                </div>
            `;
        }

        return positions.map(position => `
            <div class="asset-item">
                <div class="asset-info">
                    <div class="asset-icon">${this.getCoinIcon(position.symbol.replace('USDT', '').toLowerCase())}</div>
                    <div class="asset-details">
                        <span class="asset-name">${position.symbol}</span>
                        <span class="asset-side ${position.side.toLowerCase()}">${position.side}</span>
                    </div>
                </div>
                <div class="asset-values">
                    <div class="asset-balance">
                        <span class="quantity">${position.quantity.toFixed(6)}</span>
                        <span class="entry-price">@$${position.entryPrice.toFixed(2)}</span>
                    </div>
                    <div class="asset-pnl">
                        <span class="pnl-value ${(position.unrealizedPnL?.percentage || 0) >= 0 ? 'positive' : 'negative'}">
                            ${(position.unrealizedPnL?.percentage || 0) >= 0 ? '+' : ''}${(position.unrealizedPnL?.percentage || 0).toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    startPortfolioMonitoring() {
        this.portfolioInterval = setInterval(async () => {
            await this.updatePortfolioDisplay();
        }, 10000);
    }

    async updatePortfolioDisplay() {
        const response = await fetch('/api/analysis/trading/portfolio');
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                const modal = document.getElementById('portfolio-tracker');
                if (modal) {
                    const totalValue = modal.querySelector('#total-value');
                    const totalChange = modal.querySelector('#total-change');
                    const assetsContainer = modal.querySelector('#portfolio-assets');

                    if (totalValue) totalValue.textContent = `$${result.data.totalValue?.toFixed(2) || '0.00'}`;
                    if (totalChange) {
                        const change = result.data.totalChange || 0;
                        totalChange.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
                        totalChange.className = `change ${change >= 0 ? 'positive' : 'negative'}`;
                    }
                    if (assetsContainer) {
                        assetsContainer.innerHTML = this.renderPortfolioAssets(result.data.positions);
                    }
                }
            }
        }
    }

    async refreshPortfolio() {
        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
            refreshBtn.disabled = true;
        }

        await this.updatePortfolioDisplay();

        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
            refreshBtn.disabled = false;
        }
    }

    closeGameModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.remove();

        // Clean up intervals
        if (modalId === 'trading-bot' && this.tradingInterval) {
            clearInterval(this.tradingInterval);
            this.tradingInterval = null;
        }
        if (modalId === 'portfolio-tracker' && this.portfolioInterval) {
            clearInterval(this.portfolioInterval);
            this.portfolioInterval = null;
        }

        this.currentGame = null;
    }

    navigateTo(page) {
        console.log(`🔄 Navigating to: ${page}`);
        switch (page) {
            case 'analysis':
                window.location.href = '/api/analysis';
                break;
            case 'frens':
                window.location.href = '/gamefi/frens';
                break;
            case 'trading':
                window.location.href = '/gamefi/trading';
                break;
            default:
                console.log('Navigation:', page);
        }
    }

    createGameModal(id, title, content) {
        const modal = document.createElement('div');
        modal.className = 'game-modal';
        modal.id = id;
        modal.innerHTML = `
            <div class="game-modal-content">
                <button class="close-game-modal" onclick="gameFi.closeGameModal('${id}')">×</button>
                <div class="game-modal-body">
                    ${content}
                </div>
            </div>
        `;
        return modal;
    }


    closeGameModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
        this.currentGame = null;
    }
}


// Global functions
function loadMarketData(symbol) {
    console.log(`📊 Loading data for: ${symbol}`);
    if (window.gameFi) {
        window.gameFi.selectToken(symbol);
    }
}

function openTrading() {
    window.gameFi?.navigateTo('trading');
}

// Initialize
const gameFi = new GameFiManager();
window.gameFi = gameFi;
window.loadMarketData = loadMarketData;
window.openTrading = openTrading;