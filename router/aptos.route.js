import express from 'express';
import {
    AptosConfig,
    Aptos,
    Network,
    Account,
    Ed25519PrivateKey
} from '@aptos-labs/ts-sdk';

const router = express.Router();

const config = new AptosConfig({
    network: process.env.APTOS_NETWORK === 'testnet' ? Network.TESTNET : Network.MAINNET
});
const aptos = new Aptos(config);

router.get('/config', (req, res) => {
    res.json({
        network: process.env.APTOS_NETWORK,
        nodeUrl: process.env.APTOS_NODE_URL,
        faucetUrl: process.env.APTOS_FAUCET_URL,
        moduleAddress: process.env.APTOS_MODULE_ADDRESS
    });
});

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

router.get('/balance/:address', async (req, res) => {
    try {
        const {
            address
        } = req.params;
        const resources = await aptos.getAccountResources({
            accountAddress: address
        });

        const coinResource = resources.find(r =>
            r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
        );

        const balance = coinResource ?
            parseInt(coinResource.data.coin.value) / 100000000 : 0;

        res.json({
            success: true,
            balance: balance,
            address: address
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

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