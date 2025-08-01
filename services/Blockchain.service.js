import {
    AptosClient,
    AptosAccount,
    HexString,
    TxnBuilderTypes,
    BCS
} from 'aptos';

class BlockchainService {
    constructor() {
        this.client = null;
        this.adminAccount = null;
        this.moduleAddress = process.env.APTOS_MODULE_ADDRESS || null;
        this.enabled = process.env.BLOCKCHAIN_ENABLED === 'true';

        if (this.enabled) {
            this.initializeClient();
        }
    }

    initializeClient() {
        try {
            // Connect to Aptos testnet (more stable than devnet)
            this.client = new AptosClient(
                process.env.APTOS_NODE_URL || 'https://fullnode.testnet.aptoslabs.com'
            );

            // Initialize admin account if private key provided
            if (process.env.APTOS_ADMIN_PRIVATE_KEY) {
                this.adminAccount = new AptosAccount(
                    HexString.ensure(process.env.APTOS_ADMIN_PRIVATE_KEY).toUint8Array()
                );
            }

            console.log('✅ Aptos testnet blockchain service initialized');
        } catch (error) {
            console.error('❌ Aptos initialization failed:', error);
            this.enabled = false;
        }
    }

    async mintReward(userAddress, amount) {
        if (!this.enabled || !this.client || !this.adminAccount || !this.moduleAddress) {
            return {
                success: false,
                error: 'Blockchain not configured'
            };
        }

        try {
            // Convert amount to smallest unit (8 decimals)
            const amountWithDecimals = Math.floor(amount * 100000000);

            const payload = {
                type: 'entry_function_payload',
                function: `${this.moduleAddress}::gui_token::reward_prediction`,
                type_arguments: [],
                arguments: [userAddress, amountWithDecimals.toString()]
            };

            const txnRequest = await this.client.generateTransaction(
                this.adminAccount.address(),
                payload
            );

            const signedTxn = await this.client.signTransaction(this.adminAccount, txnRequest);
            const transactionRes = await this.client.submitTransaction(signedTxn);
            await this.client.waitForTransaction(transactionRes.hash);

            return {
                success: true,
                txHash: transactionRes.hash,
                amount: amount
            };
        } catch (error) {
            console.error('Error minting reward:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getUserStakeInfo(userAddress) {
        if (!this.enabled || !this.client || !this.moduleAddress) {
            return null;
        }

        try {
            const resource = await this.client.view({
                function: `${this.moduleAddress}::gui_token::get_stake_info`,
                type_arguments: [],
                arguments: [userAddress]
            });

            const [stakedAmount, pendingReward, isPremium] = resource;

            return {
                stakedAmount: (parseInt(stakedAmount) / 100000000).toString(),
                pendingReward: (parseInt(pendingReward) / 100000000).toString(),
                isPremium: isPremium
            };
        } catch (error) {
            console.error('Error getting stake info:', error);
            return null;
        }
    }

    async getTokenBalance(userAddress) {
        if (!this.enabled || !this.client || !this.moduleAddress) {
            return null;
        }

        try {
            const resource = await this.client.getAccountResource(
                userAddress,
                `0x1::coin::CoinStore<${this.moduleAddress}::gui_token::GUIToken>`
            );

            const balance = resource.data.coin.value;
            return (parseInt(balance) / 100000000).toString();
        } catch (error) {
            console.error('Error getting balance:', error);
            return '0';
        }
    }

    async stakeTokens(userAccount, amount) {
        if (!this.enabled || !this.client || !this.moduleAddress) {
            return {
                success: false,
                error: 'Blockchain not configured'
            };
        }

        try {
            const amountWithDecimals = Math.floor(amount * 100000000);

            const payload = {
                type: 'entry_function_payload',
                function: `${this.moduleAddress}::gui_token::stake`,
                type_arguments: [],
                arguments: [amountWithDecimals.toString()]
            };

            const txnRequest = await this.client.generateTransaction(
                userAccount.address(),
                payload
            );

            const signedTxn = await this.client.signTransaction(userAccount, txnRequest);
            const transactionRes = await this.client.submitTransaction(signedTxn);
            await this.client.waitForTransaction(transactionRes.hash);

            return {
                success: true,
                txHash: transactionRes.hash,
                amount: amount
            };
        } catch (error) {
            console.error('Error staking tokens:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async unstakeTokens(userAccount, amount) {
        if (!this.enabled || !this.client || !this.moduleAddress) {
            return {
                success: false,
                error: 'Blockchain not configured'
            };
        }

        try {
            const amountWithDecimals = Math.floor(amount * 100000000);

            const payload = {
                type: 'entry_function_payload',
                function: `${this.moduleAddress}::gui_token::unstake`,
                type_arguments: [],
                arguments: [amountWithDecimals.toString()]
            };

            const txnRequest = await this.client.generateTransaction(
                userAccount.address(),
                payload
            );

            const signedTxn = await this.client.signTransaction(userAccount, txnRequest);
            const transactionRes = await this.client.submitTransaction(signedTxn);
            await this.client.waitForTransaction(transactionRes.hash);

            return {
                success: true,
                txHash: transactionRes.hash,
                amount: amount
            };
        } catch (error) {
            console.error('Error unstaking tokens:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async hasPremiumAccess(userAddress) {
        if (!this.enabled || !this.client || !this.moduleAddress) {
            return false;
        }

        try {
            const result = await this.client.view({
                function: `${this.moduleAddress}::gui_token::has_premium_access`,
                type_arguments: [],
                arguments: [userAddress]
            });

            return result[0];
        } catch (error) {
            console.error('Error checking premium access:', error);
            return false;
        }
    }

    isEnabled() {
        return this.enabled;
    }

    // Helper to create new account for testing
    createAccount() {
        return new AptosAccount();
    }

    // Helper to fund account on testnet  
    async fundAccount(address, amount = 100000000) { // 1 APT
        if (!this.enabled || !this.client) return false;

        try {
            // Testnet faucet endpoint
            const faucetUrl = 'https://faucet.testnet.aptoslabs.com';
            await this.client.fundAccount(address, amount);
            return true;
        } catch (error) {
            console.error('Error funding account on testnet:', error);
            return false;
        }
    }
}

export default new BlockchainService();