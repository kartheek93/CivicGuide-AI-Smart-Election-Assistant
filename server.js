import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import geminiService from './src/services/geminiService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false // Disable CSP so CDN scripts (Tailwind/GSAP) work easily
}));

// Performance Middleware
app.use(compression());

// Parsing Middleware
app.use(express.json());

// DDoS Protection & Rate Limiting (Global)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use(globalLimiter);

// Serve static files from src folder
app.use(express.static(path.join(__dirname, 'src')));

// Route for Authentication
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'; // fallback for demo
    
    if (password === adminPassword) {
        res.json({ success: true, token: 'civicguide-auth-token-xyz' });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

// Route to handle Gemini AI questions
app.post('/api/ask', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || authHeader !== 'Bearer civicguide-auth-token-xyz') {
            return res.status(403).json({ error: 'Unauthorized access. Please login.' });
        }

        const { question } = req.body;
        if (!question || typeof question !== 'string' || question.length > 500) {
            return res.status(400).json({ error: 'Invalid question provided.' });
        }
        
        const answer = await geminiService.askQuestion(question);
        res.json({ answer });
    } catch (error) {
        console.error('Error handling /api/ask:', error);
        res.status(500).json({ error: 'Failed to process your request.' });
    }
});

// Route to get Knowledge Base data for the UI
app.get('/api/knowledge', async (req, res) => {
    try {
        const kbPath = path.join(__dirname, 'src', 'data', 'knowledgeBase.txt');
        const content = fs.readFileSync(kbPath, 'utf8');
        res.json({ content });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load knowledge base.' });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'pages', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`CivicGuide AI server running on http://localhost:${PORT}`);
});
