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
    if (typeof question !== 'string') return false;
    const trimmed = question.trim();
    return trimmed.length > 0 && trimmed.length <= 500;
};
