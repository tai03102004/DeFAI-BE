class WalletPage {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadData();
    }

    bindEvents() {
        document.querySelectorAll('.action-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleAction(action);
            });
        });
    }

    handleAction(action) {
        const actions = {
            stake: () => this.showStakeModal(),
            transfer: () => this.showTransferModal(),
            earn: () => navigateTo('earn'),
            withdraw: () => this.showWithdrawModal()
        };

        actions[action]?.();
    }

    async loadData() {
        try {
            const [profile, transactions] = await Promise.all([
                fetch('/api/user/profile').then(r => r.json()),
                fetch('/api/user/transactions').then(r => r.json())
            ]);

            this.updateBalance(profile);
            this.updateTransactions(transactions);
        } catch (error) {
            console.error('Error loading wallet data:', error);
        }
    }

    updateBalance(profile) {
        document.getElementById('mainBalance').textContent = profile.guiBalance || 0;
        document.getElementById('usdValue').textContent = `$${(profile.guiBalance * 0.1).toFixed(2)}`;
        document.getElementById('stakedAmount').textContent = profile.stakedAmount || 0;
        document.getElementById('stakingReward').textContent = profile.stakingReward || 0;
    }

    updateTransactions(transactions) {
        const container = document.getElementById('transactionList');
        container.innerHTML = transactions.length ?
            transactions.map(tx => `
        <div class="transaction-item">
          <div class="tx-type">${tx.type}</div>
          <div class="tx-amount">${tx.amount} GUI</div>
          <div class="tx-date">${new Date(tx.date).toLocaleDateString()}</div>
        </div>
      `).join('') : '<p>No transactions yet</p>';
    }

    showStakeModal() {
        /* Implementation */ }
    showTransferModal() {
        /* Implementation */ }
    showWithdrawModal() {
        /* Implementation */ }
}

new WalletPage();