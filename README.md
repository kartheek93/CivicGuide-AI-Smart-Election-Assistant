# CivicGuide AI - Smart Election Assistant

CivicGuide AI is a multilingual election guidance platform built to help Indian citizens understand voting, eligibility, election timelines, voter documents, and civic responsibilities through a clean government-grade web experience and an AI Election Coach.

## Problem Statement

Many citizens, especially first-time voters, need simple and trustworthy guidance on:

- Whether they are eligible to vote.
- How to register and prepare for polling day.
- What documents they should carry.
- How the election process and timeline work.
- Where to get answers in their preferred language.

CivicGuide AI solves this by combining static rule-based election guidance with an AI assistant that answers citizen questions in a neutral, accessible, and multilingual way.

## How The Application Works

1. The user opens the web app and logs in through the admin portal.
2. The dashboard loads with a responsive government-style interface.
3. The user can switch languages from the top navigation.
4. The sidebar lets the user access Home, How to Vote, Eligibility, Timeline, Knowledge Hub, and AI Coach.
5. The Eligibility page uses local validation and rule-based logic to check age, citizenship, and voter registration status.
6. The AI Coach receives the user's question, selected language, knowledge base context, and eligibility context.
7. The backend sends a structured prompt to Gemini 2.5 Flash and returns a short, neutral election guidance response.
8. Static guidance such as voting steps, timeline, and civic facts is rendered quickly from local frontend data and translation files.

## Key Features

- Secure admin login using the `/api/login` endpoint.
- Fully responsive UI for mobile, tablet, laptop, and desktop.
- Mobile hamburger navigation and tablet sidebar rail.
- Centralized multilingual translation system using `src/data/translations.json`.
- Supported languages: English, Hindi, Telugu, Tamil, and Marathi.
- Rule-based eligibility checker for age, citizenship, and registration status.
- AI Election Coach powered by Gemini 2.5 Flash.
- Knowledge Hub for civic and election explainers.
- Modern chat interface with user/assistant bubbles, typing state, and quick prompts.
- Accessibility-focused UI with semantic HTML, ARIA labels, keyboard focus states, and reduced-motion support.
- Security middleware with Helmet and rate limiting.
- GZIP compression for better performance.
- Automated tests for election logic, validators, and stress behavior.

## Technology Used

Frontend:

- HTML5
- CSS3 with custom design tokens
- Vanilla JavaScript ES modules
- Responsive CSS Grid and Flexbox
- Google Fonts: Inter, Noto Sans Devanagari, Noto Sans Telugu, Noto Sans Tamil

Backend:

- Node.js
- Express.js
- ES modules
- `dotenv` for environment configuration
- `helmet` for security headers
- `express-rate-limit` for request throttling
- `compression` for GZIP responses

AI and Data:

- Google Gemini API through `@google/generative-ai`
- Gemini model: `gemini-2.5-flash`
- Local knowledge base: `src/data/knowledgeBase.txt`
- Centralized translations: `src/data/translations.json`

Testing:

- Node.js built-in test runner
- Tests in `tests/election.test.js` and `tests/stress.test.js`

## Project Structure

```text
.
+-- server.js
+-- package.json
+-- src
|   +-- assets
|   |   +-- flag.png
|   |   +-- hero.png
|   |   +-- watermark.png
|   +-- components
|   |   +-- app.js
|   |   +-- styles.css
|   +-- data
|   |   +-- knowledgeBase.txt
|   |   +-- translations.json
|   +-- pages
|   |   +-- index.html
|   +-- services
|   |   +-- electionService.js
|   |   +-- geminiService.js
|   +-- utils
|       +-- validators.js
+-- tests
    +-- election.test.js
    +-- stress.test.js
```

## Main Files

- `server.js`: Express server, middleware, API routes, static file serving.
- `src/pages/index.html`: Main HTML shell for login and dashboard.
- `src/components/styles.css`: Complete responsive design system and UI styling.
- `src/components/app.js`: Frontend state, rendering, navigation, i18n, login, eligibility, and AI chat logic.
- `src/data/translations.json`: All UI text for supported languages.
- `src/data/knowledgeBase.txt`: Election knowledge passed into the AI prompt.
- `src/services/electionService.js`: Local rule-based eligibility and voting step logic.
- `src/services/geminiService.js`: Gemini initialization and AI prompt orchestration.
- `src/utils/validators.js`: Input validation and sanitization utilities.

## API Routes

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/login` | Validates admin password and returns an auth token. |
| `POST` | `/api/ask` | Sends user question and context to Gemini AI. |
| `GET` | `/api/knowledge` | Returns local election knowledge base content. |
| `GET` | `*` | Serves the frontend app. |

## Environment Variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
ADMIN_PASSWORD=your_secure_admin_password
PORT=3000
```

