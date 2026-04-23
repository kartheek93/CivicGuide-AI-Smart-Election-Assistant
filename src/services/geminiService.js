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
                model: "gemini-2.5-flash", // safest + fastest model
            });

            this.initialized = true;
            console.log("✅ Gemini initialized successfully");
        } catch (error) {
            console.error("❌ Gemini Initialization Failed:", error.message);
            this.initialized = false;
        }
    }

    async askQuestion(question) {
        try {
            // Ensure initialization
            if (!this.initialized || !this.model) {
                this.init();
            }

            if (!this.model) {
                return "AI service is currently unavailable. Please check server configuration.";
            }

            const prompt = `
You are CivicGuide AI, an intelligent election assistant focused on Indian elections.

Your role:
- Explain election processes clearly
- Help first-time voters understand steps
- Answer questions using simple language

Rules:
- Stay politically neutral
- Do not promote any candidate or party
- Use bullet points and structured format
- Keep answers concise and practical

KNOWLEDGE BASE:
${knowledgeBaseContext}

Question: ${question}
`;

            const result = await this.model.generateContent({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: prompt }],
                    },
                ],
            });

            const response = result.response.text();

            return response || "No response generated.";

        } catch (error) {
            console.error("❌ Gemini API Error:", {
                message: error.message,
                status: error.status,
            });

            // 🔥 Smart error messages (helps debugging fast)
            if (error.status === 404) {
                return "Model not found. Please verify model name or API access.";
            }

            if (error.status === 403) {
                return "API key issue or permission denied.";
            }

            return "AI service error. Please try again later.";
        }
    }
}

export default new GeminiService();