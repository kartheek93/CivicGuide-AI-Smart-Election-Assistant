import { checkEligibility } from '../services/electionService.js';
import { isValidAge, isValidQuestion, sanitizeInput } from '../utils/validators.js';
import { askCoachQuestion, fetchHealthStatus, loginUser, requestSpeechAudio } from './apiClient.js';
import { icons } from './icons.js';
import { createSpeechPlayer } from './speechPlayer.js';
import { createViewRenderer } from './viewRenderer.js';

const DEFAULT_LANG = 'en';
const LANGUAGE_STORAGE_KEY = 'civicguide.language';
const AUTH_TOKEN_KEY = 'authToken';
const RTL_LANGS = new Set(['ar', 'fa', 'he', 'ur']);
const NAV_ITEMS = ['welcome', 'vote', 'eligibility', 'timeline', 'knowledge', 'ai'];

const state = {
    translations: {},
    lang: DEFAULT_LANG,
    authRequired: true,
    navItems: NAV_ITEMS,
    activeSection: 'welcome',
    isMenuOpen: false,
    isAiLoading: false,
    speakingMessageIndex: null,
    speechLoadingMessageIndex: null,
    hasPledged: false,
    knowledgeRenderToken: 0,
    eligibilityForm: {
        age: '',
        citizenship: '',
        registration: ''
    },
    userContext: {
        hasCheckedEligibility: false,
        age: null,
        citizenship: null,
        registration: null,
        isEligible: null,
        reasons: []
    },
    chatMessages: [
        {
            role: 'assistant',
            key: 'sections.ai.welcomeMessage'
        }
    ]
};

const speechPlayer = createSpeechPlayer({
    onPlaybackStateChange: ({ messageIndex, isPlaying }) => {
        state.speakingMessageIndex = isPlaying ? messageIndex : null;
        renderAiSection();
    }
});

const viewRenderer = createViewRenderer({
    state,
    icons,
    t,
    collection,
    escapeHtml,
    escapeAttribute,
    formatCoachAnswer,
    getEligibilityView,
    getSpeechControlState,
    scrollChatToBottom
});

const {
    renderNav,
    syncActiveSection,
    renderWelcomeSection,
    renderVoteSection,
    renderEligibilitySection,
    renderTimelineSection,
    renderKnowledgeSection,
    renderAiSection
} = viewRenderer;

document.addEventListener('DOMContentLoaded', init);

async function init() {
    state.translations = await loadTranslations();
    state.lang = getInitialLanguage();
    state.authRequired = await loadAuthRequirement();
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    renderLanguageSelectors();
    applyLanguage();
    renderLayout();
    bindEvents();

    if (!state.authRequired) {
        showApp();
    }
}

async function loadTranslations() {
    try {
        const response = await fetch('/data/translations.json', {
            headers: { Accept: 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Translation request failed with ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Unable to load translations:', error);
        return {
            en: {
                language: { nativeName: 'English', englishName: 'English' },
                meta: {
                    title: 'CivicGuide AI - Smart Election Assistant',
                    description: 'Trusted election guidance.'
                },
                brand: {
                    name: 'CivicGuide AI',
                    tagline: 'Election guidance platform',
                    department: 'Citizen Election Assistant'
                },
                accessibility: { skipLink: 'Skip to main content' },
                login: {
                    portalLabel: 'Secure Admin Portal',
                    subtitle: 'A trusted digital assistant for Indian election guidance.',
                    passwordLabel: 'Administrator password',
                    help: 'Enter your authorized administrator credential to continue.',
                    button: 'Enter secure portal',
                    loading: 'Verifying access...'
                },
                topbar: {
                    languageLabel: 'Language',
                    admin: 'Admin',
                    profileAria: 'Admin profile'
                },
                nav: {
                    primaryAria: 'Primary navigation',
                    openMenu: 'Open menu',
                    closeMenu: 'Close menu',
                    items: {}
                },
                footer: {
                    description: 'Trusted, accessible election guidance for every citizen.',
                    eci: 'Election Commission of India',
                    voterPortal: 'Voter Services Portal'
                },
                sections: {}
            }
        };
    }
}

async function loadAuthRequirement() {
    try {
        const data = await fetchHealthStatus();
        return data?.services?.authRequired !== false;
    } catch (error) {
        console.warn('Unable to detect auth mode:', error);
        return true;
    }
}

function getInitialLanguage() {
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return state.translations[storedLanguage] ? storedLanguage : DEFAULT_LANG;
}

function bindEvents() {
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('submit', handleDocumentSubmit);
    document.addEventListener('input', handleDocumentInput);
    document.addEventListener('change', handleDocumentChange);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && state.isMenuOpen) {
            setMenuOpen(false);
        }
    });
}

