import EventEmitter from 'events';
import {
    GamificationUser,
    Prediction
} from '../model/gamification.model.js';

class GamificationService extends EventEmitter {
    constructor() {
        super();
        this.rewards = {
            DAILY_LOGIN: 50,
            CORRECT_PREDICTION: 50,
            SHARE_ANALYSIS: 20,
            COMPLETE_QUIZ: 30,
            REFERRAL: 100,
            TRADING_SIGNAL_USE: 25,
            LEVEL_UP_BONUS: 50
        };

        // Daily limits for rewards
        this.dailyLimits = {
            SHARE_ANALYSIS: 3,
            TRADING_SIGNAL_USE: 5,
            COMPLETE_QUIZ: 3,
            REFERRAL: 10,
            PREDICTIONS: 5
        };

        this.quizQuestions = this.initQuizQuestions();
        console.log('✅ Gamification Service initialized with MongoDB storage');
    }

    initQuizQuestions() {
        return [{
                question: "What is the maximum supply of Bitcoin?",
                options: ["18 million", "21 million", "25 million", "No limit"],
                correct: 1,
                reward: 30,
                explanation: "Bitcoin has a maximum supply of 21 million coins, making it deflationary."
            },
            {
                question: "What consensus mechanism does Ethereum 2.0 use?",
                options: ["Proof of Work", "Proof of Stake", "Delegated PoS", "Proof of Authority"],
                correct: 1,
                reward: 30,
                explanation: "Ethereum 2.0 transitioned to Proof of Stake for better energy efficiency."
            },
            {
                question: "What does DeFi stand for?",
                options: ["Digital Finance", "Decentralized Finance", "Derivative Finance", "Diversified Finance"],
                correct: 1,
                reward: 30,
                explanation: "DeFi stands for Decentralized Finance, enabling financial services without intermediaries."
            },
            {
                question: "Which of these is NOT a type of cryptocurrency wallet?",
                options: ["Hot wallet", "Cold wallet", "Hardware wallet", "Liquid wallet"],
                correct: 3,
                reward: 30,
                explanation: "Liquid wallet is not a standard wallet type. The main types are hot, cold, and hardware wallets."
            },
            {
                question: "What is a smart contract?",
                options: ["A legal document", "Self-executing contract with terms in code", "A mobile app", "A trading algorithm"],
                correct: 1,
                reward: 30,
                explanation: "Smart contracts are self-executing contracts with terms directly written into code."
            },
            {
                question: "What does HODL mean in crypto?",
                options: ["Hold On for Dear Life", "High Order Digital Ledger", "Holding Original Digital Logic", "None of the above"],
                correct: 0,
                reward: 20,
                explanation: "HODL originated from a misspelling of 'hold' and now means 'Hold On for Dear Life'."
            }
        ];
    }

    async initUser(userId, username, walletAddress = null) {
        try {
            // Check if user already exists
            const existingUser = await GamificationUser.findOne({
                userId
            });
            if (existingUser) {
                return {
                    success: false,
                    message: 'User already exists'
                };
            }

            // Create new user
            const newUser = new GamificationUser({
                userId,
                username,
                walletAddress,
                guiBalance: 100, // Starting tokens
                level: 1,
                experience: 0,
                streak: 0,
                lastLogin: new Date(),
                achievements: ['new_user'],
                totalEarned: 100
            });

            await newUser.save();
            console.log(`✅ User ${username} initialized with ID ${userId}`);

            return {
                success: true,
                data: newUser
            };
        } catch (error) {
            console.error('❌ Error initializing user:', error);
            throw error;
        }
    }

    async handleDailyLogin(userId) {
        try {
            const user = await GamificationUser.findOne({
                userId
            });
            if (!user) {
                throw new Error('User not found');
            }

            const now = new Date();
            const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
            const daysDiff = lastLogin ? Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24)) : 1;

            // Check if already claimed today
            if (daysDiff === 0) {
                throw new Error('Already claimed today');
            }

            let reward = this.rewards.DAILY_LOGIN;
            let streakBonus = 0;

            if (daysDiff === 1) {
                // Consecutive day login
                user.streak += 1;
                streakBonus = Math.min(user.streak * 5, 50); // Max 50 bonus
                reward += streakBonus;
            } else if (daysDiff > 1) {
                // Streak broken
                user.streak = 1;
            }

            // Update user
            user.guiBalance += reward;
            user.lastLogin = now;
            user.experience += 10;
            user.totalEarned += reward;

