import {
    EventEmitter
} from 'events';

class TradingAgent extends EventEmitter {
    constructor() {
        super();
        this.portfolio = new Map();
        this.balance = {
            USDT: {
                free: 10000,
                used: 0
            }
        };
        this.tradingMode = 'paper';
        this.isRunning = false;
        this.stats = {
            totalTrades: 0,
            winTrades: 0,
            lossTrades: 0,
            totalPnL: 0,
            dailyPnL: 0
        };
    }

    async start(config) {
        this.config = config;
        this.isRunning = true;
        console.log('🚀 TradingAgent started in paper mode');
        return {
            success: true,
            message: 'Trading started'
        };
    }

    async stop() {
        this.isRunning = false;
        console.log('🛑 TradingAgent stopped');
        return {
            success: true,
            message: 'Trading stopped'
        };
    }

    async executePaperTrade(symbol, side, amount, signal) {
        const currentPrice = signal.entryPoint || this.getMockPrice(symbol);
        const quantity = amount / currentPrice;

        if (side === 'buy') {
            this.balance.USDT.free -= amount;
            this.portfolio.set(symbol, {
                symbol,
                side: 'LONG',
                entryPrice: currentPrice,
                quantity,
                entryTime: new Date(),
                unrealizedPnL: {
                    absolute: 0,
                    percentage: 0
                }
            });
            console.log(`✅ Paper BUY: ${symbol} @ $${currentPrice}`);
        } else {
            const position = this.portfolio.get(symbol);
            if (position) {
                const pnl = (currentPrice - position.entryPrice) * position.quantity;
                this.stats.totalPnL += pnl;
                this.stats.dailyPnL += pnl;
                this.stats.totalTrades++;

                if (pnl > 0) this.stats.winTrades++;
                else this.stats.lossTrades++;

                this.balance.USDT.free += amount;
                this.portfolio.delete(symbol);
                console.log(`✅ Paper SELL: ${symbol} @ $${currentPrice}, P&L: $${pnl.toFixed(2)}`);
            }
        }

        return {
            success: true,
            order: {
                symbol,
                side,
                quantity,
                price: currentPrice
            }
        };
    }

    getMockPrice(symbol) {
        const prices = {
            'BTCUSDT': 43000,
            'ETHUSDT': 2500
        };
        return prices[symbol] || 50000;
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            tradingMode: this.tradingMode,
            balance: this.balance,
            activePositions: this.portfolio.size,
            dailyPnL: (this.stats.dailyPnL / 10000) * 100, // Convert to percentage
            winRate: this.getWinRate(),
            totalTrades: this.stats.totalTrades
        };
    }

    getPortfolioStatus() {
        const positions = Array.from(this.portfolio.values());
        let totalValue = this.balance.USDT.free;

        positions.forEach(pos => {
            const currentPrice = this.getMockPrice(pos.symbol);
            const value = pos.quantity * currentPrice;
            totalValue += value;

            // Update unrealized P&L
            pos.unrealizedPnL = {
                absolute: (currentPrice - pos.entryPrice) * pos.quantity,
                percentage: ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100
            };
        });

        return {
            totalValue,
            totalChange: ((totalValue - 10000) / 10000) * 100,
            dailyPnL: this.stats.dailyPnL,
            totalPnL: this.stats.totalPnL,
            activePositions: this.portfolio.size,
            winRate: this.getWinRate(),
            positions: positions.map(pos => ({
                symbol: pos.symbol,
                side: pos.side,
                entryPrice: pos.entryPrice,
                quantity: pos.quantity,
                unrealizedPnL: pos.unrealizedPnL
            }))
        };
    }

    getWinRate() {
        const total = this.stats.winTrades + this.stats.lossTrades;
        return total === 0 ? 0 : Math.round((this.stats.winTrades / total) * 100);
    }
}

export default new TradingAgent();