function handleDocumentClick(event) {
    const menuButton = event.target.closest('#menu-toggle');
    if (menuButton) {
        setMenuOpen(!state.isMenuOpen);
        return;
    }

    if (event.target.closest('#sidebar-backdrop')) {
        setMenuOpen(false);
        return;
    }

    const navTarget = event.target.closest('[data-nav-target]');
    if (navTarget) {
        showSection(navTarget.dataset.navTarget);
        return;
    }

    const pledgeButton = event.target.closest('[data-action="pledge"]');
    if (pledgeButton) {
        state.hasPledged = true;
        renderWelcomeSection();
        return;
    }

    const clearChatButton = event.target.closest('[data-action="clear-chat"]');
    if (clearChatButton) {
        speechPlayer.stop();
        state.chatMessages = [{ role: 'assistant', key: 'sections.ai.welcomeMessage' }];
        renderAiSection();
        return;
    }

    const quickAction = event.target.closest('[data-quick-question]');
    if (quickAction) {
        const input = document.getElementById('question');
        if (input) {
            input.value = quickAction.dataset.quickQuestion;
            updateQuestionCount(input.value.length);
            input.focus();
        }
        return;
    }

    const speechAction = event.target.closest('[data-action="speak-message"]');
    if (speechAction) {
        const messageIndex = Number.parseInt(speechAction.dataset.messageIndex || '-1', 10);
        if (Number.isInteger(messageIndex) && messageIndex >= 0) {
            handleMessageSpeech(messageIndex);
        }
    }
}

function handleDocumentSubmit(event) {
    if (event.target.matches('#login-form')) {
        event.preventDefault();
        handleLogin(event.target);
        return;
    }

    if (event.target.matches('#eligibility-form')) {
        event.preventDefault();
        handleEligibilitySubmit(event.target);
        return;
    }

    if (event.target.matches('#ai-form')) {
        event.preventDefault();
        handleAiSubmit(event.target);
    }
}

function handleDocumentInput(event) {
    if (event.target.closest('#eligibility-form')) {
        state.eligibilityForm[event.target.name] = event.target.value;
    }

    if (event.target.matches('#question')) {
        updateQuestionCount(event.target.value.length);
    }
}

function handleDocumentChange(event) {
    if (event.target.matches('#language-selector, #login-language')) {
        changeLanguage(event.target.value);
    }
}

async function handleLogin(form) {
    const password = form.password.value;
    setLoginLoading(true);
    hideLoginError();

    try {
        const data = await loginUser(password);

        if (!data.success) {
            showLoginError(data.error || t('errors.loginInvalid'));
            return;
        }

        if (data.token) {
            sessionStorage.setItem(AUTH_TOKEN_KEY, data.token);
        } else {
            sessionStorage.removeItem(AUTH_TOKEN_KEY);
        }
        showApp();
    } catch (error) {
        showLoginError(t('errors.network'));
    } finally {
        setLoginLoading(false);
    }
}

function setLoginLoading(isLoading) {
    const button = document.getElementById('login-submit');
    const label = button?.querySelector('.button__label');
    const form = document.getElementById('login-form');

    if (!button || !label || !form) {
        return;
    }

    button.disabled = isLoading;
    button.classList.toggle('is-loading', isLoading);
    button.setAttribute('aria-busy', String(isLoading));
    label.textContent = isLoading ? t('login.loading') : t('login.button');
    form.password.disabled = isLoading;
}

function showLoginError(message) {
    const errorBox = document.getElementById('login-error');
    if (!errorBox) {
        return;
    }

    errorBox.textContent = message;
    errorBox.hidden = false;
}

function hideLoginError() {
    const errorBox = document.getElementById('login-error');
    if (!errorBox) {
        return;
    }

    errorBox.hidden = true;
    errorBox.textContent = '';
}

function showApp() {
    const loginPage = document.getElementById('login-page');
    const app = document.getElementById('app');

    loginPage?.classList.add('is-hidden');
    app?.classList.remove('is-hidden');
    app?.removeAttribute('aria-hidden');
    document.getElementById('main-content')?.focus({ preventScroll: true });
}

function renderLayout() {
    renderNav();
    renderWelcomeSection();
    renderVoteSection();
    renderEligibilitySection();
    renderTimelineSection();
    renderKnowledgeSection(false);
    renderAiSection();
    syncActiveSection();
}

