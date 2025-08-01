import express from 'express';
import * as gamificationController from '../controllers/gamification.controller.js';
import GamificationService from '../services/Gamification.service.js';

const router = express.Router();

// User management
router.post('/user/init', gamificationController.userInit);
router.get('/user/:userId', gamificationController.userProfile);

// Daily rewards
router.post('/daily-login', gamificationController.dailyLogin);

// Quiz system
router.get('/quiz/create', gamificationController.quizCreate);
router.post('/quiz/submit', gamificationController.submitQuizAnswer);

// Prediction
router.post('/prediction/submit', gamificationController.createPrediction);

// Staking
router.post('/stake', gamificationController.stakeGUI);

// Leaderboard
router.get('/leaderboard', gamificationController.leaderboard);

router.get('/predictions/active/:userId', async (req, res) => {
    try {
        const {
            userId
        } = req.params;
        const predictions = await GamificationService.getUserActivePredictions(userId);
        res.json({
            success: true,
            data: predictions
        });
    } catch (error) {
        console.error('❌ Failed to get active predictions:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Get prediction history for user
router.get('/predictions/history/:userId', async (req, res) => {
    try {
        const {
            userId
        } = req.params;
        const predictions = await GamificationService.getUserPredictions(userId, 10);
        res.json({
            success: true,
            data: predictions
        });
    } catch (error) {
        console.error('❌ Failed to get prediction history:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

export default router;