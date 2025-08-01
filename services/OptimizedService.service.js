import coinGeckoService from './CoinGecko.service.js';
import technicalAnalysisService from './TechnicalAnalysis.service.js';
import gamificationService from './Gamification.service.js';

class OptimizedService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30 seconds
    }

    // Cached market data
    async getMarketData() {
        const cacheKey = 'market_data';
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const data = await coinGeckoService.getCryptoPrices(['bitcoin', 'ethereum']);
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            return data;
        } catch (error) {
            return cached?.data || {};
        }
    }

    // Cached technical analysis
    async getTechnicalIndicators(coin) {
        const cacheKey = `technical_${coin}`;
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.cacheTimeout * 2) {
            return cached.data;
        }

        try {
            const data = await technicalAnalysisService.getTechnicalIndicators(coin);
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            return data;
        } catch (error) {
            return cached?.data || {};
        }
    }

    // User operations
    async getUserProfile(userId) {
        return gamificationService.getUserProfile(userId);
    }

    async createPrediction(userId, coin, direction, currentPrice) {
        return gamificationService.createPrediction(userId, coin, direction, currentPrice);
    }

    async handleDailyLogin(userId) {
        return gamificationService.handleDailyLogin(userId);
    }

    async createQuiz(userId) {
        return gamificationService.createQuiz(userId);
    }

    async submitQuizAnswer(userId, answer) {
        return gamificationService.submitQuizAnswer(userId, answer);
    }

    async stakeGUI(userId, amount) {
        return gamificationService.stakeGUI(userId, amount);
    }

    async getLeaderboard(limit) {
        return gamificationService.getLeaderboard(limit);
    }

    clearCache() {
        this.cache.clear();
    }
}

export default new OptimizedService();