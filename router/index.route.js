import gamificationRouter from './gamification.route.js';
import webappRouter from './webapp.route.js';
import aptosRoutes from './aptos.route.js';
import analysisRouter from './analysis.route.js';

export default (app) => {
    // API routes
    app.use('/api/gamification', gamificationRouter);
    app.use('/api/analysis', analysisRouter);

    app.use('/webapp', webappRouter);

    app.use('/api/aptos', aptosRoutes);

    // Health check
    app.get('/health', (req, res) => {
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        });
    });
};