# InterviewAI: AI-Powered Interview Preparation System

InterviewAI is a comprehensive, production-ready career preparation platform built on the MERN stack (MongoDB, Express, React, Node.js) and powered by the Google Gemini AI API. The platform features an AI Resume Optimizer, an Adaptive Mock Interview Simulator, a Career Chatbot, and real-time dashboard performance diagnostics.

---

## Technical Architecture

The project is structured into two main sub-systems:
1. **client**: Frontend SPA bootstrapped with React, Vite, Tailwind CSS, Lucide Icons, and ChartJS/React-Chartjs-2.
2. **server**: Backend REST API built with Express, Mongoose, bcryptjs, JWT Authentication, natural language utility engines (Natural, Compromise, String-Similarity), pdf-parse, mammoth, and PDFKit.

```
project/
├── client/                 # React + Vite Frontend
│   ├── src/
│   │   ├── components/     # Navbar, Sidebar, Theme Controllers
│   │   ├── context/        # Authentication & Theme States
│   │   ├── pages/          # Dashboard, Simulator, Resume Analyzer, Performance
│   │   └── main.jsx        # Axios baseURL initialization
│   ├── package.json
│   └── vite.config.js      # Local dev ports and API proxy config
│
├── server/                 # Express REST API
│   ├── config/             # DB & Atlas configurations
│   ├── controllers/        # Route logic (Auth, Resume, Mock, Chat)
│   ├── middleware/         # Protected routes & file uploads
│   ├── models/             # Mongoose Schemas (User, Interview, Resume)
│   ├── routes/             # Route mapping and middleware gating
│   ├── utils/              # PDF generation, parsing, & Gemini API wrappers
│   ├── server.js           # Server port listen & connection verifications
│   └── package.json
```

---

## Features

### 1. Secure Authentication & User State
- Complete registration, sign-in, and private profiling.
- Standardized JWT authentication lifecycle via Bearer Tokens.
- Protected router layouts gating secure dashboard sub-pages.

### 2. AI Resume Optimizer & Hybrid ATS Scanners
- Text parsing support for both `.pdf` and `.docx` uploads.
- Algorithmic evaluation grading (out of 100) across Formatting, Skills coverage, Experience, Projects metrics, Academic credentials, and target Job Description keyword alignments.
- Google Gemini AI auditor providing detailed recruiter-style critiques, priority fixes, missing keywords, and action-verb suggesting rewrites.

### 3. Adaptive AI Mock Interview Simulator
- Calibration setups: candidate name, target role, category, duration, experience levels (fresher to senior), and job description parameters.
- Step-by-step adaptive question generation powered by Gemini: evaluates prior response quality and dynamically tunes the complexity of subsequent questions.
- Word count checks & simple-answer filters: scores blank or irrelevant responses (e.g. gibberish or unrelated text) low (0-15%) automatically.
- Comprehensive sub-metric diagnostics (Accuracy, Communication, Tech Depth, Confidence, Grammar, Relevance).

### 4. Interactive Performance Dashboard
- Statistics dashboard showcasing: Resume ATS history scores, total completed interviews, average rating scores, strongest subjects, and weakest focus areas.
- Interactive monthly mock progression bar-charts and ATS match line-graphs.
- Combining history logs, upload feeds, and shortcut panels.

### 5. Career Chatbot Copilot
- Context-aware chatbot maintaining the active conversation history (last 8 messages).
- Direct screen integrations: targets feedback relevant to the user's current route (e.g. `/resume` or `/interview`).
- Technical guides covering DSA topics, resume reviews, HR behavioural answers, system design, and career paths.

### 6. PDF Report Compilation & Export
- Local server-side PDF compilation using PDFKit.
- Includes candidate names, roles, hired choices, rating percentages, visual progress charts, positive listings, critique highlights, and preparation roadmaps.
- Secure frontend Axios download handlers saving files via native Blob structures.

---

## Setup & Local Installation

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- MongoDB (Local server or MongoDB Atlas Cluster URL)
- Gemini API Key

### 1. Clone & Configuration
Create a `.env` file under the `/server` directory:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/interviewai
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_google_gemini_api_key
```

If you deploy to production or run separate server environments, create `.env` under `/client`:
```env
VITE_API_URL=http://localhost:5000
```
*(Leave empty in local development to default to Vite's local dev proxies).*

### 2. Backend Boot
```bash
cd server
npm install
npm run dev
```
The server will bind to port `5000`. If standard MongoDB connection fails, it spins up an in-memory database instance automatically.

### 3. Frontend Boot
```bash
cd client
npm install
npm run dev
```
The client binds to `http://localhost:3000/`.

---

## Production Deployment Guide

### Database (MongoDB Atlas)
1. Register a cluster on MongoDB Atlas.
2. Allow access from `0.0.0.0/0` (all IPs) in Network Access settings.
3. Configure `MONGODB_URI` on Render to use the Atlas connection string.

### Backend (Render)
1. Connect your Github repository.
2. Select **Web Service** with the root directory set to `server`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Configure environment variables (`MONGODB_URI`, `GEMINI_API_KEY`, `JWT_SECRET`).

### Frontend (Vercel)
1. Add a project from your Github repository.
2. Set root directory to `client`.
3. Choose **Vite** framework preset.
4. Set environment variable `VITE_API_URL` to point to your live Render backend service URL.
5. Deploy.
