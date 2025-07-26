import cryptoRouter from './crypto.route.js';
import alertsRouter from './alerts.route.js';
import manualAnalysisRouter from './manual-analysis.route.js';
import indicatorsRouter from './indicators.route.js';
import aiAgentRoute from './ai_agent.route.js';

export default (app) => {
    app.use('/api/crypto', cryptoRouter); // crypto prices and history
    app.use('/api/agents', aiAgentRoute); // result analysis with AI
    app.use('/api/alerts', alertsRouter); // alerts recent activity
    app.use('/api/manual-analysis', manualAnalysisRouter); // manual analysis of crypto
    app.use('/api/python', indicatorsRouter); // indicators for crypto trading
};