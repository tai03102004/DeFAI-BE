class TokensPage {
    constructor() {
        this.chart = null;
        this.currentCoin = 'bitcoin';
        this.currentTimeframe = '24h';
        this.chartType = 'line'; // 'line' or 'candlestick'
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadData();
    }

    bindEvents() {
        // Coin selection
        document.querySelectorAll('.coin-btn').forEach(btn => {
            btn.onclick = () => this.selectCoin(btn.dataset.coin);
        });

        // Timeframe selection
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.onclick = () => this.selectTimeframe(btn.dataset.timeframe);
        });

        // Chart type toggle
        const chartToggle = document.getElementById('chartTypeToggle');
        if (chartToggle) {
            chartToggle.onclick = () => this.toggleChartType();
        }
    }

    selectCoin(coin) {
        document.querySelectorAll('.coin-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`[data-coin="${coin}"]`).classList.add('active');
        this.currentCoin = coin;
        this.loadData();
    }

    selectTimeframe(timeframe) {
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`[data-timeframe="${timeframe}"]`).classList.add('active');
        this.currentTimeframe = timeframe;
        this.loadData();
    }

    toggleChartType() {
        this.chartType = this.chartType === 'line' ? 'candlestick' : 'line';
        this.loadData();
    }

    async loadData() {
        // try {
        const [priceData, indicators] = await Promise.all([
            this.fetchPriceData(),
            this.fetchIndicators()
        ]);

        this.updatePriceDisplay(priceData.current);
        this.updateChart(priceData.historical);
        this.updateIndicators(indicators);
        // } catch (error) {
        //     console.error('Error loading token data:', error);
        //     this.showError('Failed to load market data');
        // }
    }

    async fetchPriceData() {
        // Mock data - replace with real API
        const mockData = {
            current: {
                price: this.currentCoin === 'bitcoin' ? 150000 : 3200,
                change24h: Math.random() * 10 - 5,
                volume24h: Math.random() * 1e10,
                marketCap: Math.random() * 1e12,
                high24h: this.currentCoin === 'bitcoin' ? 150000 : 3300,
                low24h: this.currentCoin === 'bitcoin' ? 150000 : 3100
            },
            historical: this.generateMockHistoricalData()
        };
        return mockData;
    }

    async fetchIndicators() {
        // Mock indicators - replace with real API
        return {
            rsi: Math.random() * 100,
            macd: Math.random() * 10 - 5,
            macd_trend: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
            volume_signal: 'NORMAL'
        };
    }

    generateMockHistoricalData() {
        const data = [];
        const basePrice = this.currentCoin === 'bitcoin' ? 65000 : 3200;
        const points = this.currentTimeframe === '1h' ? 60 : this.currentTimeframe === '24h' ? 24 : 30;

        for (let i = 0; i < points; i++) {
            const timestamp = Date.now() - (points - i) * 3600000;
            const volatility = 0.02;
            const change = (Math.random() - 0.5) * volatility;
            const price = basePrice * (1 + change);

            data.push({
                timestamp,
                close: price,
                open: price * (1 + (Math.random() - 0.5) * 0.01),
                high: price * (1 + Math.random() * 0.01),
                low: price * (1 - Math.random() * 0.01),
                volume: Math.random() * 1000
            });
        }
        return data;
    }

    updatePriceDisplay(data) {
        const coinNames = {
            bitcoin: 'Bitcoin',
            ethereum: 'Ethereum'
        };

        document.getElementById('currentCoinName').textContent = coinNames[this.currentCoin];
        document.getElementById('currentPrice').textContent = `$${data.price.toLocaleString()}`;

        const changeEl = document.getElementById('currentChange');
        changeEl.textContent = `${data.change24h >= 0 ? '+' : ''}${data.change24h.toFixed(2)}%`;
        changeEl.className = `price-change ${data.change24h >= 0 ? 'positive' : 'negative'}`;

        // Update stats
        document.getElementById('volume24h').textContent = `$${(data.volume24h / 1e9).toFixed(2)}B`;
        document.getElementById('marketCap').textContent = `$${(data.marketCap / 1e9).toFixed(2)}B`;
        document.getElementById('high24h').textContent = `$${data.high24h.toLocaleString()}`;
        document.getElementById('low24h').textContent = `$${data.low24h.toLocaleString()}`;
    }

    updateChart(historicalData) {
        const ctx = document.getElementById('priceChart');
        if (!ctx) return;

        if (this.chart) this.chart.destroy();

        const chartConfig = {
            type: this.chartType === 'candlestick' ? 'candlestick' : 'line',
            data: this.getChartData(historicalData),
            options: this.getChartOptions()
        };

        // Fallback to line chart if candlestick plugin not available
        if (this.chartType === 'candlestick' && !window.Chart.CandlestickController) {
            chartConfig.type = 'line';
            chartConfig.data = this.getLineChartData(historicalData);
        }

        this.chart = new Chart(ctx, chartConfig);
    }

    getChartData(data) {
        if (this.chartType === 'candlestick') {
            return {
                datasets: [{
                    label: `${this.currentCoin.toUpperCase()} Price`,
                    data: data.map(item => ({
                        x: new Date(item.timestamp),
                        o: item.open,
                        h: item.high,
                        l: item.low,
                        c: item.close
                    })),
                    borderColor: '#00ff88',
                    backgroundColor: 'rgba(0, 255, 136, 0.1)'
                }]
            };
        } else {
            return this.getLineChartData(data);
        }
    }

    getLineChartData(data) {
        return {
            datasets: [{
                label: `${this.currentCoin.toUpperCase()} Price`,
                data: data.map(item => ({
                    x: new Date(item.timestamp),
                    y: item.close
                })),
                borderColor: '#00ff88',
                backgroundColor: 'rgba(0, 255, 136, 0.1)',
                fill: true,
                tension: 0.1,
                pointRadius: 0,
                pointHoverRadius: 4
            }]
        };
    }

    getChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 26, 26, 0.9)',
                    titleColor: '#ffffff',
                    bodyColor: '#cccccc',
                    borderColor: '#333333',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    type: 'time',
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#888888',
                        maxTicksLimit: 6
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#888888',
                        callback: value => '$' + value.toLocaleString()
                    }
                }
            }
        };
    }

    updateIndicators(indicators) {
        const rsi = indicators.rsi || 50;
        document.getElementById('rsiValue').textContent = rsi.toFixed(1);
        document.getElementById('rsiFill').style.width = `${rsi}%`;

        const rsiSignal = rsi > 70 ? 'OVERBOUGHT' : rsi < 30 ? 'OVERSOLD' : 'NEUTRAL';
        document.getElementById('rsiSignal').textContent = rsiSignal;

        document.getElementById('macdValue').textContent = (indicators.macd || 0).toFixed(2);
        document.getElementById('macdSignal').textContent = indicators.macd_trend || 'NEUTRAL';
        document.getElementById('volumeValue').textContent = indicators.volume_signal || 'NORMAL';
        document.getElementById('volumeSignal').textContent = indicators.volume_signal || 'NEUTRAL';
    }

    showError(message) {
        const container = document.querySelector('.chart-container');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    }
}

// Initialize only once
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new TokensPage());
} else {
    new TokensPage();
}