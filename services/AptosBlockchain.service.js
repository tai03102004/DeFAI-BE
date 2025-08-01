import {
    AptosClient,
    AptosAccount,
    FaucetClient,
    TokenClient,
    CoinClient
} from 'aptos';
import {
    Buffer
} from 'buffer';

class AptosBlockchainService {
    constructor() {
        this.client = new AptosClient('https://fullnode.testnet.aptoslabs.com/v1');
        this.faucetClient = new FaucetClient('https://faucet.testnet.aptoslabs.com', this.client);
        this.coinClient = new CoinClient(this.client);
        this.tokenClient = new TokenClient(this.client);

        // Contract addresses (will be set after deployment)
        this.moduleAddress = process.env.APTOS_MODULE_ADDRESS || null;
        this.moduleName = 'gui_token';

        // Admin account (for testing)
        this.adminAccount = null;
        this.initAdmin();
    }

    async initAdmin() {
        try {
            if (process.env.APTOS_PRIVATE_KEY) {
                const privateKeyBytes = Buffer.from(process.env.APTOS_PRIVATE_KEY, 'hex');
                this.adminAccount = new AptosAccount(privateKeyBytes);
            } else {
                // Generate new admin account for testing
                this.adminAccount = new AptosAccount();
                console.log('🔑 Generated new admin account:', this.adminAccount.address().hex());
                console.log('🔑 Private key:', Buffer.from(this.adminAccount.signingKey.secretKey).toString('hex'));

                // Fund the account
                // await this.faucetClient.fundAccount(this.adminAccount.address(), 100000000); // 1 APT
            }

            this.moduleAddress = this.adminAccount.address().hex();
            console.log('✅ Aptos admin initialized:', this.moduleAddress);
        } catch (error) {
            console.error('❌ Failed to initialize admin account:', error);
        }
    }

