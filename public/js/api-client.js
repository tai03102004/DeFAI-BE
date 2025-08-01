import {
    Utils
} from './utils.js';

export class ApiClient {
    constructor() {
        this.baseURL = '';
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    ...this.defaultHeaders,
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // User & Profile
    getUserProfile() {
        return this.request('/api/user/profile');
    }
    updateUserProfile(data) {
        return this.request('/api/user/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    getStakingInfo() {
        return this.request('/api/user/staking-info');
    }
    getTransactions() {
        return this.request('/api/user/transactions');
    }

    // Gamification
    claimDailyReward() {
        return this.request('/api/gamification/daily-reward', {
            method: 'POST'
        });
    }
    getQuiz() {
        return this.request('/api/gamification/quiz', {
            method: 'POST'
        });
    }
    submitQuizAnswer(answer) {
        return this.request('/api/gamification/quiz/answer', {
            method: 'POST',
            body: JSON.stringify({
                answer
            })
        });
    }
    submitPrediction(data) {
        return this.request('/api/gamification/prediction', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    getActivePredictions() {
        return this.request('/api/gamification/predictions/active');
    }
    getPredictionHistory() {
        return this.request('/api/gamification/predictions/history');
    }
    stakeTokens(amount) {
        return this.request('/api/gamification/stake', {
            method: 'POST',
            body: JSON.stringify({
                amount
            })
        });
    }
    getLeaderboard() {
        return this.request('/api/gamification/leaderboard');
    }

    // Market Data
    getMarketOverview() {
        return this.request('/api/market/overview');
    }
    getHistoricalData(coin, timeframe) {
        return this.request(`/api/market/historical/${coin}?timeframe=${timeframe}`);
    }
    getTechnicalAnalysis(coin) {
        return this.request(`/api/analysis/technical/${coin}`);
    }
    getMarketStatus() {
        return this.request('/api/analysis/market-status');
    }

    // Trading
    getTradingStatus() {
        return this.request('/api/analysis/trading/status');
    }
    startBot(userId, mode = 'paper') {
        return this.request('/api/analysis/trading/start', {
            method: 'POST',
            body: JSON.stringify({
                userId,
                mode
            })
        });
    }
    stopBot(userId) {
        return this.request('/api/analysis/trading/stop', {
            method: 'POST',
            body: JSON.stringify({
                userId
            })
        });
    }
    getPortfolio() {
        return this.request('/api/analysis/trading/portfolio');
    }
    getRecentSignals() {
        return this.request('/api/analysis/recent-signals');
    }
}

export const apiClient = new ApiClient();