            await user.save();
            await this.checkLevelUp(userId);

            return {
                success: true,
                data: {
                    reward,
                    streakBonus,
                    newStreak: user.streak,
                    totalTokens: user.guiBalance
                }
            };
        } catch (error) {
            console.error('❌ Daily login error:', error);
            throw error;
        }
    }

    async stakeGUI(userId, amount) {
        try {
            const user = await GamificationUser.findOne({
                userId
            });
            if (!user) {
                throw new Error('User not found');
            }

            if (user.guiBalance < amount) {
                throw new Error('Insufficient GUI tokens');
            }

            if (amount < 500) {
                throw new Error('Minimum staking amount is 500 GUI');
            }

            // Calculate staking level
            let stakingLevel = 'basic';
            let premiumDays = 30; // Basic staking - 30 days premium

            if (amount >= 1000) {
                stakingLevel = 'premium';
                premiumDays = 90; // Premium staking - 90 days premium
            }

            // Deduct tokens and update staking info
            user.guiBalance -= amount;
            user.stakedGUI += amount;

            // Set premium access
            const premiumUntil = new Date();
            premiumUntil.setDate(premiumUntil.getDate() + premiumDays);
            user.premiumUntil = premiumUntil;

            // Add achievement for first-time staking
            if (!user.achievements.includes('first_stake')) {
                user.achievements.push('first_stake');
                const achievementBonus = 100;
                user.guiBalance += achievementBonus;
                user.totalEarned += achievementBonus;
            }

            user.experience += Math.floor(amount / 10); // 1 XP per 10 staked tokens
            await user.save();
            await this.checkLevelUp(userId);

            return {
                success: true,
                data: {
                    stakedAmount: amount,
                    stakingLevel,
                    premiumDays,
                    remainingTokens: user.guiBalance,
                    achievement: user.achievements.includes('first_stake') ? 'First Stake Achievement!' : null
                }
            };
        } catch (error) {
            console.error('❌ Staking error:', error);
            throw error;
        }
    }

    async checkLevelUp(userId) {
        try {
            const user = await GamificationUser.findOne({
                userId
            });
            if (!user) return false;

            const requiredExp = user.level * 1000; // 1000 XP per level

            if (user.experience >= requiredExp) {
                const oldLevel = user.level;
                user.level += 1;
                user.experience -= requiredExp;

                // Level up bonus
                const bonus = user.level * this.rewards.LEVEL_UP_BONUS;
                user.guiBalance += bonus;
                user.totalEarned += bonus;

                // Add level achievement
                const levelAchievement = `level_${user.level}`;
                if (!user.achievements.includes(levelAchievement)) {
                    user.achievements.push(levelAchievement);
                }

                await user.save();

                this.emit('levelUp', {
                    userId,
                    oldLevel,
                    newLevel: user.level,
                    bonus
                });

                console.log(`🎉 User ${user.username} leveled up from ${oldLevel} to ${user.level}!`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Level up check error:', error);
            return false;
        }
    }

    async checkDailyLimit(userId) {
        try {
            const user = await GamificationUser.findOne({
                userId
            });
            if (!user) return {
                canUse: false,
                error: 'User not found'
            };

            const today = new Date().toDateString();
            const todayUsage = user.dailyTracking?. [today]?.COMPLETE_QUIZ || 0;

            const canUse = todayUsage < 1;

            const resetTime = new Date();
            resetTime.setDate(resetTime.getDate() + 1);
            resetTime.setHours(0, 0, 0, 0);
            const hoursLeft = Math.ceil((resetTime - new Date()) / (1000 * 60 * 60));

            return {
                canUse,
                remaining: canUse ? 1 : 0,
                resetIn: hoursLeft
            };
        } catch (error) {
            console.error('❌ Daily limit check error:', error);
            return {
                canUse: false,
                error: error.message
            };
        }
    }


    async updateDailyLimit(userId) {
        try {
            const user = await GamificationUser.findOne({
                userId
            });
            if (!user) return false;

            const today = new Date().toDateString();
            if (!user.dailyTracking) user.dailyTracking = {};
            if (!user.dailyTracking[today]) user.dailyTracking[today] = {};

            user.dailyTracking[today].COMPLETE_QUIZ = 1;

            await user.save();
            return true;
        } catch (error) {
            console.error('❌ Daily limit update error:', error);
            return false;
        }
    }

    async createPrediction(userId, coin, direction, currentPrice, wager = 10) {
        try {
            const user = await GamificationUser.findOne({
                userId
            });
            if (!user) throw new Error('User not found');

            // Check if already made prediction today
            const today = new Date().toDateString();
            const lastPredictionDate = user.lastPredictionDate ? new Date(user.lastPredictionDate).toDateString() : null;

            if (lastPredictionDate === today) {
                return {
                    success: false,
                    error: 'You already made a prediction today. Come back tomorrow!'
                };
            }

            // Validate wager amount
            const wagerAmount = parseInt(wager) || 10;
            if (wagerAmount < 10) {
                return {
                    success: false,
                    error: 'Minimum wager is 10 GUI tokens'
                };
            }

            // Check if user has enough balance for wager
            if (user.guiBalance < wagerAmount) {
                return {
                    success: false,
                    error: `Insufficient GUI balance. You need ${wagerAmount} GUI tokens to make this prediction`
                };
            }

            // Generate prediction ID
            const predictionId = `pred_${userId}_${Date.now()}`;

            // Set expiration time (24 hours from now)
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            // Create prediction document
            const prediction = new Prediction({
                predictionId,
                symbol: coin.toUpperCase(),
                currentPrice,
                timeframe: '24h',
                expiresAt,
                participants: [{
                    userId,
                    username: user.username,
                    predictedDirection: direction, // 'up' or 'down'
                    wager: wagerAmount, // Use actual wager amount
                    submittedAt: new Date()
                }],
                totalPool: wagerAmount
            });

            await prediction.save();

            // Update user data
            user.lastPredictionDate = new Date();
            user.totalPredictions = (user.totalPredictions || 0) + 1;
            user.guiBalance -= wagerAmount; // Deduct actual wager amount

            await user.save();

            console.log(`🎯 User ${user.username} made prediction: ${coin} will go ${direction} with ${wagerAmount} GUI`);

            return {
                success: true,
                data: {
                    predictionId,
                    coin: coin.toUpperCase(),
                    direction,
                    currentPrice,
                    wager: wagerAmount,
                    expiresAt,
                    remainingBalance: user.guiBalance
                }
            };

        } catch (error) {
            console.error('❌ Create prediction error:', error);
            throw error;
        }
    }

    // Add method to check and resolve predictions
    async resolvePredictions() {
        try {
            const expiredPredictions = await Prediction.find({
                status: 'active',
                expiresAt: {
                    $lt: new Date()
                }
            });

            for (const prediction of expiredPredictions) {
                await this.resolvePrediction(prediction._id);
            }

            console.log(`✅ Resolved ${expiredPredictions.length} expired predictions`);
        } catch (error) {
            console.error('❌ Resolve predictions error:', error);
        }
    }

    // Add these methods to the class

    async getUserActivePredictions(userId) {
        try {
            const predictions = await Prediction.find({
                'participants.userId': userId,
                status: 'active'
            }).sort({
                createdAt: -1
            });

            return predictions.map(pred => {
                const userParticipation = pred.participants.find(p => p.userId === userId);
                return {
                    predictionId: pred.predictionId,
                    symbol: pred.symbol,
                    currentPrice: pred.currentPrice,
                    predictedDirection: userParticipation.predictedDirection,
                    wager: userParticipation.wager,
                    expiresAt: pred.expiresAt,
                    status: pred.status
                };
            });
        } catch (error) {
            console.error('❌ Error getting active predictions:', error);
            throw error;
        }
    }

    async getUserPredictions(userId, limit = 10) {
        try {
            const predictions = await Prediction.find({
                'participants.userId': userId
            }).sort({
                createdAt: -1
            }).limit(limit);

            return predictions.map(pred => {
                const userParticipation = pred.participants.find(p => p.userId === userId);
                return {
                    predictionId: pred.predictionId,
                    symbol: pred.symbol,
                    currentPrice: pred.currentPrice,
                    actualPrice: pred.actualPrice,
                    predictedDirection: userParticipation.predictedDirection,
                    wager: userParticipation.wager,
                    won: userParticipation.won,
                    reward: userParticipation.reward,
                    status: pred.status,
                    expiresAt: pred.expiresAt,
                    submittedAt: userParticipation.submittedAt
                };
            });
        } catch (error) {
            console.error('❌ Error getting user predictions:', error);
            throw error;
        }
    }

    async resolvePrediction(predictionId) {
        try {
            const prediction = await Prediction.findById(predictionId);
            if (!prediction || prediction.status !== 'active') return;

            // Get current price from your market data source
            // For now, we'll simulate with random price change
            const priceChange = (Math.random() - 0.5) * 0.1; // -5% to +5%
            const actualPrice = prediction.currentPrice * (1 + priceChange);

            prediction.actualPrice = actualPrice;
            prediction.status = 'resolved';

            // Calculate winners
            const isUp = actualPrice > prediction.currentPrice;
            let winners = [];

            for (const participant of prediction.participants) {
                const predictedCorrectly =
                    (participant.predictedDirection === 'up' && isUp) ||
                    (participant.predictedDirection === 'down' && !isUp);

                if (predictedCorrectly) {
                    participant.won = true;
                    participant.reward = 50; // Base reward for correct prediction
                    winners.push(participant);
                }
            }

            prediction.winnerCount = winners.length;
            await prediction.save();

            // Reward winners
            for (const winner of winners) {
                const user = await GamificationUser.findOne({
                    userId: winner.userId
                });
                if (user) {
                    user.guiBalance += winner.reward;
                    user.totalEarned += winner.reward;
                    user.correctPredictions = (user.correctPredictions || 0) + 1;
                    user.experience += 15; // Bonus XP for correct prediction

                    await user.save();
                    await this.checkLevelUp(winner.userId);

                    console.log(`🎉 User ${winner.username} won ${winner.reward} GUI for correct prediction!`);
                }
            }

        } catch (error) {
            console.error('❌ Resolve prediction error:', error);
        }
    }

    // Add method to get user's prediction history
    async getUserPredictions(userId, limit = 10) {
        try {
            const predictions = await Prediction.find({
                    'participants.userId': userId
                })
                .sort({
                    createdAt: -1
                })
                .limit(limit);

            return predictions.map(pred => {
                const userParticipation = pred.participants.find(p => p.userId === userId);
                return {
                    predictionId: pred.predictionId,
                    symbol: pred.symbol,
                    direction: userParticipation.predictedDirection,
                    currentPrice: pred.currentPrice,
                    actualPrice: pred.actualPrice,
                    status: pred.status,
                    won: userParticipation.won,
                    reward: userParticipation.reward || 0,
                    submittedAt: userParticipation.submittedAt,
                    expiresAt: pred.expiresAt
                };
            });
        } catch (error) {
            console.error('❌ Get user predictions error:', error);
            return [];
        }
    }


    async rewardUser(userId, amount, type = 'general', reason = '') {
        try {
            const user = await GamificationUser.findOne({
                userId
            });
            if (!user) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }

            // Check daily limit for specific reward types
            if (this.dailyLimits[type]) {
                const limitCheck = await this.checkDailyLimit(userId, type);
                if (!limitCheck.canUse) {
                    return {
                        success: false,
                        error: `Daily limit reached for ${type}. Reset in ${limitCheck.resetIn} hours!`,
                        limit: limitCheck.limit,
                        used: limitCheck.used
                    };
                }
                await this.updateDailyLimit(userId, type);
            }

            // Update user balance
            user.guiBalance += amount;
            user.totalEarned += amount;
            user.experience += Math.floor(amount / 5);

            await user.save();
            await this.checkLevelUp(userId);

            console.log(`💰 Rewarded ${amount} GUI to ${user.username} for ${reason}`);

            return {
                success: true,
                amount,
                newBalance: user.guiBalance,
                type,
                reason
            };
        } catch (error) {
            console.error('❌ Reward user error:', error);
            throw error;
        }
    }

    async getUserProfile(userId) {
        try {
            const user = await GamificationUser.findOne({
                userId
            });
            if (!user) return null;

            // Check if premium is still active
            const isPremium = user.premiumUntil && user.premiumUntil > new Date();

            return {
                userId: user.userId,
                username: user.username,
                guiTokens: user.guiBalance, // For backward compatibility
                guiBalance: user.guiBalance,
                level: user.level,
                experience: user.experience,
                loginStreak: user.streak,
                lastLogin: user.lastLogin,
                achievements: user.achievements,
                totalEarned: user.totalEarned,
                stakedGUI: user.stakedGUI,
                isPremium,
                premiumUntil: user.premiumUntil,
                totalQuizzes: user.totalQuizzes,
                createdAt: user.createdAt
            };
        } catch (error) {
            console.error('❌ Get user profile error:', error);
            return null;
        }
    }

    async getLeaderboard(limit = 10) {
        try {
            const users = await GamificationUser.find({
                    deleted: {
                        $ne: true
                    }
                })
                .sort({
                    guiBalance: -1
                })
                .limit(limit)
                .select('username guiBalance level achievements totalEarned');

            return users.map((user, index) => ({
                rank: index + 1,
                username: user.username,
                guiTokens: user.guiBalance,
                level: user.level,
                achievements: user.achievements.length,
                totalEarned: user.totalEarned
            }));
        } catch (error) {
            console.error('❌ Leaderboard error:', error);
            return [];
        }
    }

    async createQuiz(userId) {
        try {
            const user = await GamificationUser.findOne({
                userId
            });
            if (!user) throw new Error('User not found');

            // Check if already took quiz today
            const today = new Date().toDateString();
            const lastQuizDate = user.lastQuizDate ? new Date(user.lastQuizDate).toDateString() : null;

            if (lastQuizDate === today) {
                return {
                    success: false,
                    error: 'You already completed today\'s quiz. Come back tomorrow!'
                };
            }

            // Get random question
            const question = this.quizQuestions[Math.floor(Math.random() * this.quizQuestions.length)];

            // Store current quiz in user document
            user.currentQuiz = {
                question: question.question,
                options: question.options,
                correct: question.correct,
                reward: question.reward,
                explanation: question.explanation,
                createdAt: new Date()
            };

            // Mark as taken today
            user.lastQuizDate = new Date();
            await user.save();

            return {
                success: true,
                data: {
                    question: {
                        question: question.question,
                        options: question.options,
                        reward: question.reward
                    }
                }
            };
        } catch (error) {
            console.error('❌ Create quiz error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async submitQuizAnswer(userId, selectedAnswer) {
        try {
            const user = await GamificationUser.findOne({
                userId
            });
            if (!user) throw new Error('User not found');

            if (!user.currentQuiz) {
                throw new Error('No active quiz found');
            }

            const isCorrect = selectedAnswer === user.currentQuiz.correct;
            let reward = 0;

            if (isCorrect) {
                reward = user.currentQuiz.reward;
                user.guiBalance += reward;
                user.totalEarned += reward;
                user.experience += 10;
            }

            user.totalQuizzes = (user.totalQuizzes || 0) + 1;
            user.currentQuiz = null; // Clear quiz

            await user.save();
            await this.checkLevelUp(userId);

            return {
                success: true,
                correct: isCorrect,
                reward,
                newBalance: user.guiBalance,
                explanation: user.currentQuiz?.explanation || ''
            };
        } catch (error) {
            console.error('❌ Submit quiz error:', error);
            throw error;
        }
    }

    async claimDailyReward(userId) {
        try {
            const user = await GamificationUser.findOne({
                userId
            });
            if (!user) throw new Error('User not found');

            const today = new Date().toDateString();
            const lastClaim = user.lastDailyReward ? new Date(user.lastDailyReward).toDateString() : null;

            if (lastClaim === today) {
                return {
                    success: false,
                    error: 'Daily reward already claimed today!'
                };
            }

            const reward = 50;
            user.guiBalance += reward;
            user.totalEarned += reward;
            user.lastDailyReward = new Date();

            // Update streak
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const lastClaimDate = user.lastDailyReward ? new Date(user.lastDailyReward) : null;

            if (lastClaimDate && lastClaimDate.toDateString() === yesterday.toDateString()) {
                user.streak = (user.streak || 0) + 1;
            } else {
                user.streak = 1;
            }

            await user.save();

            return {
                success: true,
                reward,
                newBalance: user.guiBalance,
                streak: user.streak
            };
        } catch (error) {
            console.error('❌ Daily reward error:', error);
            throw error;
        }
    }

    async updateUserWallet(userId, walletAddress) {
        try {
            const user = await GamificationUser.findOneAndUpdate({
                userId
            }, {
                walletAddress
            }, {
                new: true
            });

            if (!user) {
                throw new Error('User not found');
            }

            return {
                success: true,
                data: user
            };
        } catch (error) {
            console.error('❌ Update wallet error:', error);
            throw error;
        }
    }

    async hasPremiumAccess(userId) {
        try {
            const user = await GamificationUser.findOne({
                userId
            });
            if (!user) return false;

            return user.premiumUntil && user.premiumUntil > new Date();
        } catch (error) {
            console.error('❌ Premium check error:', error);
            return false;
        }
    }
}

export default new GamificationService();