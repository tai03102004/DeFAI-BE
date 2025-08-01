import express from 'express';
import OptimizedService from '../services/OptimizedService.service.js';
import coinGeckoService from '../services/CoinGecko.service.js';

const router = express.Router();

// Market data routes
router.get('/market/overview', async (req, res) => {
    try {
        const data = await OptimizedService.getMarketData();
        res.json(data);
    } catch (error) {
        console.error('Market overview error:', error);
        res.status(500).json({
            error: 'Failed to fetch market data'
        });
    }
});

router.get('/market/historical/:coin', async (req, res) => {
    try {
        const {
            coin
        } = req.params;
        const {
            timeframe = '24h'
        } = req.query;

        let days = 1;
        if (timeframe === '7d') days = 7;
        else if (timeframe === '30d') days = 30;

        const historical = await coinGeckoService.getHistoricalData(coin, days);
        const current = await coinGeckoService.getAllInfoCoin([coin]);

        const formattedHistorical = historical.prices.map((price) => ({
            timestamp: price[0],
            open: price[1],
            high: price[1],
            low: price[1],
            close: price[1]
        }));

        res.json({
            historical: formattedHistorical,
            current: {
                price: current[0]?.current_price || 0,
                change24h: current[0]?.price_change_percentage_24h || 0,
                volume24h: current[0]?.total_volume || 0,
                marketCap: current[0]?.market_cap || 0,
                high24h: current[0]?.high_24h || 0,
                low24h: current[0]?.low_24h || 0
            }
        });
    } catch (error) {
        console.error('Historical data error:', error);
        res.status(500).json({
            error: 'Failed to fetch historical data'
        });
    }
});

// Technical analysis routes
router.get('/analysis/technical/:coin', async (req, res) => {
    try {
        const {
            coin
        } = req.params;
        const indicators = await OptimizedService.getTechnicalIndicators(coin);
        res.json(indicators);
    } catch (error) {
        console.error('Technical analysis error:', error);
        res.status(500).json({
            error: 'Failed to fetch technical indicators'
        });
    }
});

// User profile routes
router.get('/user/profile', async (req, res) => {
    try {
        const userId = req.session?.user?.id || 'demo_user';
        let profile = await OptimizedService.getUserProfile(userId);

        if (!profile) {
            await OptimizedService.initUser(userId, 'Demo User');
            profile = await OptimizedService.getUserProfile(userId);
        }

        res.json(profile);
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            error: 'Failed to fetch profile'
        });
    }
});

router.get('/user/staking-info', async (req, res) => {
    try {
        const userId = req.session?.user?.id || 'demo_user';
        const profile = await OptimizedService.getUserProfile(userId);

        res.json({
            stakedAmount: profile?.stakedGUI || 0,
            pendingReward: 0,
            isPremium: profile?.isPremium || false
        });
    } catch (error) {
        console.error('Staking info error:', error);
        res.status(500).json({
            error: 'Failed to fetch staking info'
        });
    }
});

router.get('/user/transactions', async (req, res) => {
    try {
        const transactions = [{
                type: 'reward',
                amount: 50,
                timestamp: Date.now() - 86400000
            },
            {
                type: 'quiz',
                amount: 30,
                timestamp: Date.now() - 172800000
            },
            {
                type: 'prediction',
                amount: -10,
                timestamp: Date.now() - 259200000
            }
        ];
        res.json(transactions);
    } catch (error) {
        console.error('Transactions error:', error);
        res.status(500).json({
            error: 'Failed to fetch transactions'
        });
    }
});

// Gamification routes
router.post('/gamification/daily-reward', async (req, res) => {
    try {
        const userId = req.session?.user?.id || 'demo_user';
        const result = await OptimizedService.handleDailyLogin(userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

router.post('/gamification/quiz', async (req, res) => {
    try {
        const userId = req.session?.user?.id || 'demo_user';
        const result = await OptimizedService.createQuiz(userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

router.post('/gamification/quiz/answer', async (req, res) => {
    try {
        const userId = req.session?.user?.id || 'demo_user';
        const {
            answer
        } = req.body;
        const result = await OptimizedService.submitQuizAnswer(userId, answer);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

router.post('/gamification/prediction', async (req, res) => {
    try {
        const userId = req.session?.user?.id || 'demo_user';
        const {
            coin,
            direction,
            wager,
            currentPrice
        } = req.body;
        const result = await OptimizedService.createPrediction(userId, coin, direction, currentPrice);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

router.get('/gamification/predictions/active', async (req, res) => {
    try {
        res.json([]);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch active predictions'
        });
    }
});

router.get('/gamification/predictions/history', async (req, res) => {
    try {
        const userId = req.session?.user?.id || 'demo_user';
        const history = await OptimizedService.getUserPredictions(userId);
        res.json(history);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch prediction history'
        });
    }
});

router.post('/gamification/stake', async (req, res) => {
    try {
        const userId = req.session?.user?.id || 'demo_user';
        const {
            amount
        } = req.body;
        const result = await OptimizedService.stakeGUI(userId, amount);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

router.get('/gamification/leaderboard', async (req, res) => {
    try {
        const leaderboard = await OptimizedService.getLeaderboard(10);
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch leaderboard'
        });
    }
});

export default router;