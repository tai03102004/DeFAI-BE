import GamificationService from '../services/Gamification.service.js';

export const userInit = async (req, res) => {
    try {
        const {
            userId,
            username,
            walletAddress
        } = req.body;

        if (!userId || !username) {
            return res.status(400).json({
                success: false,
                error: 'User ID and username are required'
            });
        }

        const result = await GamificationService.initUser(userId, username, walletAddress);

        res.json({
            success: true,
            data: {
                initialized: result
            }
        });
    } catch (error) {
        console.error('User init error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const dailyLogin = async (req, res) => {
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
        console.error('Daily login error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const quizCreate = async (req, res) => {
    try {
        const {
            userId
        } = req.query;
        const quiz = await GamificationService.createQuiz(userId);
        res.json({
            success: true,
            data: quiz
        });
    } catch (error) {
        console.error('Quiz create error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const submitQuizAnswer = async (req, res) => {
    try {
        const {
            userId,
            questionIndex,
            selectedAnswer
        } = req.body;

        const result = await GamificationService.submitQuizAnswer(userId, questionIndex, selectedAnswer);
        res.json(result);
    } catch (error) {
        console.error('Submit quiz answer error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

export const stakeGUI = async (req, res) => {
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
        console.error('Stake GUI error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const createPrediction = async (req, res) => {
    try {
        const {
            userId,
            coin,
            direction,
            currentPrice
        } = req.body;

        if (!userId || !coin || !direction || !currentPrice) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, coin, direction, currentPrice'
            });
        }

        if (!['up', 'down'].includes(direction.toLowerCase())) {
            return res.status(400).json({
                success: false,
                error: 'Direction must be "up" or "down"'
            });
        }

        const result = await GamificationService.createPrediction(
            userId,
            coin,
            direction.toLowerCase(),
            currentPrice
        );

        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Prediction creation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const userProfile = async (req, res) => {
    try {
        const {
            userId
        } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        const profile = await GamificationService.getUserProfile(userId);

        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error('User profile error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const leaderboard = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const leaderboard = await GamificationService.getLeaderboard(limit);

        res.json({
            success: true,
            data: leaderboard
        });
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};