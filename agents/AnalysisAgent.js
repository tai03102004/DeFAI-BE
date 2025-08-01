import coinGeckoService from '../services/CoinGecko.service.js';
import EventEmitter from 'events';
import axios from 'axios';
import technicalIndicators from '../services/TechnicalAnalysis.service.js';
import AlertSystem from '../services/AlertSystem.service.js';

/**
 * AI Agent Service Class - Analysis Only
 */
class AIAnalysisAgent extends EventEmitter {
    constructor() {
        super();
        this.aiAgent = null;
        this.isRunning = false;
        this.alertSystem = AlertSystem;
        this.orchestrator = null;
        this.previousPrices = {};
        this.defaultConfig = {
            supportedCoins: ['bitcoin', 'ethereum'],
            aiInstructions: 'You are a cryptocurrency analysis expert. Analyze the market data and provide trading signals and market insights.',
        };
    }

    /**
     * Initialize service with configuration
     */
    init(config) {
        this.config = {
            ...this.defaultConfig,
            ...config
        };

        // Initialize AI Agent only
        this.aiAgent = {
            name: this.config.aiName || "Crypto Analysis Agent",
            instructions: this.config.aiInstructions || "You are an assistant professional cryptocurrency trading analyst.",
            model: this.config.aiModel || "meta-llama/Llama-3.3-70B-Instruct",
            apiKey: this.config.aiApiKey || 'io-v2-eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJvd25lciI6Ijc1NjNiM2I4LWU3OTEtNGFjMi04YTY1LTg0ZjU3ODkyNDM5NSIsImV4cCI6NDkwNTIwMjQ4Nn0.hYGWdOQVRdbhUYF_IQD1Qd-HNOg7i9NRmhj1PMkDHtS-hK5C0JMqVBF8O31URDswDEVdQIdM2p3is-TXpwxjRw',
            baseUrl: this.config.aiBaseUrl || "https://api.intelligence.io.solutions/api/v1",
            headers: {
                'Authorization': `Bearer ${this.config.aiApiKey}`,
                'Content-Type': 'application/json'
            }
        };

        console.log('✅ AIAnalysisService initialized (Analysis Only)');
        return this;
    }

    /**
     * Format alert message for external notification systems
     */
    formatAlertMessage(symbol, priceData, techData, aiResult, alerts) {
        const coinData = priceData[symbol];
        const emoji = coinData.usd_24h_change > 0 ? '🟢' : '🔴';
        const trend = coinData.usd_24h_change > 0 ? 'BULLISH' : 'BEARISH';
        const coinName = symbol.charAt(0).toUpperCase() + symbol.slice(1);

        let message = `
            ${emoji} <b>${coinName.toUpperCase()} Analysis</b>

            💰 <b>Price:</b> $${coinData.usd.toFixed(2)}
            📊 <b>24h:</b> ${coinData.usd_24h_change.toFixed(2)}% (${trend})
            📈 <b>Volume:</b> $${(coinData.usd_24h_vol / 1000000).toFixed(2)}M
            💎 <b>Market Cap:</b> $${(coinData.usd_market_cap / 1000000000).toFixed(2)}B

            📋 <b>Technical Indicators:</b>
            • RSI: ${techData.rsi} ${techData.rsi > 70 ? '🔴' : techData.rsi < 30 ? '🟢' : '🟡'}
            • MACD: ${techData.macd.toFixed(2)}
            • EMA: $${techData.ema.toFixed(2)}
            • SMA: $${techData.sma.toFixed(2)}
            • Volume: $${techData.volume.toFixed(2)} ${techData.volume_signal === 'HIGH' ? '🔴' : '🟢'}
        `.trim();

        if (alerts && alerts.length > 0) {
            message += '\n\n🚨 <b>Alerts:</b>';
            alerts.forEach(alert => {
                const alertEmoji = this.getAlertEmoji(alert.type, alert.severity);
                message += `\n${alertEmoji} ${alert.message}`;
                if (alert.recommendation) {
                    message += `\n   💡 ${alert.recommendation}`;
                }
            });
        }

        if (aiResult.analysis) {
            message += `\n\n🤖 <b>AI Analysis:</b>\n${aiResult.analysis}`;
        }

        if (aiResult.signals && aiResult.signals.length > 0) {
            message += '\n\n📊 <b>Trading Signals:</b>';
            aiResult.signals.forEach(signal => {
                const signalEmoji = signal.action === 'BUY' ? '🟢' : signal.action === 'SELL' ? '🔴' : '🟡';
                message += `\n${signalEmoji} <b>${signal.action}</b> (${(signal.confidence * 100).toFixed(0)}%)`;
                if (signal.entryPoint) message += `\n   🎯 Entry: $${signal.entryPoint}`;
                if (signal.stopLoss) message += `\n   🛑 Stop Loss: $${signal.stopLoss}`;
                if (signal.takeProfit) message += `\n   🎯 Take Profit: $${signal.takeProfit}`;
                if (signal.reasoning) message += `\n   💭 ${signal.reasoning}`;
            });
        }

        message += `\n\n⏰ <i>${new Date().toLocaleString('vi-VN')}</i>`;
        return message;
    }

