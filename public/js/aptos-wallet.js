// Updated SimpleWallet for Telegram Mini App compatibility
class SimpleWallet {
    constructor() {
        this.wallet = null;
        this.address = null;
        this.balance = 0;
        this.isConnected = false;
        this.config = null;

        this.loadConfig();
    }

    async loadConfig() {
        try {
            const response = await fetch('/api/aptos/config');
            this.config = await response.json();
            console.log('✅ Aptos config loaded:', this.config);

            await this.restoreConnection();
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
                },
            });

            const result = await response.json();
            if (result.success) {
                this.wallet = 'backend';
                this.address = result.address;
                this.isConnected = true;

                await this.getBalance();
                this.saveConnection();
                this.updateUI();
                this.showSuccess('Backend account connected!');

                console.log('✅ Backend account connected:', this.address);
                return true;
            }
        } catch (error) {
            console.error('Backend connection failed:', error);
            alert('Failed to connect backend account');
            return false;
        }
    }

    async connectPetra() {
        alert('Petra Wallet is not supported in Telegram Mini App.');
        return false;
    }

    async getBalance() {
        try {
            if (!this.isConnected || !this.address) return;

            if (this.wallet === 'backend') {
                const response = await fetch(`/api/aptos/balance/${this.address}`);
                const result = await response.json();

                if (result.success) {
                    this.balance = result.balance;
                }
            }
        } catch (error) {
            console.error('Failed to get balance:', error);
            this.balance = 0;
        }
    }

    async fundAccount() {
        try {
            if (!this.isConnected || !this.address) {
                alert('Please connect wallet first');
                return;
            }

            if (this.config?.network !== 'testnet') {
                alert('Faucet only available on testnet');
                return;
            }

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
            console.error('Fund account failed:', error);
            alert('Failed to fund account');
        }
    }

    async disconnect() {
        this.wallet = null;
        this.address = null;
        this.balance = 0;
        this.isConnected = false;

        this.clearConnection();
        this.updateUI();

        console.log('🔌 Wallet disconnected');
    }

    saveConnection() {
        localStorage.setItem('wallet_type', this.wallet);
        localStorage.setItem('wallet_address', this.address);
    }

    clearConnection() {
        localStorage.removeItem('wallet_type');
        localStorage.removeItem('wallet_address');
    }

    async restoreConnection() {
        const savedWallet = localStorage.getItem('wallet_type');
        const savedAddress = localStorage.getItem('wallet_address');

        if (savedWallet === 'backend' && savedAddress) {
            this.wallet = savedWallet;
            this.address = savedAddress;
            this.isConnected = true;
            await this.getBalance();
            this.updateUI();
            console.log('✅ Auto-reconnected to backend account');
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
            if (walletBalance) walletBalance.textContent = `${this.balance.toFixed(4)} APT`;
            if (walletAddress) walletAddress.textContent = this.shortAddress(this.address);
        } else {
            if (connectBtn) connectBtn.style.display = 'flex';
            if (walletInfo) walletInfo.style.display = 'none';
        }
    }

    shortAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    showSuccess(message = 'Wallet connected successfully!') {
        const successDiv = document.createElement('div');
        successDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            ">
                ✅ ${message}
            </div>
        `;

        document.body.appendChild(successDiv);

        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
}

const simpleWallet = new SimpleWallet();

window.simpleWallet = simpleWallet;

function openWalletModal() {
    const modal = document.getElementById('walletModal');
    if (modal) modal.style.display = 'flex';
}

function closeWalletModal() {
    const modal = document.getElementById('walletModal');
    if (modal) modal.style.display = 'none';
}

function connectBackendAccount() {
    simpleWallet.connectBackendAccount();
    closeWalletModal();
}

function fundAccount() {
    simpleWallet.fundAccount();
}

function disconnectWallet() {
    simpleWallet.disconnect();
}