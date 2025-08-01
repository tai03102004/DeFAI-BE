import express from 'express';
import AnalysisAgent from '../agents/AnalysisAgent.js';
import TradingAgent from '../agents/TradingAgent.js';

const router = express.Router();

// Main dashboard page
router.get('/', async (req, res) => {
    try {
        const coin = req.query.coin || 'BTC';
        const result = await AnalysisAgent.analyzeAndAlert(coin, true);
        res.render('analysis/index', {
            title: 'DeFAI Analysis Dashboard',
            coin: coin,
            analysisResult: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to load analysis dashboard',
            message: error.message
        });
    }

});

router.get('/coin/:coin', async (req, res) => {
    try {
        const {
            coin
        } = req.params;
        const result = await AnalysisAgent.analyzeAndAlert(coin, true);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
})

router.get('/market-status', async (req, res) => {
    try {
        const result = await AnalysisAgent.getMarketStatus();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/trading/start', async (req, res) => {
    try {
        const result = await TradingAgent.start(req.body);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/trading/stop', async (req, res) => {
    try {
        const result = await TradingAgent.stop();
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/trading/status', async (req, res) => {
    try {
        const status = TradingAgent.getStatus();
        const portfolio = TradingAgent.getPortfolioStatus();
        res.json({
            success: true,
            data: {
                ...status,
                ...portfolio,
                isRunning: TradingAgent.isRunning || false,
                dailyPnL: portfolio.dailyPnL || 0,
                winRate: portfolio.winRate || 0,
                activePositions: portfolio.activePositions || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/trading/portfolio', async (req, res) => {
    try {
        const portfolio = TradingAgent.getPortfolioStatus();
        res.json({
            success: true,
            data: portfolio
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/recent-signals', async (req, res) => {
    try {
        const signals = [{
                coin: 'bitcoin',
                action: 'BUY',
                confidence: 0.85,
                timestamp: Date.now() - 300000
            },
            {
                coin: 'ethereum',
                action: 'SELL',
                confidence: 0.72,
                timestamp: Date.now() - 600000
            }
        ];
        res.json({
            success: true,
            data: signals
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;