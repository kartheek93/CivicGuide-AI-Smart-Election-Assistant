import { checkEligibility, getElectionSteps } from '../services/electionService.js';
import { isValidAge, isValidQuestion } from '../utils/validators.js';

// ---- DICTIONARY FOR MULTI-LANGUAGE SUPPORT ----
const dict = {
    en: {
        "t-how-to-vote": "How to Vote",
        "t-check-eligibility": "Check Eligibility",
        "t-timeline": "Election Timeline",
        "t-ask-ai": "Ask AI Assistant",
        "t-knowledge-hub": "Knowledge Hub",
        "t-welcome": "Welcome to CivicGuide",
        "t-welcome-desc": "Select an option from the menu to learn about the election process, check your eligibility, or ask our intelligent assistant a question.",
        "t-age": "Age",
        "t-citizenship": "Citizenship Status",
        "t-registration": "Registration Status",
        "t-select": "Select...",
        "t-citizen": "Indian Citizen",
        "t-non-citizen": "Non-Citizen / NRI (No Voting Rights)",
        "t-registered": "Registered",
        "t-not-registered": "Not Registered",
        "t-check-btn": "Check",
        "t-months-before": "Months Before",
        "t-months-desc": "Election Commission of India (ECI) announces dates and Model Code of Conduct comes into effect.",
        "t-weeks-before": "Weeks Before",
        "t-weeks-desc": "Campaigning by political parties. Voter slips distributed.",
        "t-48h-before": "48 Hours Before",
        "t-48h-desc": "Campaigning ends. Silence period begins.",
        "t-polling-day": "Polling Day",
        "t-polling-desc": "Voters cast their ballot using EVM and VVPAT.",
        "t-counting-day": "Counting Day",
        "t-counting-desc": "ECI counts votes and declares results.",
        "t-ask-desc": "Ask me any neutral, factual question about the election process!",
        "t-thinking": "AI is thinking...",
        "langName": "English"
    },
    hi: {
        "t-how-to-vote": "वोट कैसे दें",
        "t-check-eligibility": "पात्रता जांचें",
        "t-timeline": "चुनाव की समयसीमा",
        "t-ask-ai": "AI सहायक से पूछें",
        "t-knowledge-hub": "ज्ञान केंद्र",
        "t-welcome": "CivicGuide में आपका स्वागत है",
        "t-welcome-desc": "चुनाव प्रक्रिया के बारे में जानने, अपनी पात्रता जांचने, या हमारे बुद्धिमान सहायक से प्रश्न पूछने के लिए मेनू से एक विकल्प चुनें।",
        "t-age": "आयु",
        "t-citizenship": "नागरिकता की स्थिति",
        "t-registration": "पंजीकरण की स्थिति",
        "t-select": "चुनें...",
        "t-citizen": "भारतीय नागरिक",
        "t-non-citizen": "गैर-नागरिक / एनआरआई (मतदान का अधिकार नहीं)",
        "t-registered": "पंजीकृत",
        "t-not-registered": "पंजीकृत नहीं",
        "t-check-btn": "जांचें",
        "t-months-before": "महीनों पहले",
        "t-months-desc": "भारत निर्वाचन आयोग (ECI) तारीखों की घोषणा करता है और आदर्श आचार संहिता लागू होती है।",
        "t-weeks-before": "हफ्तों पहले",
        "t-weeks-desc": "राजनीतिक दलों द्वारा प्रचार। मतदाता पर्चियां बांटी जाती हैं।",
        "t-48h-before": "48 घंटे पहले",
        "t-48h-desc": "प्रचार समाप्त। मौन अवधि शुरू।",
        "t-polling-day": "मतदान का दिन",
        "t-polling-desc": "मतदाता EVM और VVPAT का उपयोग करके अपना वोट डालते हैं।",
        "t-counting-day": "मतगणना का दिन",
        "t-counting-desc": "ECI वोटों की गिनती करता है और परिणाम घोषित करता है।",
        "t-ask-desc": "मुझसे चुनाव प्रक्रिया के बारे में कोई भी निष्पक्ष, तथ्यात्मक प्रश्न पूछें!",
        "t-thinking": "AI सोच रहा है...",
        "langName": "Hindi"
    },
    te: {
        "t-how-to-vote": "ఓటు వేయడం ఎలా",
        "t-check-eligibility": "అర్హతను తనిఖీ చేయండి",
        "t-timeline": "ఎన్నికల కాలక్రమం",
        "t-ask-ai": "AI సహాయకుడిని అడగండి",
        "t-knowledge-hub": "జ్ఞాన కేంద్రం",
        "t-welcome": "CivicGuide కి స్వాగతం",
        "t-welcome-desc": "ఎన్నికల ప్రక్రియ గురించి తెలుసుకోవడానికి, మీ అర్హతను తనిఖీ చేయడానికి లేదా మా తెలివైన సహాయకుడిని ప్రశ్న అడగడానికి మెను నుండి ఒక ఎంపికను ఎంచుకోండి.",
        "t-age": "వయస్సు",
        "t-citizenship": "పౌరసత్వ స్థితి",
        "t-registration": "నమోదు స్థితి",
        "t-select": "ఎంచుకోండి...",
        "t-citizen": "భారతీయ పౌరుడు",
        "t-non-citizen": "భారతీయేతరుడు / NRI (ఓటు హక్కు లేదు)",
        "t-registered": "నమోదైంది",
        "t-not-registered": "నమోదు కాలేదు",
        "t-check-btn": "తనిఖీ",
        "t-months-before": "నెలల ముందు",
        "t-months-desc": "భారత ఎన్నికల సంఘం (ECI) తేదీలను ప్రకటిస్తుంది మరియు మోడల్ కోడ్ ఆఫ్ కండక్ట్ అమలులోకి వస్తుంది.",
        "t-weeks-before": "వారాల ముందు",
        "t-weeks-desc": "రాజకీయ పార్టీల ప్రచారం. ఓటర్ స్లిప్పుల పంపిణీ.",
        "t-48h-before": "48 గంటల ముందు",
        "t-48h-desc": "ప్రచారం ముగుస్తుంది. నిశ్శబ్ద కాలం ప్రారంభమవుతుంది.",
        "t-polling-day": "పోలింగ్ రోజు",
        "t-polling-desc": "ఓటర్లు EVM మరియు VVPAT ఉపయోగించి ఓటు వేస్తారు.",
        "t-counting-day": "కౌంటింగ్ రోజు",
        "t-counting-desc": "ECI ఓట్లను లెక్కిస్తుంది మరియు ఫలితాలను ప్రకటిస్తుంది.",
        "t-ask-desc": "ఎన్నికల ప్రక్రియ గురించి ఏదైనా నిష్పక్షపాత, వాస్తవ ప్రశ్న అడగండి!",
        "t-thinking": "AI ఆలోచిస్తోంది...",
        "langName": "Telugu"
    },
    ta: {
        "t-how-to-vote": "வாக்களிப்பது எப்படி",
        "t-check-eligibility": "தகுதியைச் சரிபார்க்கவும்",
        "t-timeline": "தேர்தல் காலக்கோடு",
        "t-ask-ai": "AI உதவியாளரிடம் கேட்கவும்",
        "t-knowledge-hub": "அறிவு மையம்",
        "t-welcome": "CivicGuide-க்கு வரவேற்கிறோம்",
        "t-welcome-desc": "தேர்தல் செயல்முறையைப் பற்றி அறிய, உங்கள் தகுதியைச் சரிபார்க்க அல்லது எங்களது அறிவுசார் உதவியாளரிடம் கேள்வி கேட்க மெனுவிலிருந்து ஒரு விருப்பத்தைத் தேர்ந்தெடுக்கவும்.",
        "t-age": "வயது",
        "t-citizenship": "குடியுரிமை நிலை",
        "t-registration": "பதிவு நிலை",
        "t-select": "தேர்ந்தெடு...",
        "t-citizen": "இந்தியக் குடிமகன்",
        "t-non-citizen": "இந்தியர் அல்லாதவர் / NRI (வாக்குரிமை இல்லை)",
        "t-registered": "பதிவு செய்யப்பட்டுள்ளது",
        "t-not-registered": "பதிவு செய்யப்படவில்லை",
        "t-check-btn": "சரிபார்க்கவும்",
        "t-months-before": "மாதங்களுக்கு முன்",
        "t-months-desc": "இந்திய தேர்தல் ஆணையம் (ECI) தேதிகளை அறிவிக்கிறது மற்றும் மாதிரி நடத்தை விதிமுறை அமலுக்கு வருகிறது.",
        "t-weeks-before": "வாரங்களுக்கு முன்",
        "t-weeks-desc": "அரசியல் கட்சிகளின் பிரச்சாரம். வாக்காளர் சீட்டுகள் விநியோகிக்கப்படுகின்றன.",
        "t-48h-before": "48 மணிநேரத்திற்கு முன்",
        "t-48h-desc": "பிரச்சாரம் முடிகிறது. அமைதிக் காலம் தொடங்குகிறது.",
        "t-polling-day": "வாக்குப்பதிவு நாள்",
        "t-polling-desc": "வாக்காளர்கள் EVM மற்றும் VVPAT பயன்படுத்தி வாக்களிக்கின்றனர்.",
        "t-counting-day": "எண்ணிக்கை நாள்",
        "t-counting-desc": "ECI வாக்குகளை எண்ணி முடிவுகளை அறிவிக்கிறது.",
        "t-ask-desc": "தேர்தல் செயல்முறை குறித்து ஏதேனும் நடுநிலையான, உண்மையான கேள்வியைக் கேளுங்கள்!",
        "t-thinking": "AI யோசிக்கிறது...",
        "langName": "Tamil"
    },
    mr: {
        "t-how-to-vote": "मतदान कसे करावे",
        "t-check-eligibility": "पात्रता तपासा",
        "t-timeline": "निवडणूक वेळापत्रक",
        "t-ask-ai": "AI सहायकाला विचारा",
        "t-knowledge-hub": "ज्ञान केंद्र",
        "t-welcome": "CivicGuide मध्ये आपले स्वागत आहे",
        "t-welcome-desc": "निवडणूक प्रक्रियेबद्दल जाणून घेण्यासाठी, तुमची पात्रता तपासण्यासाठी किंवा आमच्या बुद्धिमान सहायकाला प्रश्न विचारण्यासाठी मेनूमधून एक पर्याय निवडा.",
        "t-age": "वय",
        "t-citizenship": "नागरिकत्व स्थिती",
        "t-registration": "नोंदणी स्थिती",
        "t-select": "निवडा...",
        "t-citizen": "भारतीय नागरिक",
        "t-non-citizen": "बिगर-नागरिक / NRI (मतदानाचा अधिकार नाही)",
        "t-registered": "नोंदणीकृत",
        "t-not-registered": "नोंदणीकृत नाही",
        "t-check-btn": "तपासा",
        "t-months-before": "काही महिने आधी",
        "t-months-desc": "भारतीय निवडणूक आयोग (ECI) तारखा जाहीर करतो आणि आदर्श आचारसंहिता लागू होते.",
        "t-weeks-before": "काही आठवडे आधी",
        "t-weeks-desc": "राजकीय पक्षांकडून प्रचार. मतदार चिठ्ठ्यांचे वाटप.",
        "t-48h-before": "४८ तास आधी",
        "t-48h-desc": "प्रचार संपतो. शांतता काळ सुरू होतो.",
        "t-polling-day": "मतदानाचा दिवस",
        "t-polling-desc": "मतदार EVM आणि VVPAT वापरून मतदान करतात.",
        "t-counting-day": "मतमोजणीचा दिवस",
        "t-counting-desc": "ECI मतांची मोजणी करते आणि निकाल जाहीर करते.",
        "t-ask-desc": "निवडणूक प्रक्रियेबद्दल कोणताही निष्पक्ष, तथ्यात्मक प्रश्न विचारा!",
        "t-thinking": "AI विचार करत आहे...",
        "langName": "Marathi"
    }
};

