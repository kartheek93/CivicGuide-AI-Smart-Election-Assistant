/**
 * Validates the age input for the eligibility checker.
 * @param {string|number} age 
 * @returns {boolean}
 */
export const MAX_QUESTION_LENGTH = 500;
export const MAX_SPEECH_TEXT_LENGTH = 1500;

export const isValidAge = (age) => {
    if (typeof age === 'string' && age.trim() === '') return false;
    const parsedAge = Number(age);
    return Number.isFinite(parsedAge) && parsedAge >= 0 && parsedAge <= 130;
};

/**
 * Normalizes free text by removing control characters and collapsing whitespace.
 * @param {string} input
 * @returns {string}
 */
export const normalizeInput = (input) => {
    if (typeof input !== 'string') {
        return '';
    }

    return input
        .replace(/[\u0000-\u001f\u007f]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Validates the AI question input to prevent extremely long or malicious inputs.
 * @param {string} question 
 * @returns {boolean}
 */
export const isValidQuestion = (question) => {
    const normalized = normalizeInput(question);
    return normalized.length > 0 && normalized.length <= MAX_QUESTION_LENGTH;
};

/**
 * Validates text intended for speech synthesis.
 * @param {string} text
 * @returns {boolean}
 */
export const isValidSpeechText = (text) => {
    const normalized = normalizeInput(text);
    return normalized.length > 0 && normalized.length <= MAX_SPEECH_TEXT_LENGTH;
};

/**
 * Basic sanitization to prevent simple XSS/Injection
 * @param {string} input 
 * @returns {string}
 */
export const sanitizeInput = (input) => {
    if (!input) return "";
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .trim();
};
