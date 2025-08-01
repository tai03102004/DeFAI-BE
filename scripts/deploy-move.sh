#!/bin/bash

echo "🚀 Deploying GUI Token Move module to Aptos TESTNET..."

# Change to move directory
cd move

# Compile the module
echo "📦 Compiling Move module..."
aptos move compile

# Publish to testnet
echo "🌐 Publishing to Aptos testnet..."
aptos move publish \
  --profile default \
  --named-addresses gui_token=default

echo "✅ Deployment completed on TESTNET!"
echo "💡 Don't forget to update APTOS_MODULE_ADDRESS in your .env file"
echo "🌐 Check deployment: https://explorer.aptoslabs.com/?network=testnet"
