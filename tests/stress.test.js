import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app/createApp.js';

const clone = (value) => JSON.parse(JSON.stringify(value));

const runtimeConfig = {
    port: 0,
    nodeEnv: 'test',
    isProduction: false,
    auth: {
        required: true,
        adminPassword: 'admin-password',
        tokenSecret: 'token-secret',
        tokenTtlMs: 60_000
    },
    gemini: {
        apiKey: 'test-api-key',
        model: 'gemini-2.5-flash'
    },
    googleCloud: {
        projectId: 'demo-project',
        location: 'global',
        serviceAccountJson: null,
        geminiApiKeySecret: null,
        adminPasswordSecret: null,
        translateEnabled: true,
        textToSpeechEnabled: true,
        useMetadataServer: false
    }
};

const createStubKnowledgeBaseService = () => ({
    async refreshIfNeeded() {
        return {
            content: 'Trusted election guidance',
            sections: [{ title: 'Overview', body: 'Trusted election guidance' }]
        };
    },
    async getFullContext() {
        return 'Trusted election guidance';
    },
    async getRelevantContext() {
        return '## Registration\nUse the official voter portal for updates.';
    },
    getStats() {
        return {
            loaded: true,
            sectionCount: 1,
            cachedBytes: 26
        };
    }
});

const createStubGeminiService = () => ({
    async askQuestion(question, language) {
        return `${language} answer for: ${question}`;
    },
    getStatus() {
        return {
            configured: true,
            initialized: true,
            model: 'stub-model',
            cache: { entries: 0, ttlMs: 0, maxEntries: 0 }
        };
    }
});

const createStubGoogleCloudService = () => ({
    async hydrateRuntimeSecrets(config) {
        return config;
    },
    async synthesizeSpeech(text, languageCode) {
        return {
            audioContent: Buffer.from(`${languageCode}:${text}`).toString('base64'),
            mimeType: 'audio/mpeg',
            languageCode
        };
    },
    getStatus() {
        return {
            projectId: 'demo-project',
            location: 'global',
            authentication: 'disabled',
            translateEnabled: true,
            textToSpeechEnabled: true,
            secretManagerConfigured: false
        };
    }
});

const startServer = async (overrides = {}) => {
    const { app } = await createApp({
        runtimeConfig: {
            ...clone(runtimeConfig),
            ...overrides,
            auth: {
                ...clone(runtimeConfig).auth,
                ...(overrides.auth || {})
            },
            gemini: {
                ...clone(runtimeConfig).gemini,
                ...(overrides.gemini || {})
            },
            googleCloud: {
                ...clone(runtimeConfig).googleCloud,
                ...(overrides.googleCloud || {})
            }
        },
        services: {
            geminiService: createStubGeminiService(),
            googleCloudService: createStubGoogleCloudService(),
            knowledgeBaseService: createStubKnowledgeBaseService()
        }
    });

    const server = app.listen(0);
    await once(server, 'listening');

    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;

    return {
        baseUrl,
        async close() {
            await new Promise((resolve, reject) => {
                server.close((error) => error ? reject(error) : resolve());
            });
        }
    };
};

test('Server integration: health, login, AI answer, and speech route', async (t) => {
    const server = await startServer();
    t.after(() => server.close());

    const healthResponse = await fetch(`${server.baseUrl}/api/health`);
    assert.equal(healthResponse.status, 200);
    const health = await healthResponse.json();
    assert.equal(health.status, 'ok');
    assert.equal(health.services.authRequired, true);
    assert.equal(health.services.authConfigured, true);

    const unauthorizedAsk = await fetch(`${server.baseUrl}/api/ask`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            question: 'How do I vote?',
            language: 'English'
        })
    });
    assert.equal(unauthorizedAsk.status, 403);

    const loginResponse = await fetch(`${server.baseUrl}/api/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: 'admin-password' })
    });
    assert.equal(loginResponse.status, 200);
    const loginBody = await loginResponse.json();
    assert.equal(typeof loginBody.token, 'string');

    const askResponse = await fetch(`${server.baseUrl}/api/ask`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${loginBody.token}`
        },
        body: JSON.stringify({
            question: 'How do I register to vote?',
            language: 'English'
        })
    });
    assert.equal(askResponse.status, 200);
    const askBody = await askResponse.json();
    assert.match(askBody.answer, /How do I register to vote/);

    const speechResponse = await fetch(`${server.baseUrl}/api/speak`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${loginBody.token}`
        },
        body: JSON.stringify({
            text: 'Carry an approved photo ID.',
            language: 'English'
        })
    });
    assert.equal(speechResponse.status, 200);
    const speechBody = await speechResponse.json();
    assert.equal(speechBody.mimeType, 'audio/mpeg');
    assert.equal(typeof speechBody.audioContent, 'string');
});

test('Server integration: handles burst reads on knowledge endpoint', async (t) => {
    const server = await startServer();
    t.after(() => server.close());

    const start = Date.now();
    const requests = Array.from({ length: 30 }, () => fetch(`${server.baseUrl}/api/knowledge`));
    const responses = await Promise.all(requests);
    const durationMs = Date.now() - start;

    assert.equal(responses.every((response) => response.status === 200), true);
    assert.equal(durationMs < 2000, true);
});

test('Server integration: open access mode skips login requirement', async (t) => {
    const server = await startServer({
        auth: {
            required: false,
            adminPassword: null,
            tokenSecret: null
        }
    });
    t.after(() => server.close());

    const healthResponse = await fetch(`${server.baseUrl}/api/health`);
    const health = await healthResponse.json();
    assert.equal(health.services.authRequired, false);
    assert.equal(health.services.authConfigured, true);

    const askResponse = await fetch(`${server.baseUrl}/api/ask`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            question: 'What should I carry on polling day?',
            language: 'English'
        })
    });
    assert.equal(askResponse.status, 200);
});
