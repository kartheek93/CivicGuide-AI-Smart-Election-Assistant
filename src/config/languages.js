const LANGUAGE_NAME_BY_CODE = {
    en: 'English',
    hi: 'Hindi',
    te: 'Telugu',
    ta: 'Tamil',
    mr: 'Marathi'
};

const INPUT_TO_CODE = {
    english: 'en',
    en: 'en',
    hindi: 'hi',
    hi: 'hi',
    telugu: 'te',
    te: 'te',
    tamil: 'ta',
    ta: 'ta',
    marathi: 'mr',
    mr: 'mr'
};

export const SUPPORTED_LANGUAGE_CODES = new Set(Object.keys(LANGUAGE_NAME_BY_CODE));
export const SUPPORTED_LANGUAGE_NAMES = new Set(Object.values(LANGUAGE_NAME_BY_CODE));

export const normalizeLanguageCode = (value) => {
    const normalized = String(value ?? '').trim().toLowerCase();
    return INPUT_TO_CODE[normalized] || 'en';
};

export const normalizeLanguageName = (value) => LANGUAGE_NAME_BY_CODE[normalizeLanguageCode(value)];

export const isSupportedLanguage = (value) => {
    const normalized = String(value ?? '').trim().toLowerCase();
    return Boolean(INPUT_TO_CODE[normalized]);
};

export const getSpeechLanguageCode = (value) => {
    const code = normalizeLanguageCode(value);
    return `${code}-IN`;
};
