/**
 * Validates the age input for the eligibility checker.
 * @param {string|number} age 
 * @returns {boolean}
 */
export const isValidAge = (age) => {
    const parsedAge = parseInt(age, 10);
    return !isNaN(parsedAge) && parsedAge >= 0 && parsedAge <= 130;
};

/**
 * Validates the AI question input to prevent extremely long or malicious inputs.
 * @param {string} question 
 * @returns {boolean}
 */
export const isValidQuestion = (question) => {
    return typeof question === 'string' && question.trim().length > 0 && question.length <= 500;
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
