import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_PORT = 3000;

const readValue = (value) => {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
};

export const loadRuntimeConfig = () => {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const parsedPort = Number.parseInt(process.env.PORT || String(DEFAULT_PORT), 10);

    return {
        port: Number.isFinite(parsedPort) ? parsedPort : DEFAULT_PORT,
        nodeEnv,
        isProduction: nodeEnv === 'production',
        auth: {
            required: process.env.AUTH_REQUIRED !== 'false',
            adminPassword: readValue(process.env.ADMIN_PASSWORD),
            tokenSecret: readValue(process.env.AUTH_TOKEN_SECRET) || readValue(process.env.ADMIN_PASSWORD),
            tokenTtlMs: 2 * 60 * 60 * 1000
        },
        gemini: {
            apiKey: readValue(process.env.GEMINI_API_KEY),
            model: readValue(process.env.GEMINI_MODEL) || 'gemini-2.5-flash'
        },
        googleCloud: {
            projectId: readValue(process.env.GOOGLE_CLOUD_PROJECT_ID)
                || readValue(process.env.GCLOUD_PROJECT)
                || readValue(process.env.GOOGLE_PROJECT_ID)
                || readValue(process.env.GOOGLE_CLOUD_PROJECT),
            location: readValue(process.env.GOOGLE_CLOUD_LOCATION) || 'global',
            bigQueryDataset: readValue(process.env.GOOGLE_BIGQUERY_DATASET),
            bigQueryTable: readValue(process.env.GOOGLE_BIGQUERY_TABLE),
            serviceAccountJson: readValue(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
                || readValue(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
            geminiApiKeySecret: readValue(process.env.GEMINI_API_KEY_SECRET),
            adminPasswordSecret: readValue(process.env.ADMIN_PASSWORD_SECRET),
            translateEnabled: process.env.GOOGLE_TRANSLATE_ENABLED !== 'false',
            textToSpeechEnabled: process.env.GOOGLE_TTS_ENABLED !== 'false',
            useMetadataServer: process.env.GOOGLE_USE_METADATA_SERVER !== 'false'
        }
    };
};
