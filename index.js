// server.js - Main Express Server

import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
dotenv.config();
import cookieParser from 'cookie-parser';
import session from 'express-session';
import flash from 'connect-flash';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import route from './router/index.route.js';
import AIAnalysisAgent from './agents/AnalysisAgent.js';
import TelegramBotService from './services/TelegramBot.service.js';

// Load environment variables
import {
    connect
} from './config/database.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Kết nối với database
connect();

// để web đẹp hơn
app.use(express.static(`${process.cwd()}/public`));

// Flash
app.use(cookieParser("LHNASDASDAD"));
app.use(session({
    secret: process.env.SESSION_SECRET, // nên để trong .env
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 60000
    }
}));

app.use(flash());

// bodyParser: để có thể lấy data trong req.body (key:value) từ phía client nhập vào
app.use(bodyParser.urlencoded({
    extended: false
}));

// file pug
app.set("views", `${process.cwd()}/views`);
app.set('view engine', 'pug');

// method-override:  use patch, delete,..
app.use(methodOverride('_method'));

// route
route(app);

// Initialize services
console.log('🚀 DeFAI System started!');

// Initialize AI Agent first
const config = {
    enableScheduler: true, // Tự động phân tích mỗi 15 phút
    supportedCoins: ['bitcoin', 'ethereum'],
    aiInstructions: 'You are a cryptocurrency analysis expert...',
    apiKey: process.env.AI_API_KEY
};

AIAnalysisAgent.init(config);
await AIAnalysisAgent.start();

// Initialize Telegram Bot with AnalysisAgent reference
if (process.env.ENABLE_TELEGRAM === 'true') {
    try {
        TelegramBotService.init(AIAnalysisAgent);
        console.log('✅ Telegram Bot Service initialized with AnalysisAgent');
    } catch (error) {
        console.error('❌ Failed to initialize Telegram Bot:', error);
    }
} else {
    console.log('ℹ️ Telegram Bot disabled');
}

app.listen(PORT, () => {
    console.log('🌐 Server running on http://localhost:3000');
    console.log(`🎮 Mini App URL: ${process.env.MINI_APP_URL || 'https://8d0ffd0e9fad.ngrok-free.app/webapp/miniapp'}`);
});

export default app;