Notes:

- `GEMINI_API_KEY` is required for AI Coach responses.
- `ADMIN_PASSWORD` should always be set for real usage.
- If `ADMIN_PASSWORD` is missing, the backend currently uses a demo fallback for local testing.

## Run Locally

Install dependencies:

```powershell
npm install
```

Start the server:

```powershell
npm start
```

Open the app:

```text
http://localhost:3000
```

Run tests:

```powershell
npm test
```

## Deploy On Google Cloud Platform

The project can be deployed to GCP in two common ways:

- App Engine Standard using the existing `app.yaml`.
- Cloud Run using the existing `Dockerfile`.

Before deploying, install and configure the Google Cloud CLI:

```powershell
gcloud init
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID
```

Enable required services:

```powershell
gcloud services enable appengine.googleapis.com run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

### Option 1: Deploy To App Engine

This project already includes `app.yaml`:

```yaml
runtime: nodejs20
instance_class: F1
env_variables:
  NODE_ENV: "production"
```

Create an App Engine app once per project:

```powershell
gcloud app create --region=asia-south1
```

For a quick demo deployment, add environment variables in `app.yaml` before deploying:

```yaml
env_variables:
  NODE_ENV: "production"
  GEMINI_API_KEY: "your_gemini_api_key"
  ADMIN_PASSWORD: "your_secure_admin_password"
```

Do not commit real API keys to Git. For production, prefer Secret Manager or environment configuration in GCP.

Deploy:

```powershell
gcloud app deploy app.yaml
```

Open the deployed app:

```powershell
gcloud app browse
```

### Option 2: Deploy To Cloud Run

Cloud Run is a good option because the app already includes a `Dockerfile` and the server uses the `PORT` environment variable.

Create a Secret Manager secret for Gemini:

```powershell
echo your_gemini_api_key | gcloud secrets create gemini-api-key --data-file=-
```

Give Cloud Run permission to read the secret:

```powershell
gcloud secrets add-iam-policy-binding gemini-api-key --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
```

Create an Artifact Registry Docker repository:

```powershell
gcloud artifacts repositories create civicguide-repo --repository-format=docker --location=asia-south1
```

Build and push the container:

```powershell
gcloud builds submit --tag asia-south1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/civicguide-repo/civicguide-ai:latest
```

Deploy to Cloud Run:

```powershell
gcloud run deploy civicguide-ai --image asia-south1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/civicguide-repo/civicguide-ai:latest --region asia-south1 --allow-unauthenticated --port 8080 --set-env-vars NODE_ENV=production,ADMIN_PASSWORD=your_secure_admin_password --set-secrets GEMINI_API_KEY=gemini-api-key:latest
```

After deployment, Cloud Run prints the public service URL.

### GCP Deployment Notes

- Use `asia-south1` for an India-based region, or choose another region based on your users.
- Set a strong `ADMIN_PASSWORD` before deployment.
- Keep `GEMINI_API_KEY` out of source control.
- The AI Coach will still show the UI without Gemini, but AI answers require `GEMINI_API_KEY`.
- If you change frontend files, redeploy using the same App Engine or Cloud Run command.

## Design System

The UI follows a clean, trustworthy, government-quality design direction inspired by Digital India, Election Commission-style clarity, and minimal public-service interfaces.

Design choices include:

- Deep navy and indigo as primary trust colors.
- Saffron as the primary action accent.
- Green for success and India-themed confirmation states.
- White and light gray for clean neutral surfaces.
- Consistent cards, buttons, shadows, spacing, and rounded corners.
- Language-specific font rendering for Indic scripts.

## Accessibility And Responsiveness

The frontend includes:

- Semantic landmarks and headings.
- Keyboard-visible focus states.
- ARIA labels for navigation and chat.
- Mobile-first responsive layout.
- Drawer navigation on mobile.
- Collapsed sidebar on tablet.
- Reduced-motion support through `prefers-reduced-motion`.
- High contrast text and action states.

## AI Coach Prompting

The AI Coach is designed to be:

- Politically neutral.
- Citizen-friendly.
- Short and practical.
- Context-aware using eligibility results.
- Multilingual based on selected UI language.

The backend prompt includes:

- System role as an election coach.
- Safety and neutrality instructions.
- User eligibility context.
- Local knowledge base content.
- User question.

## Current Scope

This project is an educational and guidance-focused smart election assistant. It does not replace official Election Commission services. Users should verify final voter registration, polling booth, and election dates through official government portals.
