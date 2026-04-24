import crypto from 'crypto';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const METADATA_TOKEN_ENDPOINT = 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token';
const DEFAULT_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

const parseServiceAccountJson = (rawValue) => {
    if (!rawValue) {
        return null;
    }

    try {
        return JSON.parse(rawValue);
    } catch {
        try {
            return JSON.parse(Buffer.from(rawValue, 'base64').toString('utf8'));
        } catch {
            return null;
        }
    }
};

const trimSecretValue = (value) => {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
};

export class GoogleCloudService {
    constructor(config = {}, { fetchImpl = globalThis.fetch?.bind(globalThis) } = {}) {
        this.config = config;
        this.fetchImpl = fetchImpl;
        this.serviceAccount = parseServiceAccountJson(config.serviceAccountJson);
        this.accessToken = null;
        this.accessTokenExpiresAt = 0;
    }

    getAuthenticationMode() {
        if (this.serviceAccount?.client_email && this.serviceAccount?.private_key) {
            return 'service-account-json';
        }

        if (this.config.useMetadataServer) {
            return 'metadata-server';
        }

        return 'disabled';
    }

    canUseRestApis() {
        return Boolean(this.fetchImpl && this.config.projectId);
    }

    canTranslate() {
        return this.canUseRestApis() && this.config.translateEnabled;
    }

    canSynthesizeSpeech() {
        return this.canUseRestApis() && this.config.textToSpeechEnabled;
    }

    async hydrateRuntimeSecrets(runtimeConfig) {
        if (!this.canUseRestApis()) {
            return runtimeConfig;
        }

        if (!runtimeConfig.gemini.apiKey && this.config.geminiApiKeySecret) {
            runtimeConfig.gemini.apiKey = await this.readSecret(this.config.geminiApiKeySecret);
        }

        if (!runtimeConfig.auth.adminPassword && this.config.adminPasswordSecret) {
            runtimeConfig.auth.adminPassword = await this.readSecret(this.config.adminPasswordSecret);
        }

        if (!runtimeConfig.auth.tokenSecret && runtimeConfig.auth.adminPassword) {
            runtimeConfig.auth.tokenSecret = runtimeConfig.auth.adminPassword;
        }

        return runtimeConfig;
    }

    async readSecret(secretName) {
        const accessToken = await this.getAccessToken();
        if (!accessToken) {
            return null;
        }

        const resourceName = secretName.startsWith('projects/')
            ? secretName
            : `projects/${this.config.projectId}/secrets/${secretName}/versions/latest`;

        const data = await this.fetchJson(`https://secretmanager.googleapis.com/v1/${resourceName}:access`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const encodedValue = data?.payload?.data;
        if (!encodedValue) {
            return null;
        }

        return trimSecretValue(Buffer.from(encodedValue, 'base64').toString('utf8'));
    }

    async translateText(text, targetLanguageCode, sourceLanguageCode = 'en') {
        if (!this.canTranslate() || typeof text !== 'string' || !text.trim()) {
            return null;
        }

        if (targetLanguageCode === sourceLanguageCode) {
            return text;
        }

        const accessToken = await this.getAccessToken();
        if (!accessToken) {
            return null;
        }

        const data = await this.fetchJson(
            `https://translation.googleapis.com/v3/projects/${this.config.projectId}/locations/${this.config.location}:translateText`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [text],
                    mimeType: 'text/plain',
                    sourceLanguageCode,
                    targetLanguageCode
                })
            }
        );

        return trimSecretValue(data?.translations?.[0]?.translatedText) || null;
    }

    async synthesizeSpeech(text, languageCode = 'en-IN') {
        if (!this.canSynthesizeSpeech() || typeof text !== 'string' || !text.trim()) {
            return null;
        }

        const accessToken = await this.getAccessToken();
        if (!accessToken) {
            return null;
        }

        const data = await this.fetchJson('https://texttospeech.googleapis.com/v1/text:synthesize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                input: { text },
                voice: {
                    languageCode
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                    speakingRate: 1
                }
            })
        });

        if (!data?.audioContent) {
            return null;
        }

        return {
            audioContent: data.audioContent,
            mimeType: 'audio/mpeg',
            languageCode
        };
    }

    async getAccessToken() {
        if (this.accessToken && this.accessTokenExpiresAt > Date.now() + 60_000) {
            return this.accessToken;
        }

        const tokenResponse = this.serviceAccount
            ? await this.fetchServiceAccountToken()
            : await this.fetchMetadataServerToken();

        if (!tokenResponse?.access_token) {
            return null;
        }

        this.accessToken = tokenResponse.access_token;
        this.accessTokenExpiresAt = Date.now() + ((tokenResponse.expires_in || 3600) * 1000);
        return this.accessToken;
    }

    async fetchServiceAccountToken() {
        if (!this.serviceAccount?.client_email || !this.serviceAccount?.private_key) {
            return null;
        }

        const nowSeconds = Math.floor(Date.now() / 1000);
        const header = Buffer.from(JSON.stringify({
            alg: 'RS256',
            typ: 'JWT'
        })).toString('base64url');

        const claimSet = Buffer.from(JSON.stringify({
            iss: this.serviceAccount.client_email,
            sub: this.serviceAccount.client_email,
            aud: TOKEN_ENDPOINT,
            scope: DEFAULT_SCOPE,
            iat: nowSeconds,
            exp: nowSeconds + 3600
        })).toString('base64url');

        const unsignedToken = `${header}.${claimSet}`;
        const signature = crypto
            .createSign('RSA-SHA256')
            .update(unsignedToken)
            .end()
            .sign(this.serviceAccount.private_key, 'base64url');

        return this.fetchJson(TOKEN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: `${unsignedToken}.${signature}`
            }).toString()
        });
    }

    async fetchMetadataServerToken() {
        if (!this.config.useMetadataServer) {
            return null;
        }

        return this.fetchJson(METADATA_TOKEN_ENDPOINT, {
            headers: {
                'Metadata-Flavor': 'Google'
            },
            timeoutMs: 1500,
            suppressErrors: true
        });
    }

    async fetchJson(url, {
        method = 'GET',
        headers = {},
        body,
        timeoutMs = 5000,
        suppressErrors = false
    } = {}) {
        if (!this.fetchImpl) {
            return null;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await this.fetchImpl(url, {
                method,
                headers,
                body,
                signal: controller.signal
            });

            const contentType = response.headers.get('content-type') || '';
            const payload = contentType.includes('application/json')
                ? await response.json()
                : await response.text();

            if (!response.ok) {
                if (suppressErrors) {
                    return null;
                }

                const details = typeof payload === 'string'
                    ? payload
                    : payload?.error?.message || JSON.stringify(payload);
                throw new Error(`Google Cloud request failed (${response.status}): ${details}`);
            }

            return payload;
        } catch (error) {
            if (suppressErrors) {
                return null;
            }

            throw error;
        } finally {
            clearTimeout(timeout);
        }
    }

    getStatus() {
        return {
            projectId: this.config.projectId || null,
            location: this.config.location || 'global',
            authentication: this.getAuthenticationMode(),
            translateEnabled: this.canTranslate(),
            textToSpeechEnabled: this.canSynthesizeSpeech(),
            secretManagerConfigured: Boolean(this.config.geminiApiKeySecret || this.config.adminPasswordSecret)
        };
    }
}
