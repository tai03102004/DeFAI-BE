import {
    Utils,
    ModalManager
} from './utils.js';

export class Components {
    // Create loading spinner
    static createSpinner(size = 'medium') {
        const sizeClasses = {
            small: 'w-4 h-4',
            medium: 'w-8 h-8',
            large: 'w-12 h-12'
        };

        return `<div class="spinner ${sizeClasses[size]}"></div>`;
    }

    // Create empty state
    static createEmptyState(icon, title, subtitle) {
        return `
            <div class="empty-state">
                <div class="empty-icon">${icon}</div>
                <p class="empty-title">${title}</p>
                <small class="empty-subtitle">${subtitle}</small>
            </div>
        `;
    }

    // Create transaction item
    static createTransactionItem(transaction) {
        const icons = {
            reward: 'gift',
            stake: 'lock',
            unstake: 'unlock',
            transfer_in: 'arrow-down',
            transfer_out: 'arrow-up',
            quiz: 'brain',
            prediction: 'chart-line'
        };

        const titles = {
            reward: 'Daily Reward',
            stake: 'Staking',
            unstake: 'Unstaking',
            transfer_in: 'Received',
            transfer_out: 'Sent',
            quiz: 'Quiz Reward',
            prediction: 'Prediction'
        };

        return `
            <div class="transaction-item ${transaction.type}">
                <div class="transaction-icon">
                    <i class="fas fa-${icons[transaction.type] || 'coins'}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-type">${titles[transaction.type] || 'Transaction'}</div>
                    <div class="transaction-date">${new Date(transaction.timestamp).toLocaleDateString()}</div>
                </div>
                <div class="transaction-amount ${transaction.amount > 0 ? 'positive' : 'negative'}">
                    ${transaction.amount > 0 ? '+' : ''}${transaction.amount} GUI
                </div>
            </div>
        `;
    }

    // Create prediction item
    static createPredictionItem(prediction) {
        return `
            <div class="prediction-item ${prediction.status}">
                <div class="prediction-coin">
                    <span class="coin-symbol">${prediction.symbol}</span>
                    <div class="prediction-direction ${prediction.direction}">
                        <i class="fas fa-arrow-${prediction.direction === 'up' ? 'up' : 'down'}"></i>
                        ${prediction.direction.toUpperCase()}
                    </div>
                </div>
                <div class="prediction-details">
                    <div class="prediction-price">Entry: $${prediction.currentPrice}</div>
                    <div class="prediction-wager">Wager: ${prediction.wager} GUI</div>
                </div>
                <div class="prediction-time">
                    <div class="expires">Expires: ${new Date(prediction.expiresAt).toLocaleDateString()}</div>
                </div>
            </div>
        `;
    }

    // Create leaderboard item
    static createLeaderboardItem(user, index) {
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

        return `
            <div class="leaderboard-item">
                <div class="rank">${medal}</div>
                <div class="user-info">
                    <div class="username">${user.username}</div>
                    <div class="user-stats">Level ${user.level}</div>
                </div>
                <div class="earnings">${user.totalEarned} GUI</div>
            </div>
        `;
    }

    // Create modal
    static createModal(id, title, content, size = 'medium') {
        const sizeClasses = {
            small: 'max-w-sm',
            medium: 'max-w-md',
            large: 'max-w-lg',
            xl: 'max-w-2xl'
        };

        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content ${sizeClasses[size]}">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="close-btn" onclick="Components.closeModal('${id}')">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        return modal;
    }

    static closeModal(id) {
        ModalManager.close(id);
        const modal = document.getElementById(id);
        if (modal) {
            modal.remove();
        }
    }

    // Create game modal with enhanced styling
    static createGameModal(id, title, content) {
        const modal = document.createElement('div');
        modal.className = 'game-modal';
        modal.id = id;
        modal.innerHTML = `
            <div class="game-modal-content">
                <button class="close-game-modal" onclick="Components.closeGameModal('${id}')">×</button>
                <div class="game-modal-header">
                    <h3>${title}</h3>
                </div>
                <div class="game-modal-body">
                    ${content}
                </div>
            </div>
        `;

        // Add modal styles
        const styles = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 1rem;
        `;
        modal.style.cssText = styles;

        return modal;
    }

    static closeGameModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.remove();
        }
    }

    // Create progress bar
    static createProgressBar(percentage, color = 'var(--primary-color)') {
        return `
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${percentage}%; background-color: ${color};"></div>
            </div>
        `;
    }

    // Create badge
    static createBadge(text, type = 'neutral') {
        return `<span class="badge badge-${type}">${text}</span>`;
    }

    // Create coin icon
    static createCoinIcon(coin) {
        const icons = {
            bitcoin: '₿',
            ethereum: 'Ξ',
            bnb: 'BNB',
            cardano: '₳',
            solana: '◎'
        };
        return icons[coin] || coin.substring(0, 2).toUpperCase();
    }

    // Create price change indicator
    static createPriceChange(change) {
        const className = change >= 0 ? 'text-success' : 'text-danger';
        const icon = change >= 0 ? 'arrow-up' : 'arrow-down';
        return `
            <span class="${className}">
                <i class="fas fa-${icon}"></i>
                ${Utils.formatPercentage(change)}
            </span>
        `;
    }

    // Create stat card
    static createStatCard(label, value, change = null) {
        return `
            <div class="stat-card">
                <div class="stat-label">${label}</div>
                <div class="stat-value">${value}</div>
                ${change !== null ? `<div class="stat-change">${this.createPriceChange(change)}</div>` : ''}
            </div>
        `;
    }
}

// Auto-import CSS for components
const componentCSS = `
.empty-state {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary);
}

.empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
}

.empty-title {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
}

.empty-subtitle {
    opacity: 0.7;
}

.game-modal {
    backdrop-filter: blur(4px);
}

.game-modal-content {
    background: var(--bg-gradient);
    border-radius: var(--border-radius-lg);
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    border: 1px solid var(--border-color);
    position: relative;
}

.close-game-modal {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 1.5rem;
    cursor: pointer;
    z-index: 10;
}

.game-modal-header {
    padding: 2rem 2rem 0;
    text-align: center;
}

.game-modal-header h3 {
    color: var(--text-primary);
    margin: 0;
    font-size: 1.3rem;
}

.game-modal-body {
    padding: 1.5rem 2rem 2rem;
}

.progress-bar-container {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
}

.progress-bar {
    height: 100%;
    transition: width 0.3s ease;
    border-radius: 4px;
}

.stat-card {
    background: var(--bg-card);
    padding: 1rem;
    border-radius: var(--border-radius);
    text-align: center;
    border: 1px solid var(--border-color);
}

.stat-label {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
}

.stat-value {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
}

.stat-change {
    font-size: 0.8rem;
}
`;

// Inject component styles
if (!document.getElementById('component-styles')) {
    const style = document.createElement('style');
    style.id = 'component-styles';
    style.textContent = componentCSS;
    document.head.appendChild(style);
}