function applyLanguage() {
    const html = document.documentElement;
    html.lang = state.lang;
    html.dir = RTL_LANGS.has(state.lang) ? 'rtl' : 'ltr';
    document.title = t('meta.title');

    const description = document.querySelector('meta[name="description"]');
    if (description) {
        description.setAttribute('content', t('meta.description'));
    }

    document.querySelectorAll('[data-i18n]').forEach((element) => {
        element.textContent = t(element.dataset.i18n);
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
        element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
    });

    document.getElementById('sidebar')?.setAttribute('aria-label', t('nav.primaryAria'));
    document.getElementById('primary-nav')?.setAttribute('aria-label', t('nav.primaryAria'));
    document.getElementById('language-selector')?.setAttribute('aria-label', t('topbar.languageLabel'));
    document.getElementById('login-language')?.setAttribute('aria-label', t('topbar.languageLabel'));
    setMenuOpen(state.isMenuOpen);
}

function changeLanguage(lang) {
    state.lang = state.translations[lang] ? lang : DEFAULT_LANG;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, state.lang);
    renderLanguageSelectors();
    applyLanguage();
    renderLayout();

    if (state.activeSection === 'knowledge') {
        renderKnowledgeSection(true);
    }
}

function renderLanguageSelectors() {
    const options = Object.entries(state.translations)
        .map(([code, messages]) => {
            const label = messages.language?.nativeName || messages.language?.englishName || code.toUpperCase();
            return `<option value="${escapeAttribute(code)}">${escapeHtml(label)}</option>`;
        })
        .join('');

    document.querySelectorAll('#language-selector, #login-language').forEach((selector) => {
        selector.innerHTML = options;
        selector.value = state.lang;
    });
}

