import mongoose from "mongoose";

const GamificationUserSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    username: {
        type: String,
        required: true,
        trim: true
    },
    walletAddress: {
        type: String,
        default: null,
        sparse: true
    },
    guiBalance: {
        type: Number,
        default: 100,
        min: 0
    },
    level: {
        type: Number,
        default: 1,
        min: 1
    },
    experience: {
        type: Number,
        default: 0,
        min: 0
    },
    totalEarned: {
        type: Number,
        default: 100,
        min: 0
    },
    correctPredictions: {
        type: Number,
        default: 0,
        min: 0
    },
    totalPredictions: {
        type: Number,
        default: 0,
        min: 0
    },
    streak: {
        type: Number,
        default: 0,
        min: 0
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    achievements: [{
        type: String,
        trim: true
    }],
    stakedGUI: {
        type: Number,
        default: 0,
        min: 0
    },
    premiumUntil: {
        type: Date,
        default: null
    },
    deleted: {
        type: Boolean,
        default: false
    },
    lastQuizDate: {
        type: Date,
        default: null
    },
    lastPredictionDate: {
        type: Date,
        default: null
    },
    totalQuizzes: {
        type: Number,
        default: 0,
        min: 0
    },
    dailyTracking: {
        type: Object,
        default: {}
    },
    currentQuiz: {
        id: {
            type: String
        },
        question: {
            type: String
        },
        options: {
            type: [String]
        },
        correct: {
            type: Number
        },
        reward: {
            type: Number,
            default: 0
        },
        explanation: {
            type: String,
            default: ''
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },

    tradingStats: {
        totalTrades: {
            type: Number,
            default: 0
        },
        winTrades: {
            type: Number,
            default: 0
        },
        lossTrades: {
            type: Number,
            default: 0
        },
        totalPnL: {
            type: Number,
            default: 0
        },
        winRate: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true,
    collection: 'GamificationUsers'
});

// Indexes for better performance
GamificationUserSchema.index({
    guiBalance: -1
});
GamificationUserSchema.index({
    level: -1
});
GamificationUserSchema.index({
    lastLogin: -1
});
GamificationUserSchema.index({
    deleted: 1
});

const PredictionSchema = new mongoose.Schema({
    predictionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    symbol: {
        type: String,
        required: true,
        uppercase: true
    },
    currentPrice: {
        type: Number,
        required: true,
        min: 0
    },
    actualPrice: {
        type: Number,
        default: null,
        min: 0
    },
    timeframe: {
        type: String,
        required: true,
        enum: ['1h', '4h', '24h'],
        default: '24h'
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['active', 'resolved', 'expired'],
        default: 'active',
        index: true
    },
    participants: [{
        userId: {
            type: String,
            required: true
        },
        username: {
            type: String,
            required: true
        },
        predictedDirection: {
            type: String,
            required: true,
            enum: ['up', 'down']
        },
        wager: {
            type: Number,
            required: true,
            min: 1
        },
        submittedAt: {
            type: Date,
            default: Date.now
        },
        won: {
            type: Boolean,
            default: false
        },
        reward: {
            type: Number,
            default: 0,
            min: 0
        }
    }],
    totalPool: {
        type: Number,
        default: 0,
        min: 0
    },
    winnerCount: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true,
    collection: 'Predictions'
});

// Indexes for predictions
PredictionSchema.index({
    status: 1,
    expiresAt: 1
});
PredictionSchema.index({
    symbol: 1,
    createdAt: -1
});

const TradingSignalSchema = new mongoose.Schema({
    signalId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    coin: {
        type: String,
        required: true,
        uppercase: true
    },
    action: {
        type: String,
        required: true,
        enum: ['BUY', 'SELL', 'HOLD'],
        uppercase: true
    },
    confidence: {
        type: Number,
        required: true,
        min: 0,
        max: 1
    },
    entryPoint: {
        type: Number,
        required: true,
        min: 0
    },
    stopLoss: {
        type: Number,
        default: null,
        min: 0
    },
    takeProfit: {
        type: Number,
        default: null,
        min: 0
    },
    reasoning: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'executed', 'expired', 'cancelled'],
        default: 'active',
        index: true
    },
    executionPrice: {
        type: Number,
        default: null,
        min: 0
    },
    executedAt: {
        type: Date,
        default: null
    },
    pnl: {
        absolute: {
            type: Number,
            default: 0
        },
        percentage: {
            type: Number,
            default: 0
        }
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true
    }
}, {
    timestamps: true,
    collection: 'TradingSignals'
});

// Indexes for trading signals
TradingSignalSchema.index({
    status: 1,
    expiresAt: 1
});
TradingSignalSchema.index({
    userId: 1,
    createdAt: -1
});

export const GamificationUser = mongoose.models.GamificationUser ||
    mongoose.model("GamificationUser", GamificationUserSchema);

export const Prediction = mongoose.models.Prediction ||
    mongoose.model("Prediction", PredictionSchema);

export const TradingSignal = mongoose.models.TradingSignal ||
    mongoose.model("TradingSignal", TradingSignalSchema);