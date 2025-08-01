export default {
    model: "meta-llama/Llama-3.3-70B-Instruct",
    temperature: 0.7,
    maxTokens: 800,
    checkInterval: '*/15 * * * *',
    priceChangeThreshold: 5,
    supportedCoins: ['bitcoin', 'ethereum'],
    aiInstructions: `You are a cryptocurrency analysis expert.`,
    apiKey: process.env.AI_API_KEY,
};