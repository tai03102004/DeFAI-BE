import BlockchainService from '../services/Blockchain.service.js';
import GamificationService from '../services/Gamification.service.js';
import dotenv from 'dotenv';
dotenv.config();

async function testAptosIntegration() {
    console.log('🧪 Testing Aptos Integration...');

    if (!BlockchainService.isEnabled()) {
        console.log('❌ Blockchain not enabled in .env');
        return;
    }

    try {
        // 1. Test create account
        const testAccount = BlockchainService.createAccount();
        console.log('✅ Test account created:', testAccount.address().hex());

        // 2. Fund account
        const funded = await BlockchainService.fundAccount(testAccount.address().hex());
        console.log('✅ Account funded:', funded);

        // 3. Test user with blockchain integration
        const userId = 'test_user_123';
        const walletAddress = testAccount.address().hex();

        // Initialize user with wallet address
        await GamificationService.initUser(userId, 'TestUser', walletAddress);
        console.log('✅ User initialized with wallet');

        // 4. Test reward distribution (mints on blockchain)
        const rewardResult = await GamificationService.distributeReward(userId, 50, 'test_reward');
        console.log('✅ Reward distributed:', rewardResult);

        // 5. Check blockchain balance
        const balance = await BlockchainService.getTokenBalance(walletAddress);
        console.log('✅ Blockchain GUI balance:', balance);

        // 6. Test staking
        const stakeResult = await GamificationService.stakeGUI(userId, 100);
        console.log('✅ Staking result:', stakeResult);

        // 7. Check premium status
        const isPremium = await BlockchainService.hasPremiumAccess(walletAddress);
        console.log('✅ Premium status:', isPremium);

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testAptosIntegration();