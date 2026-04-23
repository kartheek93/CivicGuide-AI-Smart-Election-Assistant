import { checkEligibility, getElectionSteps } from '../services/electionService.js';
import { isValidAge, isValidQuestion } from '../utils/validators.js';

// ---- DICTIONARY FOR MULTI-LANGUAGE SUPPORT ----
const dict = {
    en: {
        "t-welcome": "Welcome to CivicGuide",
        "t-welcome-desc": "Your intelligent partner for the world's largest democratic exercise.",
        "t-how-to-vote": "How to Vote",
        "t-check-eligibility": "Eligibility",
        "t-timeline": "Timeline",
        "t-ask-ai": "Ask AI Coach",
        "t-knowledge-hub": "Knowledge Hub",
        "t-age": "Current Age",
        "t-citizenship": "Citizenship",
        "t-registration": "Voter Registration",
        "t-select": "Select status...",
        "t-citizen": "Indian Citizen",
        "t-non-citizen": "Non-Citizen / NRI",
        "t-registered": "Registered to Vote",
        "t-not-registered": "Not Registered Yet",
        "t-check-btn": "Verify My Eligibility",
        "t-months-before": "Months Before",
        "t-months-desc": "ECI announces dates and Model Code of Conduct begins.",
        "t-weeks-before": "Weeks Before",
        "t-weeks-desc": "Campaigning and voter slip distribution.",
        "t-48h-before": "48 Hours Before",
        "t-48h-desc": "Silence period begins.",
        "t-polling-day": "Polling Day",
        "t-polling-desc": "Voting via EVM and VVPAT.",
        "t-thinking": "Thinking...",
        "langName": "English"
    },
    hi: {
        "t-welcome": "CivicGuide में आपका स्वागत है",
        "t-welcome-desc": "दुनिया के सबसे बड़े लोकतांत्रिक अभ्यास के लिए आपका बुद्धिमान साथी।",
        "t-how-to-vote": "वोट कैसे दें",
        "t-check-eligibility": "पात्रता",
        "t-timeline": "समयसीमा",
        "t-ask-ai": "AI कोच से पूछें",
        "t-knowledge-hub": "ज्ञान केंद्र",
        "t-age": "वर्तमान आयु",
        "t-citizenship": "नागरिकता",
        "t-registration": "मतदाता पंजीकरण",
        "t-select": "स्थिति चुनें...",
        "t-citizen": "भारतीय नागरिक",
        "t-non-citizen": "गैर-नागरिक / एनआरआई",
        "t-registered": "वोट देने के लिए पंजीकृत",
        "t-not-registered": "अभी तक पंजीकृत नहीं",
        "t-check-btn": "मेरी पात्रता सत्यापित करें",
        "t-months-before": "महीनों पहले",
        "t-months-desc": "ECI तारीखों की घोषणा करता है और आदर्श आचार संहिता शुरू होती है।",
        "t-weeks-before": "हफ्तों पहले",
        "t-weeks-desc": "प्रचार और मतदाता पर्ची वितरण।",
        "t-48h-before": "48 घंटे पहले",
        "t-48h-desc": "मौन अवधि शुरू होती है।",
        "t-polling-day": "मतदान का दिन",
        "t-polling-desc": "EVM और VVPAT के माध्यम से मतदान।",
        "t-thinking": "सोच रहा हूँ...",
        "langName": "Hindi"
    },
    te: {
        "t-welcome": "CivicGuide కి స్వాగతం",
        "t-welcome-desc": "ప్రపంచంలోని అతిపెద్ద ప్రజాస్వామ్య ప్రక్రియ కోసం మీ తెలివైన భాగస్వామి.",
        "t-how-to-vote": "ఓటు వేయడం ఎలా",
        "t-check-eligibility": "అర్హత",
        "t-timeline": "కాలక్రమం",
        "t-ask-ai": "AI కోచ్‌ని అడగండి",
        "t-knowledge-hub": "జ్ఞాన కేంద్రం",
        "t-age": "ప్రస్తుత వయస్సు",
        "t-citizenship": "పౌరసత్వం",
        "t-registration": "ఓటరు నమోదు",
        "t-select": "స్థితిని ఎంచుకోండి...",
        "t-citizen": "భారతీయ పౌరుడు",
        "t-non-citizen": "భారతీయేతరుడు / NRI",
        "t-registered": "ఓటు వేయడానికి నమోదయ్యారు",
        "t-not-registered": "ఇంకా నమోదు కాలేదు",
        "t-check-btn": "నా అర్హతను ధృవీకరించండి",
        "t-months-before": "నెలల ముందు",
        "t-months-desc": "ECI తేదీలను ప్రకటిస్తుంది మరియు మోడల్ కోడ్ ఆఫ్ కండక్ట్ ప్రారంభమవుతుంది.",
        "t-weeks-before": "వారాల ముందు",
        "t-weeks-desc": "ప్రచారం మరియు ఓటర్ స్లిప్పుల పంపిణీ.",
        "t-48h-before": "48 గంటల ముందు",
        "t-48h-desc": "నిశ్శబ్ద కాలం ప్రారంభమవుతుంది.",
        "t-polling-day": "పోలింగ్ రోజు",
        "t-polling-desc": "EVM మరియు VVPAT ద్వారా ఓటింగ్.",
        "t-thinking": "ఆలోచిస్తున్నాను...",
        "langName": "Telugu"
    },
    ta: {
        "t-welcome": "CivicGuide-க்கு வரவேற்கிறோம்",
        "t-welcome-desc": "உலகின் மிகப்பெரிய ஜனநாயகப் பயிற்சிக்கான உங்கள் அறிவுசார் துணையாகும்.",
        "t-how-to-vote": "வாக்களிப்பது எப்படி",
        "t-check-eligibility": "தகுதி",
        "t-timeline": "காலக்கோடு",
        "t-ask-ai": "AI பயிற்சியாளரிடம் கேட்கவும்",
        "t-knowledge-hub": "அறிவு மையம்",
        "t-age": "தற்போதைய வயது",
        "t-citizenship": "குடியுரிமை",
        "t-registration": "வாக்காளர் பதிவு",
        "t-select": "நிலையைத் தேர்ந்தெடு...",
        "t-citizen": "இந்தியக் குடிமகன்",
        "t-non-citizen": "இந்தியர் அல்லாதவர் / NRI",
        "t-registered": "வாக்களிக்க பதிவு செய்யப்பட்டுள்ளது",
        "t-not-registered": "இன்னும் பதிவு செய்யப்படவில்லை",
        "t-check-btn": "எனது தகுதியைச் சரிபார்க்கவும்",
        "t-months-before": "மாதங்களுக்கு முன்",
        "t-months-desc": "ECI தேதிகளை அறிவிக்கிறது மற்றும் மாதிரி நடத்தை விதிமுறை தொடங்குகிறது.",
        "t-weeks-before": "வாரங்களுக்கு முன்",
        "t-weeks-desc": "பிரச்சாரம் மற்றும் வாக்காளர் சீட்டு விநியோகம்.",
        "t-48h-before": "48 மணிநேரத்திற்கு முன்",
        "t-48h-desc": "அமைதிக் காலம் தொடங்குகிறது.",
        "t-polling-day": "வாக்குப்பதிவு நாள்",
        "t-polling-desc": "EVM மற்றும் VVPAT மூலம் வாக்குப்பதிவு.",
        "t-thinking": "யோசிக்கிறேன்...",
        "langName": "Tamil"
    },
    mr: {
        "t-welcome": "CivicGuide मध्ये आपले स्वागत आहे",
        "t-welcome-desc": "जगातील सर्वात मोठ्या लोकशाही सरावासाठी तुमचा बुद्धिमान भागीदार.",
        "t-how-to-vote": "मतदान कसे करावे",
        "t-check-eligibility": "पात्रता",
        "t-timeline": "वेळापत्रक",
        "t-ask-ai": "AI प्रशिक्षकाला विचारा",
        "t-knowledge-hub": "ज्ञान केंद्र",
        "t-age": "वर्तमान वय",
        "t-citizenship": "नागरिकत्व",
        "t-registration": "मतदार नोंदणी",
        "t-select": "स्थिती निवडा...",
        "t-citizen": "भारतीय नागरिक",
        "t-non-citizen": "बिगर-नागरिक / NRI",
        "t-registered": "मतदानासाठी नोंदणीकृत",
        "t-not-registered": "अद्याप नोंदणीकृत नाही",
        "t-check-btn": "माझी पात्रता सत्यापित करा",
        "t-months-before": "काही महिने आधी",
        "t-months-desc": "ECI तारखा जाहीर करतो आणि आदर्श आचारसंहिता सुरू होते.",
        "t-weeks-before": "काही आठवडे आधी",
        "t-weeks-desc": "प्रचार आणि मतदार चिठ्ठी वाटप.",
        "t-48h-before": "४८ तास आधी",
        "t-48h-desc": "शांतता काळ सुरू होतो.",
        "t-polling-day": "मतदानाचा दिवस",
        "t-polling-desc": "EVM आणि VVPAT द्वारे मतदान.",
        "t-thinking": "विचार करत आहे...",
        "langName": "Marathi"
    }
};