    // Deploy the GUI token contract
    async deployContract() {
        try {
            if (!this.adminAccount) {
                throw new Error('Admin account not initialized');
            }

            // Read the compiled module
            const modulePath = './move/build/gui_token/bytecode_modules/gui_token.mv';
            const moduleHex = require('fs').readFileSync(modulePath).toString('hex');

            const payload = {
                type: 'module_bundle_payload',
                modules: [{
                    bytecode: `0x${moduleHex}`
                }]
            };

            const txnRequest = await this.client.generateTransaction(
                this.adminAccount.address(),
                payload
            );

            const signedTxn = await this.client.signTransaction(this.adminAccount, txnRequest);
            const transactionRes = await this.client.submitTransaction(signedTxn);
            await this.client.waitForTransaction(transactionRes.hash);

            console.log('🚀 Contract deployed successfully!');
            console.log('📋 Transaction hash:', transactionRes.hash);

            // Initialize the token
            await this.initializeToken();

            return {
                success: true,
                hash: transactionRes.hash,
                moduleAddress: this.moduleAddress
            };
        } catch (error) {
            console.error('❌ Contract deployment failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Initialize the GUI token
    async initializeToken() {
        try {
            const payload = {
                type: 'entry_function_payload',
                function: `${this.moduleAddress}::${this.moduleName}::initialize`,
                type_arguments: [],
                arguments: []
            };

            const txnRequest = await this.client.generateTransaction(
                this.adminAccount.address(),
                payload
            );

            const signedTxn = await this.client.signTransaction(this.adminAccount, txnRequest);
            const transactionRes = await this.client.submitTransaction(signedTxn);
            await this.client.waitForTransaction(transactionRes.hash);

            console.log('✅ GUI Token initialized successfully!');
            return {
                success: true,
                hash: transactionRes.hash
            };
        } catch (error) {
            console.error('❌ Token initialization failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Create account from private key or generate new one
    async createAccount(privateKeyHex = null) {
        try {
            let account;
            if (privateKeyHex) {
                const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');
                account = new AptosAccount(privateKeyBytes);
            } else {
                account = new AptosAccount();
                // Fund new account
                await this.faucetClient.fundAccount(account.address(), 10000000); // 0.1 APT
            }

            return {
                success: true,
                address: account.address().hex(),
                privateKey: Buffer.from(account.signingKey.secretKey).toString('hex'),
                publicKey: account.pubKey().hex()
            };
        } catch (error) {
            console.error('❌ Account creation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get GUI token balance
    async getGUIBalance(address) {
        try {
            const resource = await this.client.getAccountResource(
                address,
                `0x1::coin::CoinStore<${this.moduleAddress}::${this.moduleName}::GUIToken>`
            );

            return {
                success: true,
                balance: parseInt(resource.data.coin.value) / 100000000 // Convert from 8 decimals
            };
        } catch (error) {
            if (error.message.includes('Resource not found')) {
                return {
                    success: true,
                    balance: 0
                };
            }
            console.error('❌ Failed to get balance:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Reward user (admin only)
    async rewardUser(userAddress, amount) {
        try {
            if (!this.adminAccount) {
                throw new Error('Admin account not initialized');
            }

            const amountInSmallestUnit = Math.floor(amount * 100000000); // Convert to 8 decimals

            const payload = {
                type: 'entry_function_payload',
                function: `${this.moduleAddress}::${this.moduleName}::reward_prediction`,
                type_arguments: [],
                arguments: [userAddress, amountInSmallestUnit.toString()]
            };

            const txnRequest = await this.client.generateTransaction(
                this.adminAccount.address(),
                payload
            );

            const signedTxn = await this.client.signTransaction(this.adminAccount, txnRequest);
            const transactionRes = await this.client.submitTransaction(signedTxn);
            await this.client.waitForTransaction(transactionRes.hash);

            console.log(`✅ Rewarded ${amount} GUI to ${userAddress}`);
            return {
                success: true,
                hash: transactionRes.hash,
                amount: amount
            };
        } catch (error) {
            console.error('❌ Reward failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Stake GUI tokens
    async stakeGUI(account, amount) {
        try {
            const amountInSmallestUnit = Math.floor(amount * 100000000);

            const payload = {
                type: 'entry_function_payload',
                function: `${this.moduleAddress}::${this.moduleName}::stake`,
                type_arguments: [],
                arguments: [amountInSmallestUnit.toString()]
            };

            const txnRequest = await this.client.generateTransaction(
                account.address(),
                payload
            );

            const signedTxn = await this.client.signTransaction(account, txnRequest);
            const transactionRes = await this.client.submitTransaction(signedTxn);
            await this.client.waitForTransaction(transactionRes.hash);

            console.log(`✅ Staked ${amount} GUI`);
            return {
                success: true,
                hash: transactionRes.hash,
                amount: amount
            };
        } catch (error) {
            console.error('❌ Staking failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get stake information
    async getStakeInfo(address) {
        try {
            const payload = {
                function: `${this.moduleAddress}::${this.moduleName}::get_stake_info`,
                type_arguments: [],
                arguments: [address]
            };

            const result = await this.client.view(payload);

            return {
                success: true,
                stakedAmount: parseInt(result[0]) / 100000000,
                pendingReward: parseInt(result[1]) / 100000000,
                isPremium: result[2]
            };
        } catch (error) {
            console.error('❌ Failed to get stake info:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Check premium access
    async hasPremiumAccess(address) {
        try {
            const payload = {
                function: `${this.moduleAddress}::${this.moduleName}::has_premium_access`,
                type_arguments: [],
                arguments: [address]
            };

            const result = await this.client.view(payload);
            return {
                success: true,
                isPremium: result[0]
            };
        } catch (error) {
            console.error('❌ Failed to check premium access:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get total staked amount
    async getTotalStaked() {
        try {
            const payload = {
                function: `${this.moduleAddress}::${this.moduleName}::get_total_staked`,
                type_arguments: [],
                arguments: []
            };

            const result = await this.client.view(payload);
            return {
                success: true,
                totalStaked: parseInt(result[0]) / 100000000
            };
        } catch (error) {
            console.error('❌ Failed to get total staked:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Transfer GUI tokens
    async transferGUI(fromAccount, toAddress, amount) {
        try {
            const amountInSmallestUnit = Math.floor(amount * 100000000);

            const payload = {
                type: 'entry_function_payload',
                function: '0x1::coin::transfer',
                type_arguments: [`${this.moduleAddress}::${this.moduleName}::GUIToken`],
                arguments: [toAddress, amountInSmallestUnit.toString()]
            };

            const txnRequest = await this.client.generateTransaction(
                fromAccount.address(),
                payload
            );

            const signedTxn = await this.client.signTransaction(fromAccount, txnRequest);
            const transactionRes = await this.client.submitTransaction(signedTxn);
            await this.client.waitForTransaction(transactionRes.hash);

            console.log(`✅ Transferred ${amount} GUI to ${toAddress}`);
            return {
                success: true,
                hash: transactionRes.hash,
                amount: amount
            };
        } catch (error) {
            console.error('❌ Transfer failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get transaction history
    async getTransactionHistory(address, limit = 10) {
        try {
            const transactions = await this.client.getAccountTransactions(address, {
                limit: limit
            });

            const guiTransactions = transactions.filter(tx =>
                tx.payload?.function?.includes(this.moduleName) ||
                tx.payload?.type_arguments?.some(arg => arg.includes('GUIToken'))
            );

            return {
                success: true,
                transactions: guiTransactions.map(tx => ({
                    hash: tx.hash,
                    timestamp: parseInt(tx.timestamp),
                    function: tx.payload?.function || 'transfer',
                    success: tx.success
                }))
            };
        } catch (error) {
            console.error('❌ Failed to get transaction history:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Health check
    isEnabled() {
        return this.moduleAddress !== null;
    }

    getStatus() {
        return {
            enabled: this.isEnabled(),
            moduleAddress: this.moduleAddress,
            network: 'testnet',
            adminAddress: this.adminAccount?.address()?.hex()
        };
    }
}

export default new AptosBlockchainService();