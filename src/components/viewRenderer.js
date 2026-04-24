import { getElectionSteps } from '../services/electionService.js';

export const createViewRenderer = ({
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
}) => {
    const renderStatusCard = () => {
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
    };

    const renderFeatureCard = (card, index) => {
        const iconNames = ['shield', 'spark', 'check'];
        const icon = icons[iconNames[index % iconNames.length]];

        return `
            <article class="card">
                <span class="feature-icon" aria-hidden="true">${icon}</span>
                <h3>${escapeHtml(card.title)}</h3>
                <p>${escapeHtml(card.description)}</p>
            </article>
        `;
    };

    const renderEligibilityResult = (result) => {
        return `
            <div class="alert ${result.isEligible ? 'alert--success' : 'alert--error'}">
                <strong>${escapeHtml(result.title)}</strong>
                <p>${escapeHtml(result.summary)}</p>
            </div>
        `;
    };

    const renderKnowledgeCards = () => {
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
    };

    const renderSkeletonGrid = (count) => {
        return `
            <div class="skeleton-grid" aria-label="${escapeAttribute(t('common.loading'))}">
                ${Array.from({ length: count }, () => '<div class="skeleton-card"></div>').join('')}
            </div>
        `;
    };

    const renderSectionHeading = (sectionKey) => {
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
    };

    const renderSpeechAction = (messageIndex) => {
        const speechState = getSpeechControlState(messageIndex);
        if (!speechState.canSpeak) {
            return '';
        }

        return `
            <button
                class="chat-action${speechState.isPlaying ? ' is-active' : ''}"
                type="button"
                data-action="speak-message"
                data-message-index="${messageIndex}"
                aria-pressed="${speechState.isPlaying ? 'true' : 'false'}"
                aria-label="${escapeAttribute(speechState.label)}"
                ${speechState.isLoading ? 'disabled' : ''}
            >
                <span class="chat-action__icon" aria-hidden="true">${icons.speaker}</span>
                <span>${escapeHtml(speechState.label)}</span>
            </button>
        `;
    };

    const renderChatMessage = (message, index) => {
        const isUser = message.role === 'user';
        const content = message.key ? t(message.key) : message.content;
        const safeContent = isUser ? escapeHtml(content) : formatCoachAnswer(content);

        return `
            <div class="chat-message chat-message--${isUser ? 'user' : 'assistant'}">
                <div class="chat-bubble">${safeContent}</div>
                ${isUser ? '' : `<div class="chat-message__actions">${renderSpeechAction(index)}</div>`}
            </div>
        `;
    };

    return {
        renderNav() {
            const nav = document.getElementById('primary-nav');
            if (!nav) {
                return;
            }

            nav.innerHTML = state.navItems.map((item) => {
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
        },
        syncActiveSection() {
            document.querySelectorAll('.page-section').forEach((section) => {
                section.classList.toggle('is-active', section.dataset.section === state.activeSection);
            });
        },
        renderWelcomeSection() {
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
        },
        renderVoteSection() {
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
        },
        renderEligibilitySection() {
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
        },
        renderTimelineSection() {
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
        },
        renderKnowledgeSection(showSkeleton) {
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
        },
        renderAiSection() {
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
                            ${state.chatMessages.map((message, index) => renderChatMessage(message, index)).join('')}
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
    };
};
