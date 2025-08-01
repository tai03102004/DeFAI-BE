#!/bin/bash

echo "🔧 Setting up Aptos TESTNET environment..."

# Create new profile for testnet
echo "👤 Creating Aptos testnet profile..."
aptos init --profile default --network testnet

# Get account info
echo "📋 Account information:"
aptos account list --profile default

# Fund account on testnet
echo "💰 Funding account from testnet faucet..."
aptos account fund-with-faucet --profile default

echo "✅ Aptos testnet setup completed!"
echo "💡 Your account address and private key are in ~/.aptos/config.yaml"
echo "🌐 Testnet explorer: https://explorer.aptoslabs.com/?network=testnet"
