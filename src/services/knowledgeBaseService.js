import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_KNOWLEDGE_BASE_PATH = path.join(__dirname, '..', 'data', 'knowledgeBase.txt');

const STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'do', 'for', 'from', 'how',
    'i', 'if', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'or', 'the', 'to', 'what',
    'when', 'where', 'who', 'why', 'with', 'will', 'your'
]);

const tokenize = (value) => {
    return String(value ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
};

const parseSections = (content) => {
    const sections = [];
    let currentTitle = 'Overview';
    let currentBody = [];

    for (const line of content.split(/\r?\n/)) {
        if (line.startsWith('## ')) {
            if (currentBody.length) {
                sections.push({
                    title: currentTitle,
                    body: currentBody.join('\n').trim()
                });
            }

            currentTitle = line.replace(/^##\s+/, '').trim();
            currentBody = [];
            continue;
        }

        if (line.trim().length) {
            currentBody.push(line);
        }
    }

    if (currentBody.length) {
        sections.push({
            title: currentTitle,
            body: currentBody.join('\n').trim()
        });
    }

    return sections.filter((section) => section.body.length);
};

const scoreSection = (section, questionTokens) => {
    const titleTokens = tokenize(section.title);
    const bodyTokens = tokenize(section.body);
    const titleMatches = questionTokens.filter((token) => titleTokens.includes(token)).length;
    const bodyMatches = questionTokens.filter((token) => bodyTokens.includes(token)).length;
    return (titleMatches * 3) + bodyMatches;
};

export class KnowledgeBaseService {
    constructor({ filePath = DEFAULT_KNOWLEDGE_BASE_PATH, maxRelevantSections = 4 } = {}) {
        this.filePath = filePath;
        this.maxRelevantSections = maxRelevantSections;
        this.cachedContent = '';
        this.cachedSections = [];
        this.cachedMtimeMs = 0;
    }

    async refreshIfNeeded(force = false) {
        const stat = await fs.stat(this.filePath);
        if (!force && this.cachedContent && this.cachedMtimeMs === stat.mtimeMs) {
            return {
                content: this.cachedContent,
                sections: this.cachedSections
            };
        }

        const content = (await fs.readFile(this.filePath, 'utf8')).trim();
        this.cachedContent = content;
        this.cachedSections = parseSections(content);
        this.cachedMtimeMs = stat.mtimeMs;

        return {
            content: this.cachedContent,
            sections: this.cachedSections
        };
    }

    async getFullContext() {
        const { content } = await this.refreshIfNeeded();
        return content;
    }

    async getRelevantContext(question, { limit = this.maxRelevantSections } = {}) {
        const { content, sections } = await this.refreshIfNeeded();
        const questionTokens = tokenize(question);

        if (!questionTokens.length) {
            return sections
                .slice(0, limit)
                .map((section) => `## ${section.title}\n${section.body}`)
                .join('\n\n');
        }

        const rankedSections = sections
            .map((section) => ({ section, score: scoreSection(section, questionTokens) }))
            .filter((item) => item.score > 0)
            .sort((left, right) => right.score - left.score)
            .slice(0, limit)
            .map((item) => item.section);

        if (!rankedSections.length) {
            return content;
        }

        return rankedSections
            .map((section) => `## ${section.title}\n${section.body}`)
            .join('\n\n');
    }

    getStats() {
        return {
            loaded: Boolean(this.cachedContent),
            sectionCount: this.cachedSections.length,
            cachedBytes: Buffer.byteLength(this.cachedContent || '', 'utf8')
        };
    }
}
