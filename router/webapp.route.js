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
        title: 'DeFAI - Earn',
        userId: userId,
        username: initials || 'JC',
        userProfile: userProfile,
        leaderboard,
        isTelegramApp: true
    });
});

router.get('/miniapp/memepad', async (req, res) => {
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

    res.render('pages/memepad', {
        title: 'DeFAI - Price Predictions',
        userId: userId,
        username: initials || 'JC',
        userProfile: userProfile,
        leaderboard,
        isTelegramApp: true
    });
});

router.get('/miniapp/tokens', async (req, res) => {
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

        res.render('pages/tokens', {
            title: 'DeFAI - Tokens',
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


router.get('/miniapp/wallet', async (req, res) => {

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

        res.render('pages/wallet', {
            title: 'DeFAI - Wallet',
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

export default router;