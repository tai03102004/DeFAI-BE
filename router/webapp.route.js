import express from 'express';
import GamificationService from '../services/Gamification.service.js';

const router = express.Router();

// Telegram Mini App main page
router.get('/miniapp', async (req, res) => {
    try {
        const userId = '5648969247';
        const username = 'jashon_chang';

        // Initialize user if needed
        await GamificationService.initUser(userId, username);

        // Get user data
        const userProfile = await GamificationService.getUserProfile(userId);
        const leaderboard = await GamificationService.getLeaderboard(5);
        const initials = username
            .split(/[_\s]/)
            .filter(part => part.length > 0)
            .map(part => part[0].toUpperCase())
            .join('');

        res.render('pages/gamefi', {
            title: 'DeFAI Gaming Hub',
            userId: userId,
            username: initials || 'JC',
            userProfile: userProfile,
            leaderboard,
            isTelegramApp: true
        });
    } catch (error) {
        console.error('Mini App error:', error);
        res.status(500).render('error', {
            error: 'Failed to load Mini App',
            message: error.message
        });
    }
});

// Page routes

router.get('/miniapp/earn', async (req, res) => {
    const userId = req.query.user_id;
    const username = req.query.username;

    // Initialize user if needed
    await GamificationService.initUser(userId, username);

    // Get user data
    const userProfile = await GamificationService.getUserProfile(userId);
    const leaderboard = await GamificationService.getLeaderboard(5);
    const initials = username
        .split(/[_\s]/)
        .filter(part => part.length > 0)
        .map(part => part[0].toUpperCase())
        .join('');

    res.render('pages/earn', {
        title: 'DeFAI Gaming Hub',
        userId: userId,
        username: initials || 'JC',
        userProfile: userProfile,
        leaderboard,
        isTelegramApp: true
    });
});

router.get('/miniapp/memepad', (req, res) => {
    res.render('pages/memepad', {
        title: 'DeFAI - Price Predictions',
        user: req.session.user
    });
});

router.get('/miniapp/tokens', (req, res) => {
    res.render('pages/tokens', {
        title: 'DeFAI - Market Charts',
        user: req.session.user
    });
});

router.get('/miniapp/wallet', (req, res) => {
    res.render('pages/wallet', {
        title: 'DeFAI - Wallet',
        user: req.session.user
    });
});


// API endpoints for Mini App
router.post('/api/telegram/claim-daily', async (req, res) => {
    try {
        const {
            userId
        } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        const result = await GamificationService.handleDailyLogin(userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/api/telegram/quiz', async (req, res) => {
    try {
        const {
            userId,
            questionId,
            answer
        } = req.body;

        if (!userId || answer === undefined) {
            return res.status(400).json({
                success: false,
                error: 'User ID and answer are required'
            });
        }

        const result = await GamificationService.submitQuizAnswer(userId, questionId, parseInt(answer));
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/api/telegram/prediction', async (req, res) => {
    try {
        const {
            userId,
            symbol,
            predictedPrice,
            wager
        } = req.body;

        if (!userId || !symbol || !predictedPrice) {
            return res.status(400).json({
                success: false,
                error: 'User ID, symbol, and predicted price are required'
            });
        }

        // Create or get active prediction challenge
        const activePredictions = await GamificationService.getActivePredictions();
        let challenge = activePredictions.find(p => p.symbol === symbol);

        if (!challenge) {
            // Create new challenge if none exists
            const currentPrice = await getCurrentMarketPrice(symbol);
            const predictionId = await GamificationService.createPredictionChallenge(symbol, currentPrice, '1h');
            challenge = {
                predictionId
            };
        }

        const result = await GamificationService.submitPrediction(
            userId,
            challenge.predictionId,
            parseFloat(predictedPrice),
            parseInt(wager) || 10
        );

        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/api/telegram/stake', async (req, res) => {
    try {
        const {
            userId,
            amount
        } = req.body;

        if (!userId || !amount) {
            return res.status(400).json({
                success: false,
                error: 'User ID and amount are required'
            });
        }

        const result = await GamificationService.stakeGUI(userId, parseInt(amount));
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get user stats for Mini App
router.get('/api/telegram/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const profile = await GamificationService.getUserProfile(userId);

        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                ...profile,
                canClaimDaily: !hasClaimedToday(profile.lastLogin),
                nextLevelExp: (profile.level * 100) - profile.experience
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Helper function to check if user has claimed today
function hasClaimedToday(lastLogin) {
    if (!lastLogin) return false;

    const today = new Date().toDateString();
    const lastLoginDate = new Date(lastLogin).toDateString();

    return today === lastLoginDate;
}

// Helper function to get current market price (mock)
async function getCurrentMarketPrice(symbol) {
    const mockPrices = {
        'BTCUSDT': 45000 + (Math.random() - 0.5) * 2000,
        'ETHUSDT': 3000 + (Math.random() - 0.5) * 200
    };
    return mockPrices[symbol] || 50000;
}

export default router;