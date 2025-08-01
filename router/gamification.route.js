import express from 'express';
import * as gamificationController from '../controllers/gamification.controller.js';

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

export default router;