import { checkEligibility, getElectionSteps } from '../services/electionService.js';
import { isValidAge, isValidQuestion, sanitizeInput } from '../utils/validators.js';

const DEFAULT_LANG = 'en';
const LANGUAGE_STORAGE_KEY = 'civicguide.language';
const AUTH_TOKEN_KEY = 'authToken';
const RTL_LANGS = new Set(['ar', 'fa', 'he', 'ur']);
const NAV_ITEMS = ['welcome', 'vote', 'eligibility', 'timeline', 'knowledge', 'ai'];

const state = {
    translations: {},
    lang: DEFAULT_LANG,
    activeSection: 'welcome',
    isMenuOpen: false,
    isAiLoading: false,
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

const icons = {
    welcome: svgIcon('<path d="M3 10.75 12 3l9 7.75"/><path d="M5.5 10.5V21h13V10.5"/><path d="M9.5 21v-6h5v6"/>'),
    vote: svgIcon('<path d="M9 11.5 11.4 14 16 8.5"/><path d="M4 5h16v14H4z"/><path d="M8 5V3h8v2"/>'),
    eligibility: svgIcon('<path d="M12 3 5 6v5c0 4.55 2.91 8.42 7 9.8 4.09-1.38 7-5.25 7-9.8V6z"/><path d="m9 12 2 2 4-5"/>'),
    timeline: svgIcon('<path d="M7 3v4"/><path d="M17 3v4"/><path d="M4.5 8h15"/><path d="M5 5h14v16H5z"/><path d="M8 12h3"/><path d="M13 12h3"/><path d="M8 16h3"/>'),
    knowledge: svgIcon('<path d="M5 4.5h10.5A3.5 3.5 0 0 1 19 8v12.5H8.5A3.5 3.5 0 0 0 5 17z"/><path d="M5 4.5V17"/><path d="M9 8h6"/><path d="M9 12h6"/>'),
    ai: svgIcon('<path d="M8 9h8"/><path d="M9 14h.01"/><path d="M15 14h.01"/><path d="M12 4v2"/><path d="M7 6h10a3 3 0 0 1 3 3v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9a3 3 0 0 1 3-3z"/>'),
    send: svgIcon('<path d="m4 12 16-8-5 16-3-7z"/><path d="m12 13-3 4"/>'),
    arrow: svgIcon('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>'),
    shield: svgIcon('<path d="M12 3 5 6v5c0 4.55 2.91 8.42 7 9.8 4.09-1.38 7-5.25 7-9.8V6z"/>'),
    spark: svgIcon('<path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="m5.6 5.6 2.8 2.8"/><path d="m15.6 15.6 2.8 2.8"/><path d="m18.4 5.6-2.8 2.8"/><path d="m8.4 15.6-2.8 2.8"/>'),
    check: svgIcon('<path d="m5 13 4 4L19 7"/>')
};

document.addEventListener('DOMContentLoaded', init);

async function init() {
    state.translations = await loadTranslations();
    state.lang = getInitialLanguage();
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    renderLanguageSelectors();
    applyLanguage();
    renderLayout();
    bindEvents();
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
    const errorBox = document.getElementById('login-error');
    setLoginLoading(true);
    hideLoginError();

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            showLoginError(data.error || t('errors.loginInvalid'));
            return;
        }

        sessionStorage.setItem(AUTH_TOKEN_KEY, data.token);
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

function renderNav() {
    const nav = document.getElementById('primary-nav');
    if (!nav) {
        return;
    }

    nav.innerHTML = NAV_ITEMS.map((item) => {
        const label = t(`nav.items.${item}.label`);
        const description = t(`nav.items.${item}.description`);
        const isActive = state.activeSection === item;

        return `
            <button class="nav-button" type="button" data-nav-target="${item}" aria-current="${isActive ? 'page' : 'false'}" title="${escapeAttribute(label)}">
                <span class="nav-button__icon" aria-hidden="true">${icons[item]}</span>
                <span class="nav-button__text">
                    <strong>${escapeHtml(label)}</strong>
                    <span>${escapeHtml(description)}</span>
                </span>
            </button>
        `;
    }).join('');
}

function showSection(sectionKey) {
    if (!NAV_ITEMS.includes(sectionKey)) {
        return;
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

function syncActiveSection() {
    document.querySelectorAll('.page-section').forEach((section) => {
        section.classList.toggle('is-active', section.dataset.section === state.activeSection);
    });
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

function renderWelcomeSection() {
    const section = document.getElementById('section-welcome');
    if (!section) {
        return;
    }

    const metrics = collection('sections.welcome.metrics');
    const cards = collection('sections.welcome.cards');

    section.innerHTML = `
        <div class="section-stack">
            <article class="hero-card">
                <img class="hero-card__image" src="/assets/hero.png" alt="${escapeAttribute(t('sections.welcome.heroAlt'))}" loading="eager" decoding="async" fetchpriority="high">
                <div class="hero-card__overlay" aria-hidden="true"></div>
                <div class="hero-card__content">
                    <span class="eyebrow">${escapeHtml(t('brand.department'))}</span>
                    <h2 id="welcome-title">${escapeHtml(t('sections.welcome.title'))}</h2>
                    <p>${escapeHtml(t('sections.welcome.subtitle'))}</p>
                    <div class="hero-card__actions">
                        <button class="button button--secondary" type="button" data-nav-target="eligibility">
                            ${escapeHtml(t('sections.welcome.primaryCta'))}
                            <span aria-hidden="true">${icons.arrow}</span>
                        </button>
                        <button class="button button--ghost" type="button" data-nav-target="ai">${escapeHtml(t('sections.welcome.secondaryCta'))}</button>
                    </div>
                </div>
            </article>

            <div class="metric-strip" aria-label="${escapeAttribute(t('sections.welcome.metricsAria'))}">
                ${metrics.map((metric) => `
                    <div class="metric">
                        <strong>${escapeHtml(metric.value)}</strong>
                        <span>${escapeHtml(metric.label)}</span>
                    </div>
                `).join('')}
            </div>

            <div class="stats-grid">
                ${renderStatusCard()}
                ${cards.map((card, index) => renderFeatureCard(card, index)).join('')}
            </div>
        </div>
    `;
}

function renderStatusCard() {
    const status = getEligibilityView();
    const badgeClass = status.isEligible ? 'badge--success' : 'badge--warning';
    const pledgeText = state.hasPledged ? t('sections.welcome.status.pledged') : t('sections.welcome.status.pledge');

    return `
        <article class="status-card" aria-live="polite">
            <span class="status-card__badge ${badgeClass}">${escapeHtml(status.badge)}</span>
            <div>
                <h3>${escapeHtml(status.title)}</h3>
                <p class="status-card__summary">${escapeHtml(status.summary)}</p>
            </div>
            <button class="button ${state.hasPledged ? 'button--ghost' : 'button--secondary'}" type="button" data-action="pledge">
                ${escapeHtml(pledgeText)}
            </button>
        </article>
    `;
}

function renderFeatureCard(card, index) {
    const iconNames = ['shield', 'spark', 'check'];
    const icon = icons[iconNames[index % iconNames.length]];

    return `
        <article class="card">
            <span class="feature-icon" aria-hidden="true">${icon}</span>
            <h3>${escapeHtml(card.title)}</h3>
            <p>${escapeHtml(card.description)}</p>
        </article>
    `;
}

function renderVoteSection() {
    const section = document.getElementById('section-vote');
    if (!section) {
        return;
    }

    const translatedSteps = collection('sections.vote.steps');
    const fallbackSteps = getElectionSteps().map((step) => ({
        step: step.step,
        title: step.title,
        description: step.description
    }));
    const steps = translatedSteps.length ? translatedSteps : fallbackSteps;

    section.innerHTML = `
        <div class="section-stack">
            ${renderSectionHeading('vote')}
            <div class="card-grid">
                ${steps.map((step, index) => `
                    <article class="card step-card">
                        <span class="step-card__number" aria-label="${escapeAttribute(t('common.stepNumber', { number: index + 1 }))}">${escapeHtml(String(step.step || index + 1))}</span>
                        <div>
                            <h3>${escapeHtml(step.title)}</h3>
                            <p>${escapeHtml(step.description)}</p>
                        </div>
                    </article>
                `).join('')}
            </div>
        </div>
    `;
}

function renderEligibilitySection() {
    const section = document.getElementById('section-eligibility');
    if (!section) {
        return;
    }

    const citizenship = state.eligibilityForm.citizenship;
    const registration = state.eligibilityForm.registration;
    const result = state.userContext.hasCheckedEligibility ? getEligibilityView() : null;

    section.innerHTML = `
        <div class="section-stack">
            ${renderSectionHeading('eligibility')}
            <article class="form-card">
                <form id="eligibility-form" class="form-grid" novalidate>
                    <div class="field-group">
                        <label for="age">${escapeHtml(t('sections.eligibility.form.age'))}</label>
                        <input class="input" id="age" name="age" type="number" min="1" max="130" inputmode="numeric" required value="${escapeAttribute(state.eligibilityForm.age)}">
                    </div>
                    <div class="field-group">
                        <label for="citizenship">${escapeHtml(t('sections.eligibility.form.citizenship'))}</label>
                        <select class="select" id="citizenship" name="citizenship" required>
                            <option value="">${escapeHtml(t('sections.eligibility.form.selectPlaceholder'))}</option>
                            <option value="indian-citizen" ${citizenship === 'indian-citizen' ? 'selected' : ''}>${escapeHtml(t('sections.eligibility.form.indianCitizen'))}</option>
                            <option value="non-citizen" ${citizenship === 'non-citizen' ? 'selected' : ''}>${escapeHtml(t('sections.eligibility.form.nonCitizen'))}</option>
                        </select>
                    </div>
                    <div class="field-group">
                        <label for="registration">${escapeHtml(t('sections.eligibility.form.registration'))}</label>
                        <select class="select" id="registration" name="registration" required>
                            <option value="">${escapeHtml(t('sections.eligibility.form.selectPlaceholder'))}</option>
                            <option value="registered" ${registration === 'registered' ? 'selected' : ''}>${escapeHtml(t('sections.eligibility.form.registered'))}</option>
                            <option value="not-registered" ${registration === 'not-registered' ? 'selected' : ''}>${escapeHtml(t('sections.eligibility.form.notRegistered'))}</option>
                        </select>
                    </div>
                    <button class="button button--primary" type="submit">${escapeHtml(t('sections.eligibility.form.submit'))}</button>
                </form>
                <div id="eligibility-result" class="result-panel" role="status" aria-live="polite">
                    ${result ? renderEligibilityResult(result) : ''}
                </div>
            </article>
        </div>
    `;
}

function renderEligibilityResult(result) {
    return `
        <div class="alert ${result.isEligible ? 'alert--success' : 'alert--error'}">
            <strong>${escapeHtml(result.title)}</strong>
            <p>${escapeHtml(result.summary)}</p>
        </div>
    `;
}

function renderTimelineSection() {
    const section = document.getElementById('section-timeline');
    if (!section) {
        return;
    }

    const items = collection('sections.timeline.items');
    section.innerHTML = `
        <div class="section-stack">
            ${renderSectionHeading('timeline')}
            <article class="timeline-panel">
                <ol class="timeline-list">
                    ${items.map((item) => `
                        <li class="timeline-card">
                            <span class="timeline-card__dot" aria-hidden="true"></span>
                            <div>
                                <h3>${escapeHtml(item.title)}</h3>
                                <p>${escapeHtml(item.description)}</p>
                            </div>
                        </li>
                    `).join('')}
                </ol>
            </article>
        </div>
    `;
}

function renderKnowledgeSection(showSkeleton) {
    const section = document.getElementById('section-knowledge');
    if (!section) {
        return;
    }

    const token = ++state.knowledgeRenderToken;
    section.innerHTML = `
        <div class="section-stack">
            ${renderSectionHeading('knowledge')}
            <div id="knowledge-content" aria-live="polite">
                ${showSkeleton ? renderSkeletonGrid(4) : renderKnowledgeCards()}
            </div>
        </div>
    `;

    if (showSkeleton) {
        window.setTimeout(() => {
            if (token !== state.knowledgeRenderToken) {
                return;
            }

            const container = document.getElementById('knowledge-content');
            if (container) {
                container.innerHTML = renderKnowledgeCards();
            }
        }, 260);
    }
}

function renderKnowledgeCards() {
    const cards = collection('sections.knowledge.cards');
    return `
        <div class="knowledge-grid">
            ${cards.map((card, index) => `
                <article class="card">
                    <span class="feature-icon" aria-hidden="true">${index % 2 === 0 ? icons.knowledge : icons.shield}</span>
                    <span class="badge">${escapeHtml(card.category)}</span>
                    <h3>${escapeHtml(card.title)}</h3>
                    <p>${escapeHtml(card.description)}</p>
                </article>
            `).join('')}
        </div>
    `;
}

function renderSkeletonGrid(count) {
    return `
        <div class="skeleton-grid" aria-label="${escapeAttribute(t('common.loading'))}">
            ${Array.from({ length: count }, () => '<div class="skeleton-card"></div>').join('')}
        </div>
    `;
}

function renderAiSection() {
    const section = document.getElementById('section-ai');
    if (!section) {
        return;
    }

    const quickActions = collection('sections.ai.quickActions');
    section.innerHTML = `
        <div class="section-stack chat-layout">
            <div class="section-heading">
                <div class="section-heading__content">
                    <span class="section-icon" aria-hidden="true">${icons.ai}</span>
                    <div>
                        <h2 id="ai-title">${escapeHtml(t('sections.ai.title'))}</h2>
                        <p>${escapeHtml(t('sections.ai.subtitle'))}</p>
                    </div>
                </div>
                <button class="button button--ghost" type="button" data-action="clear-chat">${escapeHtml(t('sections.ai.clearChat'))}</button>
            </div>

            <article class="chat-panel" aria-label="${escapeAttribute(t('sections.ai.chatAria'))}">
                <div id="chat-history" class="chat-history" role="log" aria-live="polite" aria-relevant="additions">
                    ${state.chatMessages.map(renderChatMessage).join('')}
                </div>
                <div class="typing-indicator ${state.isAiLoading ? 'is-visible' : ''}" aria-live="polite">
                    <span class="typing-dots" aria-hidden="true"><span></span><span></span><span></span></span>
                    <span>${escapeHtml(t('sections.ai.typing'))}</span>
                </div>
                <div class="quick-actions" aria-label="${escapeAttribute(t('sections.ai.quickActionsAria'))}">
                    ${quickActions.map((action) => `
                        <button class="quick-action" type="button" data-quick-question="${escapeAttribute(action.prompt)}">${escapeHtml(action.label)}</button>
                    `).join('')}
                </div>
                <form id="ai-form" class="chat-composer" novalidate>
                    <div class="field-group">
                        <label class="visually-hidden" for="question">${escapeHtml(t('sections.ai.inputLabel'))}</label>
                        <textarea class="textarea" id="question" name="question" rows="3" maxlength="500" required placeholder="${escapeAttribute(t('sections.ai.placeholder'))}" ${state.isAiLoading ? 'disabled' : ''}></textarea>
                        <span id="question-count" class="form-hint">${escapeHtml(t('sections.ai.characterCount', { count: 0, max: 500 }))}</span>
                    </div>
                    <button class="button button--primary send-button" type="submit" ${state.isAiLoading ? 'disabled' : ''} aria-label="${escapeAttribute(t('sections.ai.send'))}">
                        <span class="send-icon" aria-hidden="true">${icons.send}</span>
                    </button>
                </form>
            </article>
        </div>
    `;

    scrollChatToBottom();
}

function renderChatMessage(message) {
    const isUser = message.role === 'user';
    const content = message.key ? t(message.key) : message.content;
    const safeContent = isUser ? escapeHtml(content) : formatCoachAnswer(content);

    return `
        <div class="chat-message chat-message--${isUser ? 'user' : 'assistant'}">
            <div class="chat-bubble">${safeContent}</div>
        </div>
    `;
}

function renderSectionHeading(sectionKey) {
    return `
        <div class="section-heading">
            <div class="section-heading__content">
                <span class="section-icon" aria-hidden="true">${icons[sectionKey]}</span>
                <div>
                    <h2 id="${sectionKey}-title">${escapeHtml(t(`sections.${sectionKey}.title`))}</h2>
                    <p>${escapeHtml(t(`sections.${sectionKey}.subtitle`))}</p>
                </div>
            </div>
        </div>
    `;
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
        const response = await fetch('/api/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${sessionStorage.getItem(AUTH_TOKEN_KEY) || ''}`
            },
            body: JSON.stringify({
                question,
                language: t('language.englishName'),
                context: state.userContext
            })
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || t('errors.coachOffline'));
        }

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

function svgIcon(paths) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}
