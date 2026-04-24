import { GoogleGenerativeAI } from '@google/generative-ai';
import { normalizeLanguageCode, normalizeLanguageName } from '../config/languages.js';
import { TTLCache } from './cacheService.js';

const buildContextBlock = (userContext) => {
    if (!userContext?.hasCheckedEligibility) {
        return 'USER CONTEXT: The user has not completed the eligibility checker yet.';
    }

    const reasons = Array.isArray(userContext.reasons) && userContext.reasons.length
        ? userContext.reasons.join(' ')
        : 'No additional guidance provided.';

    return [
        'USER CONTEXT:',
        `- Age: ${userContext.age ?? 'Not provided'}`,
        `- Citizenship: ${userContext.citizenship ?? 'Not provided'}`,
        `- Registration status: ${userContext.registration ?? 'Not provided'}`,
        `- Eligibility result: ${userContext.isEligible ? 'Eligible' : 'Needs action'}`,
        `- Notes: ${reasons}`
    ].join('\n');
};

const buildPrompt = ({ question, responseLanguage, userContext, knowledgeContext }) => `
SYSTEM ROLE:
You are CivicGuide AI, a neutral election guidance assistant for citizens in India.

INSTRUCTIONS:
1. Stay politically neutral and non-partisan.
2. Answer in ${responseLanguage}.
3. Keep the response under 150 words.
4. Use short bullet points or concise paragraphs.
5. Do not invent live election dates, candidate lists, constituency details, or official statuses.
6. If a question depends on current or local information, direct the user to verify on official Election Commission of India portals.
7. If the user appears ineligible, explain the next practical step.

${buildContextBlock(userContext)}

RELEVANT KNOWLEDGE:
${knowledgeContext}

USER QUESTION:
${question}
`;

export class GeminiService {
    constructor({
        apiKey = null,
        modelName = 'gemini-2.5-flash',
        knowledgeBaseService,
        googleCloudService
    } = {}) {
        this.apiKey = apiKey;
        this.modelName = modelName;
        this.knowledgeBaseService = knowledgeBaseService;
        this.googleCloudService = googleCloudService;
        this.genAI = null;
        this.model = null;
        this.initialized = false;
        this.responseCache = new TTLCache({
            ttlMs: 10 * 60 * 1000,
            maxEntries: 200
        });
    }

    getStatus() {
        return {
            configured: Boolean(this.apiKey),
            initialized: this.initialized,
            model: this.modelName,
            cache: this.responseCache.stats()
        };
    }

    async ensureInitialized() {
        if (this.initialized && this.model) {
            return true;
        }

        if (!this.apiKey) {
            return false;
        }

        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = this.genAI.getGenerativeModel({
            model: this.modelName
        });
        this.initialized = true;
        return true;
    }

    async askQuestion(question, language = 'English', userContext = null) {
        const normalizedLanguage = normalizeLanguageName(language);
        const cacheKey = JSON.stringify({
            question: question.toLowerCase(),
            language: normalizedLanguage,
            context: userContext
        });

        const cachedAnswer = this.responseCache.get(cacheKey);
        if (cachedAnswer) {
            return cachedAnswer;
        }

        const targetLanguageCode = normalizeLanguageCode(normalizedLanguage);
        const shouldTranslate = targetLanguageCode !== 'en' && this.googleCloudService?.canTranslate?.();
        const knowledgeContext = await this.knowledgeBaseService.getRelevantContext(question, { limit: 4 });

        let answer = await this.generateAnswer({
            question,
            responseLanguage: shouldTranslate ? 'English' : normalizedLanguage,
            userContext,
            knowledgeContext
        });

        if (shouldTranslate) {
            let translatedAnswer = null;

            try {
                translatedAnswer = await this.googleCloudService.translateText(answer, targetLanguageCode, 'en');
            } catch (error) {
                console.warn('Translation fallback failed:', error.message);
            }

            if (translatedAnswer) {
                answer = translatedAnswer;
            } else {
                answer = await this.generateAnswer({
                    question,
                    responseLanguage: normalizedLanguage,
                    userContext,
                    knowledgeContext
                });
            }
        }

        this.responseCache.set(cacheKey, answer);
        return answer;
    }

    async generateAnswer({ question, responseLanguage, userContext, knowledgeContext }) {
        try {
            const isReady = await this.ensureInitialized();
            if (!isReady) {
                return 'AI service is currently unavailable. Please check server configuration.';
            }

            const prompt = buildPrompt({
                question,
                responseLanguage,
                userContext,
                knowledgeContext
            });

            const result = await this.model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            });

            return result.response.text()?.trim() || 'No response generated.';
        } catch (error) {
            console.error('Gemini API error:', error.message);
            return 'AI service error. Please try again later.';
        }
    }
}