function showSection(sectionKey) {
    if (!NAV_ITEMS.includes(sectionKey)) {
        return;
    }

    if (sectionKey !== 'ai' && speechPlayer.isPlaying(state.speakingMessageIndex)) {
        speechPlayer.stop();
    }

    state.activeSection = sectionKey;
    syncActiveSection();
    renderNav();
    setMenuOpen(false);

    if (sectionKey === 'knowledge') {
        renderKnowledgeSection(true);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.setTimeout(() => {
        document.getElementById('main-content')?.focus({ preventScroll: true });
    }, 80);
}

function setMenuOpen(isOpen) {
    state.isMenuOpen = isOpen;
    const app = document.getElementById('app');
    const button = document.getElementById('menu-toggle');
    const backdrop = document.getElementById('sidebar-backdrop');

    app?.classList.toggle('menu-open', isOpen);
    document.body.classList.toggle('menu-open', isOpen);
    button?.setAttribute('aria-expanded', String(isOpen));
    button?.setAttribute('aria-label', t(isOpen ? 'nav.closeMenu' : 'nav.openMenu'));

    if (backdrop) {
        backdrop.hidden = !isOpen;
    }
}

function handleEligibilitySubmit(form) {
    const formData = new FormData(form);
    const age = String(formData.get('age') || '').trim();
    const citizenship = String(formData.get('citizenship') || '');
    const registration = String(formData.get('registration') || '');

    state.eligibilityForm = { age, citizenship, registration };

    if (!isValidAge(age) || Number(age) < 1) {
        state.userContext = {
            ...state.userContext,
            hasCheckedEligibility: true,
            isEligible: false,
            reasons: [t('sections.eligibility.results.invalidAge')]
        };
        renderEligibilitySection();
        return;
    }

    if (!citizenship || !registration) {
        state.userContext = {
            ...state.userContext,
            hasCheckedEligibility: true,
            isEligible: false,
            reasons: [t('sections.eligibility.results.missingFields')]
        };
        renderEligibilitySection();
        return;
    }

    const parsedAge = Number(age);
    const result = checkEligibility(parsedAge, citizenship, registration);
    state.userContext = {
        hasCheckedEligibility: true,
        age: parsedAge,
        citizenship,
        registration,
        isEligible: result.eligible,
        reasons: getEligibilityReasons(parsedAge, citizenship, registration, result.eligible)
    };

    renderEligibilitySection();
    renderWelcomeSection();
}

async function handleAiSubmit(form) {
    if (state.isAiLoading) {
        return;
    }

    const input = form.question;
    const question = input.value.trim();

    if (!isValidQuestion(question)) {
        state.chatMessages.push({
            role: 'assistant',
            content: t('errors.invalidQuestion')
        });
        renderAiSection();
        return;
    }

    state.chatMessages.push({ role: 'user', content: question });
    state.isAiLoading = true;
    renderAiSection();

    try {
        const data = await askCoachQuestion({
            question,
            language: t('language.englishName'),
            context: state.userContext,
            token: sessionStorage.getItem(AUTH_TOKEN_KEY) || ''
        });

        state.chatMessages.push({
            role: 'assistant',
            content: data.answer || t('sections.ai.emptyResponse')
        });
    } catch (error) {
        state.chatMessages.push({
            role: 'assistant',
            content: t('errors.coachOffline')
        });
    } finally {
        state.isAiLoading = false;
        renderAiSection();
    }
}

async function handleMessageSpeech(messageIndex) {
    const message = state.chatMessages[messageIndex];
    if (!message || message.role !== 'assistant') {
        return;
    }

    if (speechPlayer.isPlaying(messageIndex)) {
        speechPlayer.stop();
        return;
    }

    if (state.speechLoadingMessageIndex === messageIndex) {
        return;
    }

    state.speechLoadingMessageIndex = messageIndex;
    renderAiSection();

    try {
        const audio = await requestSpeechAudio({
            text: getMessageText(message),
            language: t('language.englishName'),
            token: sessionStorage.getItem(AUTH_TOKEN_KEY) || ''
        });

        await speechPlayer.play({
            audioContent: audio.audioContent,
            mimeType: audio.mimeType,
            messageIndex
        });
    } catch (error) {
        state.chatMessages.push({
            role: 'assistant',
            content: t('errors.speechUnavailable')
        });
    } finally {
        state.speechLoadingMessageIndex = null;
        renderAiSection();
    }
}

function getMessageText(message) {
    return message.key ? t(message.key) : String(message.content || '');
}

function getSpeechControlState(messageIndex) {
    return {
        canSpeak: true,
        isLoading: state.speechLoadingMessageIndex === messageIndex,
        isPlaying: state.speakingMessageIndex === messageIndex,
        label: state.speechLoadingMessageIndex === messageIndex
            ? t('sections.ai.audioLoading')
            : state.speakingMessageIndex === messageIndex
                ? t('sections.ai.stopAudio')
                : t('sections.ai.listen')
    };
}

function updateQuestionCount(count) {
    const counter = document.getElementById('question-count');
    if (counter) {
        counter.textContent = t('sections.ai.characterCount', { count, max: 500 });
    }
}

function getEligibilityView() {
    if (!state.userContext.hasCheckedEligibility) {
        return {
            isEligible: false,
            badge: t('sections.welcome.status.notCheckedBadge'),
            title: t('sections.welcome.status.emptyTitle'),
            summary: t('sections.welcome.status.emptySummary')
        };
    }

    if (state.userContext.isEligible) {
        return {
            isEligible: true,
            badge: t('sections.welcome.status.eligibleBadge'),
            title: t('sections.eligibility.results.eligibleTitle'),
            summary: t('sections.eligibility.results.eligible')
        };
    }

    const reasons = state.userContext.reasons?.length
        ? state.userContext.reasons
        : [t('sections.eligibility.results.reviewDetails')];

    return {
        isEligible: false,
        badge: t('sections.welcome.status.needsActionBadge'),
        title: t('sections.eligibility.results.notEligibleTitle'),
        summary: reasons.join(' ')
    };
}

function getEligibilityReasons(age, citizenship, registration, isEligible) {
    if (isEligible) {
        return [t('sections.eligibility.results.eligible')];
    }

    const reasons = [];
    if (age < 18) {
        reasons.push(t('sections.eligibility.results.age'));
    }

    if (citizenship !== 'indian-citizen') {
        reasons.push(t('sections.eligibility.results.citizenship'));
    }

    if (age >= 18 && citizenship === 'indian-citizen' && registration !== 'registered') {
        reasons.push(t('sections.eligibility.results.registration'));
    }

    return reasons.length ? reasons : [t('sections.eligibility.results.reviewDetails')];
}

function scrollChatToBottom() {
    window.requestAnimationFrame(() => {
        const history = document.getElementById('chat-history');
        if (history) {
            history.scrollTop = history.scrollHeight;
        }
    });
}

function formatCoachAnswer(value) {
    const safe = escapeHtml(value || t('sections.ai.emptyResponse'));
    return safe
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}

function t(path, vars = {}) {
    const current = getByPath(state.translations[state.lang], path);
    const fallback = getByPath(state.translations[DEFAULT_LANG], path);
    const value = current ?? fallback ?? path;

    if (typeof value !== 'string') {
        return value;
    }

    return value.replace(/\{(\w+)\}/g, (_, key) => {
        const replacement = vars[key];
        return replacement === undefined || replacement === null ? '' : String(replacement);
    });
}

function collection(path) {
    const value = t(path);
    return Array.isArray(value) ? value : [];
}

function getByPath(source, path) {
    return path.split('.').reduce((value, key) => {
        if (value && Object.prototype.hasOwnProperty.call(value, key)) {
            return value[key];
        }
        return undefined;
    }, source);
}

function escapeHtml(value) {
    return sanitizeInput(String(value ?? ''));
}

function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#096;');
}
