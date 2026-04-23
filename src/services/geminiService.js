import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let knowledgeBaseContext = "";
try {
    const kbPath = path.join(__dirname, '..', 'data', 'knowledgeBase.txt');
    knowledgeBaseContext = fs.readFileSync(kbPath, 'utf8');
} catch (err) {
    console.warn("Knowledge base file not found or couldn't be read.");
}

class GeminiService {
    constructor() {
        this.genAI = null;
        this.model = null;
        this.initialized = false;
    }

    init() {
        try {
            if (!process.env.GEMINI_API_KEY) {
                throw new Error("GEMINI_API_KEY is not set in environment variables.");
            }

            console.log("✅ Initializing Gemini...");

            this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

            this.model = this.genAI.getGenerativeModel({
                model: "gemini-2.5-flash", 
            });

            this.initialized = true;
            console.log("✅ Gemini initialized successfully");
        } catch (error) {
            console.error("❌ Gemini Initialization Failed:", error.message);
            this.initialized = false;
        }
    }

    /**
     * @param {string} question 
     * @param {string} language - The current UI language
     * @param {object} userContext - Context from the eligibility checker
     */
    async askQuestion(question, language = "English", userContext = null) {
        try {
            if (!this.initialized || !this.model) {
                this.init();
            }

            if (!this.model) {
                return "AI service is currently unavailable. Please check server configuration.";
            }

            // Building the personalized context string
            let contextInstruction = "";
            if (userContext && userContext.hasCheckedEligibility) {
                contextInstruction = `
USER CONTEXT:
- Age: ${userContext.age}
- Eligibility Status: ${userContext.isEligible ? 'Eligible' : 'Not Eligible'}
- Specific Feedback given: ${userContext.reason}
`;
            }

            const prompt = `
SYSTEM ROLE (Vertical: AI Election Coach):
You are the "CivicGuide AI Election Coach". Your mission is to provide personalized, intelligent, and logical guidance to voters in India.

RULES:
1. Stay politically neutral.
2. Use bullet points and a friendly coaching tone.
3. Keep answers under 150 words.
4. Respond in ${language}.

LOGICAL DECISION MAKING:
Use the provided USER CONTEXT to tailor your advice. If the user is ineligible (e.g., underage), logically explain what they can do (e.g., register later).

${contextInstruction}

KNOWLEDGE BASE:
${knowledgeBaseContext}

USER QUESTION: ${question}
`;

            const result = await this.model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            });

            return result.response.text() || "No response generated.";

        } catch (error) {
            console.error("❌ Gemini API Error:", error.message);
            return "AI service error. Please try again later.";
        }
    }
}

export default new GeminiService();