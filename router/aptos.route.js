import express from 'express';
import {
    AptosConfig,
    Aptos,
    Network,
    Account,
    Ed25519PrivateKey
} from '@aptos-labs/ts-sdk';
import AptosBlockchainService from '../services/AptosBlockchain.service.js';

const router = express.Router();

const config = new AptosConfig({
    network: process.env.APTOS_NETWORK === 'testnet' ? Network.TESTNET : Network.MAINNET
});
const aptos = new Aptos(config);

// Get Aptos configuration
router.get('/config', (req, res) => {
    res.json({
        network: process.env.APTOS_NETWORK,
        nodeUrl: process.env.APTOS_NODE_URL,
        faucetUrl: process.env.APTOS_FAUCET_URL,
        moduleAddress: process.env.APTOS_MODULE_ADDRESS
    });
});

// Create backend account
router.post('/create-account', async (req, res) => {
    try {
        const privateKey = new Ed25519PrivateKey(process.env.APTOS_PRIVATE_KEY);
        const account = Account.fromPrivateKey({
            privateKey
        });

        res.json({
            success: true,
            address: account.accountAddress.toString(),
            publicKey: account.publicKey.toString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Transfer GUI tokens
router.post('/transfer', async (req, res) => {
    try {
        const {
            fromAddress,
            toAddress,
            amount
        } = req.body;

        if (!fromAddress || !toAddress || !amount) {
            return res.json({
                success: false,
                error: 'Missing required fields'
            });
        }

        const result = await AptosBlockchainService.transferGUI(fromAddress, toAddress, amount);
        res.json(result);
    } catch (error) {
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Get GUI balance
router.get('/balance/:address', async (req, res) => {
    try {
        const {
            address
        } = req.params;
        const result = await AptosBlockchainService.getGUIBalance(address);
        res.json(result);
    } catch (error) {
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Fund account (testnet only)
router.post('/fund-account', async (req, res) => {
    try {
        const {
            address
        } = req.body;

        if (process.env.APTOS_NETWORK !== 'testnet') {
            return res.status(400).json({
                success: false,
                error: 'Faucet only available on testnet'
            });
        }

        const response = await aptos.fundAccount({
            accountAddress: address,
            amount: 100000000 // 1 APT
        });

        res.json({
            success: true,
            transactionHash: response.hash
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;