let currentLang = 'en';
let userContext = { hasCheckedEligibility: false, age: null, isEligible: null, reason: null };

document.addEventListener('DOMContentLoaded', () => {

    gsap.registerPlugin(ScrollTrigger);

    const sections = document.querySelectorAll('.app-section');
    const menuBtns = document.querySelectorAll('.menu-btn');
    const loginForm = document.getElementById('login-form');
    const langSelector = document.getElementById('lang-selector');

    // ---- NAVIGATION & PREMIUM MOTION ----
    const showSection = (targetId) => {
        sections.forEach(sec => {
            if (!sec.classList.contains('hidden')) {
                gsap.to(sec, { opacity: 0, scale: 0.98, duration: 0.3, onComplete: () => sec.classList.add('hidden') });
            }
        });

        const target = document.getElementById(targetId);
        setTimeout(() => {
            target.classList.remove('hidden');
            gsap.fromTo(target, { opacity: 0, scale: 1.02, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "power3.out" });
            
            if (targetId === 'election-timeline') {
                gsap.fromTo('#election-timeline li', { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.6, stagger: 0.15, ease: "back.out(1.5)" });
            }
        }, 310);
    };

    menuBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            showSection(target);
            if (target === 'how-to-vote') renderHowToVote();
            else if (target === 'knowledge-hub') renderKnowledgeHub();
        });
    });

    showSection('welcome-section');

    // ---- LOGIN ----
    if (loginForm) {
        gsap.fromTo('.glass-panel', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, ease: "expo.out" });

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('password').value;
            const errorBox = document.getElementById('login-error');
            const loginBtn = document.getElementById('login-btn');
            
            loginBtn.disabled = true;
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });
                const data = await response.json();

                if (response.ok && data.success) {
                    sessionStorage.setItem('authToken', data.token);
                    gsap.to('#login-page-wrapper', { opacity: 0, scale: 1.1, duration: 0.6, ease: "power2.in", onComplete: () => {
                        document.getElementById('login-page-wrapper').style.display = 'none';
                        const appWrapper = document.getElementById('app-wrapper');
                        appWrapper.classList.remove('hidden');
                        appWrapper.classList.add('flex');
                        gsap.fromTo('#app-wrapper', { opacity: 0 }, { opacity: 1, duration: 1 });
                        gsap.fromTo('.menu-btn', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, delay: 0.5 });
                    }});
                } else {
                    errorBox.innerText = data.error || 'Access Denied';
                    errorBox.classList.remove('hidden');
                    gsap.fromTo(errorBox, { x: -10 }, { x: 0, duration: 0.1, repeat: 5 });
                }
            } catch (err) {
                errorBox.innerText = 'Server connection failed.';
                errorBox.classList.remove('hidden');
            } finally { loginBtn.disabled = false; }
        });
    }

    // ---- PLEDGE TO VOTE ----
    const pledgeBtn = document.getElementById('pledge-btn');
    pledgeBtn.addEventListener('click', () => {
        pledgeBtn.innerHTML = '✅ Pledged! 🇮🇳';
        pledgeBtn.classList.replace('bg-green-600', 'bg-blue-600');
        
        // Confetti-like animation
        for (let i = 0; i < 20; i++) {
            const emoji = ['🧡', '🤍', '💚'][Math.floor(Math.random() * 3)];
            const div = document.createElement('div');
            div.innerText = emoji;
            div.style.position = 'fixed';
            div.style.left = '50%';
            div.style.top = '50%';
            div.style.fontSize = '2rem';
            div.style.zIndex = '9999';
            document.body.appendChild(div);
            
            gsap.to(div, {
                x: (Math.random() - 0.5) * 600,
                y: (Math.random() - 0.5) * 600,
                opacity: 0,
                duration: 1 + Math.random(),
                onComplete: () => div.remove()
            });
        }
    });

    // ---- LANGUAGES ----
    langSelector.addEventListener('change', (e) => {
        currentLang = e.target.value;
        document.querySelectorAll('[class^="t-"]').forEach(el => {
            const key = Array.from(el.classList).find(c => c.startsWith('t-'));
            if (dict[currentLang][key]) el.innerText = dict[currentLang][key];
        });
        gsap.fromTo('main', { opacity: 0.5 }, { opacity: 1, duration: 0.5 });
    });

    // ---- KNOWLEDGE HUB ----
    const renderKnowledgeHub = async () => {
        const container = document.getElementById('knowledge-container');
        if (container.innerHTML.indexOf('animate-pulse') === -1) return;

        try {
            const res = await fetch('/api/knowledge');
            const data = await res.json();
            const sections = data.content.split('##').filter(s => s.trim() !== '');
            container.innerHTML = sections.map(sec => {
                const lines = sec.trim().split('\n');
                return `<div class="glass-card rounded-3xl p-8 border-l-4 border-navy reveal-up shadow-sm">
                    <h3 class="text-xl font-black text-navy mb-4 flex items-center gap-3">
                        <span class="w-3 h-3 bg-saffron rounded-full"></span> ${lines[0].trim()}
                    </h3>
                    <div class="text-gray-600 font-medium leading-relaxed">${lines.slice(1).join('<br>').replace(/- /g, '• ')}</div>
                </div>`;
            }).join('');
            
            gsap.fromTo('.reveal-up', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" });
        } catch (e) { container.innerHTML = '<p class="text-red-500">Failed to sync Knowledge Hub.</p>'; }
    };

    // ---- HOW TO VOTE ----
    const renderHowToVote = () => {
        const container = document.getElementById('steps-container');
        if (container.innerHTML !== '') return;
        getElectionSteps().forEach(s => {
            const card = document.createElement('div');
            card.className = 'glass-card rounded-3xl p-8 border-t-8 border-blue-500 reveal-up';
            card.innerHTML = `<span class="text-xs font-black text-blue-500 uppercase tracking-widest block mb-2">Step ${s.step}</span>
                              <h3 class="text-2xl font-black text-gray-900 mb-3">${s.title}</h3>
                              <p class="text-gray-500 font-medium">${s.description}</p>`;
            container.appendChild(card);
        });
        gsap.fromTo('.reveal-up', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1 });
    };

    // ---- ELIGIBILITY ----
    const eligibilityForm = document.getElementById('eligibility-form');
    eligibilityForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const age = document.getElementById('age').value;
        const citizen = document.getElementById('citizenship').value;
        const reg = document.getElementById('registration').value;
        const resultBox = document.getElementById('eligibility-result');
        const statusSummary = document.getElementById('voter-status-summary');

        if (!isValidAge(age)) {
            resultBox.innerText = 'Enter a valid age.';
            resultBox.className = 'mt-10 p-8 rounded-3xl bg-red-50 border-l-8 border-red-500 text-red-800 font-bold';
            resultBox.classList.remove('hidden');
            return;
        }

        const res = checkEligibility(parseInt(age), citizen, reg);
        userContext = { hasCheckedEligibility: true, age: parseInt(age), isEligible: res.eligible, reason: res.message };
        
        // Update Voter Card Mockup
        statusSummary.innerHTML = `<span class="${res.eligible ? 'text-green-600' : 'text-red-600'} font-black text-lg">
                                    ${res.eligible ? '✅ VERIFIED ELIGIBLE' : '❌ NOT YET ELIGIBLE'}</span><br>
                                    <span class="text-gray-400 text-sm font-bold uppercase tracking-tight">${res.message}</span>`;

        resultBox.innerHTML = `<h4 class="text-2xl font-black mb-2">${res.eligible ? 'Congratulations!' : 'Heads Up!'}</h4>
                               <p class="text-lg font-medium">${res.message}</p>`;
        resultBox.className = `mt-10 p-8 rounded-3xl border-l-8 ${res.eligible ? 'bg-green-50 border-green-500 text-green-800' : 'bg-red-50 border-red-500 text-red-800'}`;
        resultBox.classList.remove('hidden');
        gsap.fromTo(resultBox, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" });
    });

    // ---- AI COACH ----
    const aiForm = document.getElementById('ai-form');
    const chatHistory = document.getElementById('chat-history');
    const clearChat = document.getElementById('clear-chat');

    clearChat.addEventListener('click', () => { chatHistory.innerHTML = ''; });

    aiForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('question');
        const question = input.value.trim();
        if (!isValidQuestion(question)) return;

        chatHistory.insertAdjacentHTML('beforeend', `<div class="flex justify-end mb-4"><div class="bg-primary text-white rounded-3xl rounded-tr-sm px-6 py-4 max-w-[80%] shadow-lg font-bold">${question}</div></div>`);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        input.value = '';
        document.getElementById('ai-loading').classList.remove('hidden');

        try {
            const res = await fetch('/api/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}` },
                body: JSON.stringify({ question, language: dict[currentLang].langName, context: userContext })
            });
            const data = await res.json();
            const formatted = (data.answer || 'No response').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
            chatHistory.insertAdjacentHTML('beforeend', `<div class="flex justify-start mb-4"><div class="bg-gray-100 text-gray-800 rounded-3xl rounded-tl-sm px-6 py-4 max-w-[85%] shadow-sm font-medium border border-gray-100">${formatted}</div></div>`);
        } catch (e) {
            chatHistory.insertAdjacentHTML('beforeend', `<div class="p-4 bg-red-50 text-red-700 rounded-2xl">Coach is offline.</div>`);
        } finally {
            document.getElementById('ai-loading').classList.add('hidden');
            chatHistory.scrollTop = chatHistory.scrollHeight;
            gsap.from(chatHistory.lastElementChild, { opacity: 0, y: 10, duration: 0.4 });
        }
    });
});