let currentLang = 'en';

// --- LOGICAL USER CONTEXT (For AI Coach Persona) ---
let userContext = {
    hasCheckedEligibility: false,
    age: null,
    isEligible: null,
    reason: null
};

document.addEventListener('DOMContentLoaded', () => {

    // Initialize GSAP
    gsap.registerPlugin();

    // Elements
    const sections = document.querySelectorAll('.app-section');
    const menuBtns = document.querySelectorAll('.menu-btn');
    const loginForm = document.getElementById('login-form');
    const langSelector = document.getElementById('lang-selector');

    // ---- NAVIGATION & MOTION LOGIC ----
    const showSection = (targetId) => {
        // Hide all
        sections.forEach(sec => {
            if (!sec.classList.contains('hidden')) {
                gsap.to(sec, { opacity: 0, y: -10, duration: 0.2, onComplete: () => sec.classList.add('hidden') });
            }
        });

        // Show target
        const target = document.getElementById(targetId);
        setTimeout(() => {
            target.classList.remove('hidden');
            gsap.fromTo(target, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
            
            // Timeline specific stagger animation
            if (targetId === 'election-timeline') {
                gsap.fromTo('#election-timeline li', 
                    { opacity: 0, x: -20 }, 
                    { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: "back.out(1.7)" }
                );
            }
        }, 200);
    };

    menuBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            showSection(target);
            if (target === 'how-to-vote') {
                renderHowToVote();
            } else if (target === 'knowledge-hub') {
                renderKnowledgeHub();
            }
        });
    });

    // Default to welcome
    showSection('welcome-section');

    // ---- LOGIN LOGIC ----
    if (loginForm) {
        // Entry animation for login card
        gsap.fromTo('.login-card', { opacity: 0, scale: 0.9, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.2)" });

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('password').value;
            const errorBox = document.getElementById('login-error');
            const loginBtn = document.getElementById('login-btn');
            
            loginBtn.disabled = true;
            errorBox.classList.add('hidden');

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });
                const data = await response.json();

                if (response.ok && data.success) {
                    sessionStorage.setItem('authToken', data.token);
                    
                    // Outro animation for login wrapper
                    gsap.to('#login-page-wrapper', {
                        opacity: 0, 
                        scale: 1.05, 
                        duration: 0.4, 
                        ease: "power2.in",
                        onComplete: () => {
                            document.getElementById('login-page-wrapper').style.display = 'none';
                            
                            // Intro animation for app wrapper
                            const appWrapper = document.getElementById('app-wrapper');
                            appWrapper.classList.remove('hidden');
                            appWrapper.classList.add('flex'); // Because it's flex-col
                            gsap.fromTo('#app-wrapper', { opacity: 0 }, { opacity: 1, duration: 0.5 });
                            
                            // Stagger sidebar buttons
                            gsap.fromTo('.menu-btn', { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.1, ease: "power1.out", delay: 0.2 });
                        }
                    });
                } else {
                    errorBox.innerHTML = `<strong>Error:</strong> ${data.error || 'Invalid credentials'}`;
                    errorBox.classList.remove('hidden');
                    gsap.fromTo(errorBox, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3 });
                }
            } catch (error) {
                errorBox.innerHTML = `<strong>Error:</strong> Failed to connect to server.`;
                errorBox.classList.remove('hidden');
            } finally {
                loginBtn.disabled = false;
            }
        });
    }

    // ---- LANGUAGE SELECT LOGIC ----
    langSelector.addEventListener('change', (e) => {
        currentLang = e.target.value;
        
        // Translate UI
        for (const [key, val] of Object.entries(dict[currentLang])) {
            const elements = document.querySelectorAll(`.${key}`);
            elements.forEach(el => el.innerText = val);
        }

        // Animate container to provide feedback
        gsap.fromTo('#app-wrapper', { opacity: 0.8 }, { opacity: 1, duration: 0.3 });
    });

    // ---- HOW TO VOTE LOGIC ----
    const renderHowToVote = () => {
        const container = document.getElementById('steps-container');
        if (container.innerHTML !== '') return;

        const steps = getElectionSteps();
        let html = '';
        steps.forEach(s => {
            html += `
            <div class="p-4 bg-blue-50 rounded-xl border border-blue-100 hover:shadow-md transition-shadow">
                <strong class="text-primary block mb-1">Step ${s.step}: ${s.title}</strong>
                <span class="text-gray-700">${s.description}</span>
            </div>`;
        });
        container.innerHTML = html;
        
        gsap.fromTo('#steps-container div', 
            { opacity: 0, y: 10 }, 
            { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 }
        );
    };

    // ---- KNOWLEDGE HUB RENDERING ----
    const renderKnowledgeHub = async () => {
        const container = document.getElementById('knowledge-container');
        if (container.innerHTML.indexOf('animate-pulse') === -1 && container.innerHTML !== '') return;

        try {
            const response = await fetch('/api/knowledge');
            const data = await response.json();
            
            // Basic parsing of KnowledgeBase.txt
            const sections = data.content.split('##').filter(s => s.trim() !== '');
            let html = '';

            sections.forEach(sec => {
                const lines = sec.trim().split('\n');
                const title = lines[0].trim();
                const content = lines.slice(1).join('<br>').replace(/- /g, '• ');

                html += `
                <div class="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/30 transition-all shadow-sm group">
                    <h3 class="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                        <span class="w-2 h-2 bg-primary rounded-full"></span>
                        ${title}
                    </h3>
                    <div class="text-gray-600 text-sm leading-relaxed">
                        ${content}
                    </div>
                </div>`;
            });

            container.innerHTML = html;
            gsap.fromTo('#knowledge-container > div', 
                { opacity: 0, scale: 0.95 }, 
                { opacity: 1, scale: 1, duration: 0.4, stagger: 0.1, ease: "back.out(1.2)" }
            );

        } catch (error) {
            container.innerHTML = `<p class="text-red-500">Failed to load knowledge base content.</p>`;
        }
    };

    // ---- ELIGIBILITY CHECKER ----
    const eligibilityForm = document.getElementById('eligibility-form');
    eligibilityForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const age = document.getElementById('age').value;
        const citizenship = document.getElementById('citizenship').value;
        const registration = document.getElementById('registration').value;
        const resultBox = document.getElementById('eligibility-result');

        if (!isValidAge(age)) {
            resultBox.innerHTML = '<strong>Error:</strong> Please enter a valid age.';
            resultBox.classList.remove('hidden', 'bg-green-50', 'border-green-500', 'text-green-800');
            resultBox.classList.add('bg-red-50', 'border-red-500', 'text-red-800');
            gsap.fromTo(resultBox, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.3 });
            return;
        }

        const result = checkEligibility(parseInt(age), citizenship, registration);
        
        // --- UPDATE LOGICAL CONTEXT ---
        userContext.hasCheckedEligibility = true;
        userContext.age = parseInt(age);
        userContext.isEligible = result.eligible;
        userContext.reason = result.message;

        // Dynamic Eligible/Not Eligible labels
        let eligibleLabel = "Eligible";
        let notEligibleLabel = "Not Yet Eligible";
        
        if (currentLang === 'hi') { eligibleLabel = "पात्र"; notEligibleLabel = "अभी पात्र नहीं"; }
        else if (currentLang === 'te') { eligibleLabel = "అర్హులు"; notEligibleLabel = "ఇంకా అర్హత లేదు"; }
        else if (currentLang === 'ta') { eligibleLabel = "தகுதியுடையவர்"; notEligibleLabel = "இன்னும் தகுதியில்லை"; }
        else if (currentLang === 'mr') { eligibleLabel = "पात्र"; notEligibleLabel = "अजून पात्र नाही"; }

        resultBox.innerHTML = `<strong>${result.eligible ? eligibleLabel : notEligibleLabel}:</strong> ${result.message}`;
        
        resultBox.className = 'mt-6 p-4 rounded-lg shadow-sm border-l-4'; // Reset
        if (result.eligible) {
            resultBox.classList.add('bg-green-50', 'border-green-500', 'text-green-800');
        } else {
            resultBox.classList.add('bg-red-50', 'border-red-500', 'text-red-800');
        }
        
        resultBox.classList.remove('hidden');
        gsap.fromTo(resultBox, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.3 });
    });

    // ---- AI Q&A (Context-Aware AI Coach) ----
    const aiForm = document.getElementById('ai-form');
    const askBtn = document.getElementById('ask-btn');
    const aiLoading = document.getElementById('ai-loading');
    const chatHistory = document.getElementById('chat-history');

    aiForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const questionInput = document.getElementById('question');
        let question = questionInput.value.trim();

        if (!isValidQuestion(question)) return;

        // Add user message to chat UI
        const userMsgHtml = `
            <div class="flex justify-end mb-4">
                <div class="bg-primary text-white rounded-2xl rounded-tr-sm px-5 py-3 max-w-[80%] shadow-sm">
                    ${questionInput.value}
                </div>
            </div>`;
        chatHistory.insertAdjacentHTML('beforeend', userMsgHtml);
        
        // Scroll to bottom
        chatHistory.scrollTop = chatHistory.scrollHeight;

        // UI State update
        askBtn.disabled = true;
        askBtn.classList.add('opacity-50');
        aiLoading.classList.remove('hidden');
        questionInput.value = '';

        try {
            const response = await fetch('/api/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ 
                    question,
                    language: dict[currentLang].langName,
                    context: userContext // Pushing logical context to the AI
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch response');
            }

            // Formatting
            const formattedAnswer = data.answer
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/^# (.*$)/gim, '<h3>$1</h3>')
                .replace(/^## (.*$)/gim, '<h4>$1</h4>')
                .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>')
                .replace(/<\/ul>\n<ul>/gim, '')
                .replace(/\n/g, '<br>');

            // Add AI message to chat UI
            const aiMsgHtml = `
                <div class="flex justify-start mb-4 ai-message opacity-0">
                    <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                        <span class="text-sm">🤖</span>
                    </div>
                    <div class="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm px-5 py-4 max-w-[85%] shadow-sm">
                        ${formattedAnswer}
                    </div>
                </div>`;
            
            chatHistory.insertAdjacentHTML('beforeend', aiMsgHtml);
            
            // Animate AI message in
            const newMsg = chatHistory.lastElementChild;
            gsap.to(newMsg, { opacity: 1, y: 0, duration: 0.4, ease: "power1.out" });
            gsap.fromTo(newMsg, { y: 10 }, { y: 0, duration: 0.4 });

        } catch (error) {
            const errorHtml = `
                <div class="flex justify-start mb-4">
                    <div class="bg-red-50 text-red-700 rounded-2xl px-5 py-3 border border-red-200">
                        <strong>Error:</strong> ${error.message}
                    </div>
                </div>`;
            chatHistory.insertAdjacentHTML('beforeend', errorHtml);
        } finally {
            askBtn.disabled = false;
            askBtn.classList.remove('opacity-50');
            aiLoading.classList.add('hidden');
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
    });

});
