# CivicGuide AI India – Smart Election Assistant 🗳️

## Problem Statement
Navigating the election process in India, the world's largest democracy, can be confusing for many citizens, especially first-time voters. There is a need for a simple, accessible, and factual assistant that guides users through the Indian voting process, helps them check their eligibility based on Election Commission of India (ECI) rules, and answers basic election-related questions neutrally.

## Solution Overview
CivicGuide AI India is a lightweight, web-based intelligent assistant designed to simplify the Indian election process. It offers a structured guide based on ECI protocols, an offline eligibility checker, and a secure AI-powered Q&A interface using Google's Gemini API, all presented in a premium, accessible user interface.

## Features
1. **Step-by-step Election Guide**: A structured timeline of the Indian election process, including Voter Rolls, EVMs, and VVPATs.
2. **Eligibility Checker**: A secure, client-side logic-based checker built on ECI citizenship and age rules (no API calls used to protect user data).
3. **AI-Powered Q&A**: Users can ask questions about the Indian election process (Lok Sabha, State Assemblies, NOTA, etc.). Powered by the Gemini API, responding neutrally and concisely based on the Indian Constitution.
4. **Premium Interactive UI**: Button-driven, highly accessible interface utilizing semantic HTML, ARIA attributes, and a modern glassmorphism design.

## Tech Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES Modules). No heavy frameworks, ensuring a tiny repository footprint (< 1MB).
- **Backend**: Node.js with Express.js.
- **AI Integration**: `@google/generative-ai` (Gemini API latest version).
- **Testing**: Built-in Node.js Test Runner (`node:test`).

## Architecture
The application uses a lightweight Express server (`server.js`) to serve static frontend files securely. The server also acts as a proxy for the Gemini API (`/api/ask`), ensuring that the `GEMINI_API_KEY` is kept safe on the server and never exposed to the client. The frontend communicates with the backend via simple `fetch` requests.

## Security Practices
- **API Key Protection**: The Gemini API key is strictly stored in server-side environment variables (`.env`). The frontend never sees the key.
- **Input Validation**: Both client-side and server-side validation are implemented to prevent extremely long or malformed inputs from reaching the AI model.
- **Offline Logic**: Sensitive user data (like age and citizenship status) is processed entirely offline using predefined logic, preventing unnecessary data exposure.

## Efficiency Strategy
- **Minimal API Usage**: The Gemini API is *only* used for answering free-form questions. Structured tasks like the election timeline and eligibility checking use fast, predefined static logic.
- **Minimal Dependencies**: The frontend relies entirely on standard browser APIs. The backend uses only the essential dependencies (`express`, `dotenv`, and the Google SDK), keeping the bundle and memory footprint incredibly small.

## Testing Approach
Basic functional validation testing is included in `tests/election.test.js`. We use the native Node.js test runner to execute unit tests against the `electionService.js` logic and input validators, verifying that eligibility rules (specifically for Indian Citizens) and validation edge-cases work properly.
Run tests using: `npm test`

## Accessibility Considerations
- **High Contrast & Simple Colors**: Uses a clean, high-contrast color scheme.
- **Semantic HTML**: Proper use of `<header>`, `<main>`, `<section>`, `<nav>`, and heading hierarchies.
- **Screen Reader Support**: Uses `aria-live="polite"` for dynamic result announcements (eligibility results and AI responses).
- **Keyboard Navigation**: The UI relies on native `<button>` and form elements, which are inherently keyboard accessible.

## Google Services Usage
The application integrates the **Google Gemini API** (`gemini-1.5-flash`) via the Node SDK. It uses a structured system prompt to ensure the AI acts as a neutral, factual assistant expert in Indian Elections, keeping responses concise (under 150 words) and avoiding political bias, fulfilling the requirement for meaningful AI integration.

## How to Run Locally

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   - Copy `.env.example` to `.env`.
   - Add your Gemini API Key: `GEMINI_API_KEY=your_api_key_here`

3. **Run Tests:**
   ```bash
   npm test
   ```

4. **Start the Server:**
   ```bash
   npm start
   ```

5. **Access the App:**
   Open your browser and navigate to `http://localhost:3000`.
