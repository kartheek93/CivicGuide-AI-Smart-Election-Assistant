const parseJson = async (response) => {
    try {
        return await response.json();
    } catch {
        return {};
    }
};

const buildAuthHeaders = (token) => {
    return token
        ? { Authorization: `Bearer ${token}` }
        : {};
};

const postJson = async (url, payload, { token = '' } = {}) => {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...buildAuthHeaders(token)
        },
        body: JSON.stringify(payload)
    });

    const data = await parseJson(response);

    if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
};

export const fetchHealthStatus = async () => {
    const response = await fetch('/api/health', {
        headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
        throw new Error(`Health request failed with ${response.status}`);
    }

    return response.json();
};

export const loginUser = (password) => {
    return postJson('/api/login', { password });
};

export const askCoachQuestion = ({ question, language, context, token = '' }) => {
    return postJson('/api/ask', {
        question,
        language,
        context
    }, { token });
};

export const requestSpeechAudio = ({ text, language, token = '' }) => {
    return postJson('/api/speak', {
        text,
        language
    }, { token });
};