    getAlertEmoji(type, severity) {
        const severityEmojis = {
            'CRITICAL': '🚨',
            'HIGH': '⚠️',
            'MEDIUM': '🟡',
            'LOW': 'ℹ️'
        };

        const typeEmojis = {
            'PRICE_CHANGE': '📈',
            'RSI_OVERBOUGHT': '🔴',
            'RSI_OVERSOLD': '🟢',
            'ENTRY_OPPORTUNITY': '🎯',
            'STOP_LOSS_ALERT': '🛑',
            'TAKE_PROFIT_ALERT': '💰',
            'SIGNAL_EXPIRY': '⏰'
        };

        return typeEmojis[type] || severityEmojis[severity] || '📊';
    }

    async analyzeWithAI(data) {
        const payload = {
            model: this.aiAgent.model,
            messages: [{
                role: 'system',
                content: `Analyze crypto data and provide trading signals. Format:
                ACTION: BUY/SELL/HOLD
                CONFIDENCE: 0.0-1.0
                ENTRY: $price
                STOP: $price
                TARGET: $price
                REASON: brief explanation`
            }, {
                role: 'user',
                content: data
            }],
            max_tokens: 400,
            temperature: 0.7
        };

        const response = await axios.post(`${this.aiAgent.baseUrl}/chat/completions`, payload, {
            headers: this.aiAgent.headers,
            timeout: 15000
        });

        const content = response.data.choices[0].message.content;

        // Parse signals
        const signalRegex = /ACTION:\s*(BUY|SELL|HOLD)[\s\S]*?CONFIDENCE:\s*([0-9.]+)[\s\S]*?ENTRY:\s*\$?([0-9,.]+)[\s\S]*?STOP:\s*\$?([0-9,.]+)[\s\S]*?TARGET:\s*\$?([0-9,.]+)/g;
        const matches = [...content.matchAll(signalRegex)];

        const signals = matches.map(match => ({
            action: match[1],
            confidence: parseFloat(match[2]),
            entryPoint: parseFloat(match[3].replace(/,/g, '')),
            stopLoss: parseFloat(match[4].replace(/,/g, '')),
            takeProfit: parseFloat(match[5].replace(/,/g, '')),
            timestamp: Date.now()
        }));

        signals.forEach(signal => this.emit('tradingSignal', signal));

        return {
            analysis: content,
            signals
        };
    }

    async analyzeAndAlert(symbol) {
        const [priceData, techData] = await Promise.all([
            coinGeckoService.getCryptoPrices([symbol]),
            technicalIndicators.getTechnicalIndicators(symbol)
        ]);

        const analysisData = `${symbol.toUpperCase()}: $${priceData[symbol].usd} (${priceData[symbol].usd_24h_change.toFixed(2)}%) - ${techData.summary.overall_signal}`;
        const aiResult = await this.analyzeWithAI(analysisData);

        if (aiResult.signals?.length > 0) {
            this.emit('alertGenerated', {
                symbol,
                signals: aiResult.signals,
                message: `🚨 ${symbol.toUpperCase()} Signal: ${aiResult.signals[0].action} at $${aiResult.signals[0].entryPoint}`
            });
        }

        return {
            success: true,
            signals: aiResult.signals
        };
    }

    setOrchestrator(orchestrator) {
        this.orchestrator = orchestrator;
        console.log('🔗 Orchestrator reference set in AnalysisAgent');
    }

    // Get market status for API calls
    async getMarketStatus() {
        try {
            const prices = await coinGeckoService.getCryptoPrices(['bitcoin', 'ethereum']);
            const activeSignals = this.alertSystem.getActiveSignals();

            return {
                success: true,
                data: {
                    bitcoin: {
                        price: prices.bitcoin.usd,
                        change24h: prices.bitcoin.usd_24h_change
                    },
                    ethereum: {
                        price: prices.ethereum.usd,
                        change24h: prices.ethereum.usd_24h_change
                    }
                },
                activeSignals: activeSignals.length
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Update news sentiment from NewsAgent
    handleNewsUpdate(news) {
        this.lastNewsSentiment = news.sentiment || 'neutral';
        console.log('📰 News sentiment updated:', this.lastNewsSentiment);
    }

    async start() {
        try {
            if (this.isRunning) {
                console.log('⚠️ Analysis Service already running');
                return {
                    success: false,
                    message: 'Service already running'
                };
            }

            if (!this.config) {
                throw new Error('Configuration not initialized. Call init() first');
            }

            this.isRunning = true;
            console.log('🚀 AIAnalysisService started (Analysis Only)');

            return {
                success: true,
                message: 'Analysis service started'
            };
        } catch (error) {
            console.error('❌ Error starting analysis service:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async stop() {
        try {
            if (!this.isRunning) {
                console.log('⚠️ Analysis Service not running');
                return {
                    success: false,
                    message: 'Service not running'
                };
            }

            this.isRunning = false;
            console.log('🛑 AIAnalysisService stopped');
            return {
                success: true,
                message: 'Analysis service stopped'
            };
        } catch (error) {
            console.error('❌ Error stopping analysis service:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            config: this.config ? 'Configured' : 'Not configured',
            supportedCoins: this.config?.supportedCoins || [],
            alertSystem: this.alertSystem.getStatus()
        };
    }
}

export default new AIAnalysisAgent();