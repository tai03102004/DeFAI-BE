class SimpleWallet {
    constructor() {
        this.wallet = null;
        this.address = null;
        this.balance = 0;
        this.isConnected = false;
        this.init();
    }

    async init() {
        await this.loadConfig();
        await this.restoreConnection();
    }

    async loadConfig() {
        try {
            const response = await fetch('/api/aptos/config');
            this.config = await response.json();
        } catch (error) {
            console.error('Failed to load config:', error);
        }
    }

    async connectBackendAccount() {
        try {
            const response = await fetch('/api/aptos/create-account', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            if (result.success) {
                this.wallet = 'backend';
                this.address = result.address;
                this.isConnected = true;

                await this.getBalance();
                this.saveConnection();
                this.updateUI();
                this.showSuccess('Wallet connected!');
                return true;
            }
        } catch (error) {
            console.error('Connection failed:', error);
            alert('Failed to connect wallet');
        }
        return false;
    }

    async transferGUI(toAddress, amount) {
        if (!this.isConnected) {
            alert('Please connect wallet first');
            return false;
        }

        if (!toAddress || amount <= 0) {
            alert('Invalid address or amount');
            return false;
        }

        try {
            const response = await fetch('/api/aptos/transfer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fromAddress: this.address,
                    toAddress,
                    amount
                })
            });

            const result = await response.json();
            if (result.success) {
                this.showSuccess(`Transferred ${amount} GUI!`);
                await this.getBalance();
                return true;
            } else {
                alert('Transfer failed: ' + result.error);
            }
        } catch (error) {
            console.error('Transfer failed:', error);
            alert('Transfer failed');
        }
        return false;
    }

    openTransferModal() {
        const modal = this.createModal('Transfer GUI Tokens', `
            <div class="form-group">
                <label>Recipient Address:</label>
                <input type="text" id="recipientAddress" placeholder="0x..." />
            </div>
            <div class="form-group">
                <label>Amount:</label>
                <input type="number" id="transferAmount" min="0" step="0.01" />
            </div>
            <button onclick="simpleWallet.executeTransfer()" class="transfer-btn">
                Transfer GUI
            </button>
        `);
        document.body.appendChild(modal);
    }

    showAddress() {
        if (!this.isConnected) {
            alert('Please connect wallet first');
            return;
        }

        const modal = this.createModal('Receive GUI Tokens', `
            <div class="address-display">
                <label>Your Address:</label>
                <div class="address-box">
                    <input type="text" readonly value="${this.address}" onclick="this.select()" />
                    <button onclick="navigator.clipboard.writeText('${this.address}'); alert('Address copied!')">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
            <p>Share this address to receive GUI tokens</p>
        `);
        document.body.appendChild(modal);
    }

    async executeTransfer() {
        const toAddress = document.getElementById('recipientAddress').value;
        const amount = parseFloat(document.getElementById('transferAmount').value);

        if (await this.transferGUI(toAddress, amount)) {
            document.querySelector('.modal').remove();
        }
    }

    async getBalance() {
        if (!this.isConnected) return;

        try {
            const response = await fetch(`/api/aptos/balance/${this.address}`);
            const result = await response.json();
            this.balance = result.success ? result.balance : 0;
        } catch (error) {
            console.error('Failed to get balance:', error);
            this.balance = 0;
        }
    }

    async fundAccount() {
        if (!this.isConnected) {
            alert('Please connect wallet first');
            return;
        }

        try {
            const response = await fetch('/api/aptos/fund-account', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    address: this.address
                })
            });

            const result = await response.json();
            if (result.success) {
                this.showSuccess('Account funded successfully!');
                setTimeout(() => this.getBalance(), 2000);
            } else {
                alert('Failed to fund account: ' + result.error);
            }
        } catch (error) {
            alert('Failed to fund account');
        }
    }

    disconnect() {
        this.wallet = null;
        this.address = null;
        this.balance = 0;
        this.isConnected = false;
        this.clearConnection();
        this.updateUI();
    }

    saveConnection() {
        localStorage.setItem('wallet_data', JSON.stringify({
            type: this.wallet,
            address: this.address
        }));
    }

    clearConnection() {
        localStorage.removeItem('wallet_data');
    }

    async restoreConnection() {
        const saved = localStorage.getItem('wallet_data');
        if (saved) {
            const data = JSON.parse(saved);
            if (data.type === 'backend' && data.address) {
                this.wallet = data.type;
                this.address = data.address;
                this.isConnected = true;
                await this.getBalance();
                this.updateUI();
            }
        }
    }

    updateUI() {
        const connectBtn = document.getElementById('connectWalletBtn');
        const walletInfo = document.getElementById('walletInfo');
        const walletBalance = document.getElementById('walletBalance');
        const walletAddress = document.getElementById('walletAddress');

        if (this.isConnected) {
            if (connectBtn) connectBtn.style.display = 'none';
            if (walletInfo) walletInfo.style.display = 'block';
            if (walletBalance) walletBalance.textContent = `${this.balance.toFixed(4)} GUI`;
            if (walletAddress) walletAddress.textContent = this.shortAddress(this.address);
        } else {
            if (connectBtn) connectBtn.style.display = 'flex';
            if (walletInfo) walletInfo.style.display = 'none';
        }
    }

    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">${content}</div>
            </div>
        `;
        return modal;
    }

    shortAddress(address) {
        return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
    }

    showSuccess(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            background: #4CAF50; color: white; padding: 15px 20px;
            border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        notification.textContent = `✅ ${message}`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

window.openWalletModal = function () {
    const modal = document.getElementById('walletModal');
    if (modal) modal.style.display = 'flex';
};

window.closeWalletModal = function () {
    const modal = document.getElementById('walletModal');
    if (modal) modal.style.display = 'none';
};

window.connectBackendAccount = function () {
    if (window.simpleWallet) {
        window.simpleWallet.connectBackendAccount();
        window.closeWalletModal();
    }
};

window.fundAccount = function () {
    if (window.simpleWallet) {
        window.simpleWallet.fundAccount();
    }
};

// Global functions
const simpleWallet = new SimpleWallet();
window.simpleWallet = simpleWallet;