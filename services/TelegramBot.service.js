import TelegramBot from 'node-telegram-bot-api';
import GamificationService from './Gamification.service.js';

class TelegramBotService {
    constructor() {
        this.bot = null;
        this.isInitialized = false;
        this.analysisAgent = null;
    }

    init(analysisAgent = null) {
        if (this.isInitialized) return;

        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
            console.log('❌ Telegram bot token not found');
            return;
        }

        this.bot = new TelegramBot(token, {
            polling: true
        });
        this.analysisAgent = analysisAgent;

        // Listen to analysis agent alerts
        if (this.analysisAgent) {
            this.analysisAgent.on('alertGenerated', (alertData) => {
                this.sendToDefaultChat(alertData.message);
            });
        }

        this.setupCommands();
        this.isInitialized = true;
        console.log('✅ Telegram Bot initialized successfully');
    }

    // Send message to default chat (from env)
    async sendToDefaultChat(message) {
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (chatId && this.bot) {
            try {
                await this.bot.sendMessage(chatId, message, {
                    parse_mode: 'HTML'
                });
            } catch (error) {
                console.error('Error sending to default chat:', error);
            }
        }
    }

    setupCommands() {
        // Start command with game launch
        this.bot.onText(/\/start/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id.toString();
            const username = msg.from.username;
            try {
                // Initialize user
                await GamificationService.initUser(userId, username);

                const welcomeMessage = `
                    🎮 **Welcome to DeFAI Gaming Hub!** 🎮

                    🚀 **Launch Game**: Click the button below to start playing!

                    📱 **Available Commands:**
                    /profile - 👤 View gaming profile & stats
                    /daily - 🎁 Claim daily $GUI rewards (once/day)
                    /quiz - 🧠 Crypto knowledge quiz (once/day)
                    /predict - 🎯 Price prediction game
                    /stake - 💎 Stake $GUI for premium benefits
                    /leaderboard - 🏆 Top earners ranking

                    💬 **Game Features:**
                    /analyze - 📊 Get market analysis and alerts
                    /market - 📈 Get current market status

                    💡 **Tips:**
                    • Complete daily tasks to earn $GUI tokens
                    • Stake tokens for premium benefits
                    • Compete in price predictions
                    • Build your streak for bonus rewards!

                    Ready to earn? Let's go! 🚀
                `;

                const keyboard = {
                    inline_keyboard: [
                        [{
                            text: '🎮 Launch Game',
                            web_app: {
                                url: `${'https://8d0ffd0e9fad.ngrok-free.app/webapp/miniapp'}?user_id=${userId}&username=${username}}`
                            }
                        }],
                        [{
                                text: '👤 Profile',
                                callback_data: 'profile'
                            },
                            {
                                text: '🎁 Daily Reward',
                                callback_data: 'daily'
                            }
                        ],
                        [{
                                text: '🧠 Quiz',
                                callback_data: 'quiz'
                            },
                            {
                                text: '🎯 Predict',
                                callback_data: 'predict'
                            }
                        ],
                        [{
                            text: '🏆 Leaderboard',
                            callback_data: 'leaderboard'
                        }]
                    ]
                };

                await this.bot.sendMessage(chatId, welcomeMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: keyboard
                });

            } catch (error) {
                console.error('Start command error:', error);
                await this.bot.sendMessage(chatId, '❌ Error initializing. Please try again.');
            }
        });

        // Profile command
        this.bot.onText(/\/profile/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id.toString();

            try {
                const profile = await GamificationService.getUserProfile(userId);

                if (!profile) {
                    await this.bot.sendMessage(chatId, '❌ Profile not found. Use /start to initialize.');
                    return;
                }

                const accuracy = profile.totalPredictions > 0 ?
                    (profile.correctPredictions / profile.totalPredictions * 100).toFixed(1) : 0;

                const profileMessage = `
                    👤 **Your Gaming Profile**

                    💰 **Balance:** ${profile.guiBalance} $GUI
                    ⭐ **Level:** ${profile.level}
                    🔥 **Streak:** ${profile.streak} days
                    📊 **Experience:** ${profile.experience} XP
                    🎯 **Accuracy:** ${accuracy}%
                    💎 **Staked:** ${profile.stakedGUI || 0} $GUI
                    🏆 **Total Earned:** ${profile.totalEarned} $GUI

                    ${profile.isPremium ? '👑 **Premium Member**' : '🔓 Stake 500+ $GUI for Premium'}

                    📈 **Stats:**
                    • Predictions: ${profile.correctPredictions}/${profile.totalPredictions}
                    • Quizzes: ${profile.totalQuizzes || 0}
                    • Join Date: ${new Date(profile.createdAt).toLocaleDateString()}
                `;

                const keyboard = {
                    inline_keyboard: [
                        [{
                            text: '🎮 Launch Game',
                            web_app: {
                                url: `${process.env.MINI_APP_URL}?user_id=${userId}`
                            }
                        }],
                        [{
                                text: '🎁 Daily Reward',
                                callback_data: 'daily'
                            },
                            {
                                text: '💎 Stake GUI',
                                callback_data: 'stake'
                            }
                        ]
                    ]
                };

                await this.bot.sendMessage(chatId, profileMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: keyboard
                });

            } catch (error) {
                console.error('Profile command error:', error);
                await this.bot.sendMessage(chatId, '❌ Error loading profile. Please try again.');
            }
        });

        // Daily reward command
        this.bot.onText(/\/daily/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id.toString();

            try {
                const result = await GamificationService.handleDailyLogin(userId);

                if (result.success) {
                    const message = `
                        🎁 **Daily Reward Claimed!**

                        💰 **Earned:** +${result.reward} $GUI
                        🔥 **Streak:** ${result.streak} days
                        💳 **New Balance:** ${result.newBalance} $GUI

                        ${result.streak >= 7 ? '🏆 Amazing streak! Keep it up!' : '💡 Login daily to build your streak!'}
                    `;

                    await this.bot.sendMessage(chatId, message, {
                        parse_mode: 'Markdown'
                    });
                } else {
                    await this.bot.sendMessage(chatId, `❌ ${result.error}`);
                }

            } catch (error) {
                console.error('Daily command error:', error);
                await this.bot.sendMessage(chatId, '❌ Error claiming daily reward. Please try again.');
            }
        });

        // Quiz command
        this.bot.onText(/\/quiz/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id.toString();

            try {
                const quiz = GamificationService.createQuiz();
                const question = quiz.questions[0]; // Lấy câu hỏi đầu tiên

                const message = `🧠 **Crypto Quiz**\n\n❓ ${question.question}\n💰 Reward: ${question.reward} $GUI`;

                const keyboard = {
                    inline_keyboard: question.options.map((option, index) => [{
                        text: `${String.fromCharCode(65 + index)}. ${option}`,
                        callback_data: `quiz_${index}`
                    }])
                };

                await this.bot.sendMessage(chatId, message, {
                    parse_mode: 'Markdown',
                    reply_markup: keyboard
                });
            } catch (error) {
                await this.bot.sendMessage(chatId, '❌ Quiz error. Try again.');
            }
        });

        // Predict command
        this.bot.onText(/\/predict/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id.toString();

            try {
                const activePredictions = await GamificationService.getActivePredictions();

                if (activePredictions.length === 0) {
                    // Create a new prediction challenge
                    const symbols = ['BTCUSDT', 'ETHUSDT'];
                    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
                    const currentPrice = symbol === 'BTCUSDT' ? 45000 : 3000;

                    await GamificationService.createPredictionChallenge(symbol, currentPrice, '1h');
                }

                const predictMessage = `
                    🎯 **Price Prediction Game**

                    📊 **Current Challenges:**
                    • Bitcoin (BTC): Predict next hour price
                    • Ethereum (ETH): Predict next hour price

                    💰 **How it works:**
                    • Minimum wager: 10 $GUI
                    • Winners share the prize pool
                    • More accurate = bigger reward!

                    🎮 **Start predicting in the game!**
                `;

                const keyboard = {
                    inline_keyboard: [
                        [{
                            text: '🎯 Start Predicting',
                            web_app: {
                                url: `${process.env.MINI_APP_URL}?user_id=${userId}&tab=predict`
                            }
                        }]
                    ]
                };

                await this.bot.sendMessage(chatId, predictMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: keyboard
                });

            } catch (error) {
                console.error('Predict command error:', error);
                await this.bot.sendMessage(chatId, '❌ Error loading predictions. Please try again.');
            }
        });

        // Stake command
        this.bot.onText(/\/stake/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id.toString();

            try {
                const profile = await GamificationService.getUserProfile(userId);

                if (!profile) {
                    await this.bot.sendMessage(chatId, '❌ Profile not found. Use /start to initialize.');
                    return;
                }

                const stakeMessage = `
                    💎 **Stake $GUI Tokens**

                    💰 **Your Balance:** ${profile.guiBalance} $GUI
                    💎 **Currently Staked:** ${profile.stakedGUI || 0} $GUI

                    🎁 **Premium Benefits (500+ $GUI staked):**
                    • 2x daily rewards
                    • Exclusive prediction challenges
                    • Priority support
                    • Special badges

                    ${profile.isPremium ? '👑 You have Premium access!' : '🔓 Stake 500+ $GUI to unlock Premium!'}

                    🎮 **Manage your stakes in the game!**
                `;

                const keyboard = {
                    inline_keyboard: [
                        [{
                            text: '💎 Manage Stakes',
                            web_app: {
                                url: `${process.env.MINI_APP_URL}?user_id=${userId}&tab=stake`
                            }
                        }]
                    ]
                };

                await this.bot.sendMessage(chatId, stakeMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: keyboard
                });

            } catch (error) {
                console.error('Stake command error:', error);
                await this.bot.sendMessage(chatId, '❌ Error loading stake info. Please try again.');
            }
        });

        // Leaderboard command
        this.bot.onText(/\/leaderboard/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id.toString();

            try {
                const leaderboard = await GamificationService.getLeaderboard(10);

                let leaderboardMessage = '🏆 **Top Earners Leaderboard**\n\n';

                leaderboard.forEach((user, index) => {
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                    leaderboardMessage += `${medal} **${user.username}**\n`;
                    leaderboardMessage += `   💰 ${user.totalEarned} $GUI | ⭐ Level ${user.level} | 🎯 ${user.accuracy}%\n\n`;
                });

                // Find user's rank
                const userRank = leaderboard.findIndex(user => user.userId === userId) + 1;
                if (userRank > 0) {
                    leaderboardMessage += `📍 **Your Rank:** #${userRank}`;
                } else {
                    leaderboardMessage += `📍 **Your Rank:** Not in top 10`;
                }

                const keyboard = {
                    inline_keyboard: [
                        [{
                            text: '🎮 Play to Climb Rankings',
                            web_app: {
                                url: `${process.env.MINI_APP_URL}?user_id=${userId}`
                            }
                        }]
                    ]
                };

                await this.bot.sendMessage(chatId, leaderboardMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: keyboard
                });

            } catch (error) {
                console.error('Leaderboard command error:', error);
                await this.bot.sendMessage(chatId, '❌ Error loading leaderboard. Please try again.');
            }
        });

        // Handle callback queries (inline button clicks)
        this.bot.onText(/\/callback_query/, async (msg) => {
            const chatId = query.message.chat.id;
            const userId = query.from.id.toString();
            const data = query.data;

            try {
                await this.bot.answerCallbackQuery(query.id);

                if (data === 'profile') {
                    // Trigger profile command
                    this.bot.emit('message', {
                        ...query.message,
                        text: '/profile',
                        from: query.from
                    });
                } else if (data === 'daily') {
                    // Trigger daily command
                    this.bot.emit('message', {
                        ...query.message,
                        text: '/daily',
                        from: query.from
                    });
                } else if (data === 'quiz') {
                    // Trigger quiz command
                    this.bot.emit('message', {
                        ...query.message,
                        text: '/quiz',
                        from: query.from
                    });
                } else if (data === 'predict') {
                    // Trigger predict command
                    this.bot.emit('message', {
                        ...query.message,
                        text: '/predict',
                        from: query.from
                    });
                } else if (data === 'leaderboard') {
                    // Trigger leaderboard command
                    this.bot.emit('message', {
                        ...query.message,
                        text: '/leaderboard',
                        from: query.from
                    });
                } else if (data.startsWith('quiz_')) {
                    // Handle quiz answer
                    const [, questionId, answerIndex] = data.split('_');
                    const result = await GamificationService.submitQuizAnswer(userId, questionId, parseInt(answerIndex));

                    if (result.success) {
                        const message = result.correct ?
                            `✅ **Correct!** You earned ${result.reward} $GUI!\n💳 **New Balance:** ${result.newBalance} $GUI` :
                            `❌ **Wrong answer!** Better luck next time!\n💡 Study more crypto knowledge!`;

                        await this.bot.sendMessage(chatId, message, {
                            parse_mode: 'Markdown'
                        });
                    } else {
                        await this.bot.sendMessage(chatId, `❌ ${result.error}`);
                    }
                }

            } catch (error) {
                console.error('Callback query error:', error);
                await this.bot.sendMessage(chatId, '❌ Error processing request. Please try again.');
            }
        });

        // Add analysis commands
        this.bot.onText(/\/analyze/, async (msg) => {
            const chatId = msg.chat.id;
            const args = msg.text.split(' ');
            const coin = args[1] || 'bitcoin';

            if (!this.analysisAgent) {
                await this.bot.sendMessage(chatId, '❌ Analysis service not available');
                return;
            }

            try {
                const result = await this.analysisAgent.analyzeAndAlert(coin, true);

                if (result.success && result.alertMessage) {
                    await this.bot.sendMessage(chatId, result.alertMessage, {
                        parse_mode: 'HTML'
                    });
                } else {
                    await this.bot.sendMessage(chatId, `❌ ${result.error || 'No analysis available'}`);
                }
            } catch (error) {
                console.error('Analyze command error:', error);
                await this.bot.sendMessage(chatId, '❌ Error performing analysis');
            }
        });
        this.bot.onText(/\/market/, async (msg) => {
            const chatId = msg.chat.id;

            if (!this.analysisAgent) {
                await this.bot.sendMessage(chatId, '❌ Analysis service not available');
                return;
            }

            try {
                const result = await this.analysisAgent.getMarketStatus();

                if (result.success) {
                    let message = '📊 <b>Market Status:</b>\n\n';
                    Object.entries(result.data).forEach(([coin, data]) => {
                        const emoji = coin === 'bitcoin' ? '🟡' : '🔵';
                        const name = coin === 'bitcoin' ? 'Bitcoin' : 'Ethereum';
                        const changeEmoji = data.change24h > 0 ? '📈' : '📉';
                        message += `${emoji} <b>${name}:</b> $${data.price.toFixed(2)} ${changeEmoji} ${data.change24h.toFixed(2)}%\n`;
                    });

                    if (result.activeSignals > 0) {
                        message += `\n📊 <b>Active Signals:</b> ${result.activeSignals}`;
                    }

                    await this.bot.sendMessage(chatId, message, {
                        parse_mode: 'HTML'
                    });
                } else {
                    await this.bot.sendMessage(chatId, '❌ Error getting market data');
                }
            } catch (error) {
                console.error('Market command error:', error);
                await this.bot.sendMessage(chatId, '❌ Error loading market data');
            }
        });

        // Handle errors
        this.bot.on('error', (error) => {
            console.error('Telegram Bot Error:', error);
        });

        // Handle polling errors
        this.bot.on('polling_error', (error) => {
            console.error('Telegram Bot Polling Error:', error);
        });
    }

    // Method to send notifications
    async sendNotification(chatId, message, options = {}) {
        if (!this.bot) return false;

        try {
            await this.bot.sendMessage(chatId, message, options);
            return true;
        } catch (error) {
            console.error('Error sending notification:', error);
            return false;
        }
    }

    // Method to check if bot is running
    isRunning() {
        return this.isInitialized && this.bot;
    }
}

export default new TelegramBotService();