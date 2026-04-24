import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import { loadRuntimeConfig } from '../config/runtime.js';
import { getSpeechLanguageCode, normalizeLanguageName } from '../config/languages.js';
import { AuthService } from '../services/authService.js';
import { GeminiService } from '../services/geminiService.js';
import { GoogleCloudService } from '../services/googleCloudService.js';
import { KnowledgeBaseService } from '../services/knowledgeBaseService.js';
import {
    isValidQuestion,
    isValidSpeechText,
    normalizeInput
} from '../utils/validators.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..', '..');
const staticRoot = path.join(projectRoot, 'src');
const indexPath = path.join(staticRoot, 'pages', 'index.html');

const cloneRuntimeConfig = (config) => JSON.parse(JSON.stringify(config));

const sendNoStore = (res) => {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
};

const normalizeContext = (context) => {
    if (!context || typeof context !== 'object') {
        return null;
    }

    const reasons = Array.isArray(context.reasons)
        ? context.reasons
            .slice(0, 5)
            .map((reason) => normalizeInput(reason).slice(0, 240))
            .filter(Boolean)
        : [];

    const parsedAge = Number(context.age);

    return {
        hasCheckedEligibility: Boolean(context.hasCheckedEligibility),
        age: Number.isFinite(parsedAge) ? parsedAge : null,
        citizenship: ['indian-citizen', 'non-citizen'].includes(context.citizenship) ? context.citizenship : null,
        registration: ['registered', 'not-registered'].includes(context.registration) ? context.registration : null,
        isEligible: typeof context.isEligible === 'boolean' ? context.isEligible : null,
        reasons
    };
};

const validateChatPayload = (payload) => {
    const question = normalizeInput(payload?.question);
    const language = normalizeLanguageName(payload?.language || 'English');

    if (!isValidQuestion(question)) {
        return { error: 'Invalid question provided.' };
    }

    return {
        question,
        language,
        context: normalizeContext(payload?.context)
    };
};

const validateSpeechPayload = (payload) => {
    const text = normalizeInput(payload?.text);
    if (!isValidSpeechText(text)) {
        return { error: 'Invalid text provided for speech synthesis.' };
    }

    return {
        text,
        language: normalizeLanguageName(payload?.language || 'English')
    };
};

export const createApp = async ({
    runtimeConfig = loadRuntimeConfig(),
    services: serviceOverrides = {},
    fetchImpl
} = {}) => {
    const config = cloneRuntimeConfig(runtimeConfig);

    const googleCloudService = serviceOverrides.googleCloudService
        || new GoogleCloudService(config.googleCloud, { fetchImpl });
    try {
        await googleCloudService.hydrateRuntimeSecrets(config);
    } catch (error) {
        console.warn('Google Cloud secret hydration failed:', error.message);
    }

    const knowledgeBaseService = serviceOverrides.knowledgeBaseService
        || new KnowledgeBaseService();
    await knowledgeBaseService.refreshIfNeeded().catch((error) => {
        console.warn('Knowledge base preload failed:', error.message);
    });

    const authService = serviceOverrides.authService
        || new AuthService(config.auth);

    const geminiService = serviceOverrides.geminiService
        || new GeminiService({
            apiKey: config.gemini.apiKey,
            modelName: config.gemini.model,
            knowledgeBaseService,
            googleCloudService
        });

    const app = express();
    app.disable('x-powered-by');
    app.set('trust proxy', config.isProduction ? 1 : 0);

    app.use(helmet({
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
                imgSrc: ["'self'", 'data:'],
                connectSrc: ["'self'"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                formAction: ["'self'"],
                frameAncestors: ["'none'"]
            }
        },
        crossOriginResourcePolicy: { policy: 'same-origin' }
    }));

    app.use(compression({
        threshold: 1024
    }));

    app.use(express.json({
        limit: '10kb',
        strict: true
    }));

    const globalLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 120,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
    });

    const loginLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'Too many login attempts. Please try again after 15 minutes.' }
    });

    const askLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 40,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'AI request limit reached. Please wait and try again.' }
    });

    app.use(globalLimiter);
    app.use(express.static(staticRoot, {
        etag: true,
        maxAge: config.isProduction ? '1d' : 0,
        immutable: config.isProduction,
        setHeaders: (res, filePath) => {
            if (filePath.endsWith('.html')) {
                res.setHeader('Cache-Control', 'no-store');
            }
        }
    }));

    app.get('/api/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: config.nodeEnv,
            services: {
                authRequired: authService.isAuthRequired(),
                authConfigured: authService.isConfigured(),
                gemini: geminiService.getStatus(),
                googleCloud: googleCloudService.getStatus(),
                knowledgeBase: knowledgeBaseService.getStats()
            }
        });
    });

    app.get('/api/knowledge', async (req, res, next) => {
        try {
            const content = await knowledgeBaseService.getFullContext();
            res.json({ content });
        } catch (error) {
            next(error);
        }
    });

    app.post('/api/login', loginLimiter, (req, res) => {
        sendNoStore(res);

        if (!authService.isAuthRequired()) {
            return res.json({
                success: true,
                authRequired: false,
                token: null
            });
        }

        if (!authService.hasAdminPassword()) {
            return res.status(503).json({
                error: 'Admin password is not configured. Set ADMIN_PASSWORD or configure Secret Manager.'
            });
        }

        const password = typeof req.body?.password === 'string' ? req.body.password : '';
        if (!authService.verifyPassword(password)) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        return res.json({
            success: true,
            token: authService.createToken()
        });
    });

    app.post('/api/ask', askLimiter, async (req, res, next) => {
        sendNoStore(res);

        if (!authService.isValidAuthHeader(req.headers.authorization)) {
            return res.status(403).json({ error: 'Unauthorized access. Please login.' });
        }

        const payload = validateChatPayload(req.body);
        if (payload.error) {
            return res.status(400).json({ error: payload.error });
        }

        try {
            const answer = await geminiService.askQuestion(payload.question, payload.language, payload.context);
            return res.json({ answer });
        } catch (error) {
            return next(error);
        }
    });

    app.post('/api/speak', askLimiter, async (req, res, next) => {
        sendNoStore(res);

        if (!authService.isValidAuthHeader(req.headers.authorization)) {
            return res.status(403).json({ error: 'Unauthorized access. Please login.' });
        }

        const payload = validateSpeechPayload(req.body);
        if (payload.error) {
            return res.status(400).json({ error: payload.error });
        }

        try {
            const audio = await googleCloudService.synthesizeSpeech(payload.text, getSpeechLanguageCode(payload.language));
            if (!audio) {
                return res.status(503).json({
                    error: 'Text-to-speech is unavailable. Configure Google Cloud Text-to-Speech to enable this feature.'
                });
            }

            return res.json(audio);
        } catch (error) {
            console.warn('Text-to-speech request failed:', error.message);
            return res.status(503).json({
                error: 'Text-to-speech is temporarily unavailable. Please try again later.'
            });
        }
    });

    app.use('/api', (req, res) => {
        res.status(404).json({ error: 'API route not found.' });
    });

    app.get('*', (req, res) => {
        res.sendFile(indexPath);
    });

    app.use((error, req, res, next) => {
        console.error(`Unhandled ${req.method} ${req.originalUrl}:`, error);

        if (res.headersSent) {
            return next(error);
        }

        return res.status(500).json({ error: 'Failed to process your request.' });
    });

    return {
        app,
        config,
        services: {
            authService,
            geminiService,
            googleCloudService,
            knowledgeBaseService
        }
    };
};
