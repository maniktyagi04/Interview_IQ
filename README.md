# 🧠 InterviewIQ — AI Interview Preparation Portal

A **portfolio-grade full-stack web application** that helps developers ace technical interviews through AI-powered mock sessions, detailed feedback, resume analysis, and progress tracking.

> Built with: React.js · Node.js · Express.js · PostgreSQL · Prisma · OpenAI GPT-4o · JWT Auth · Tailwind CSS

---

## ✨ Features

### 👤 User
- **Mock Interviews** — 5-question AI-evaluated sessions across 5 tech domains
- **Detailed Reports** — Score breakdown, strengths, weaknesses, and improvement suggestions
- **Resume Analyzer** — Upload PDF and get role-alignment feedback with missing keywords
- **Smart Notes** — Searchable notes workspace with colorful card layout
- **Profile Management** — Avatar upload, password change, account settings
- **Analytics Dashboard** — Radial score gauge, progress history chart

### 🛡️ Admin
- **Review Queue** — Validate AI-generated reports before they reach users
- **User Management** — Block, unblock, or delete users
- **Question Bank** — Add, edit, or delete interview questions (45 pre-seeded)
- **Platform Analytics** — Total users, interviews, pending reviews, domain breakdown

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js (Vite), Tailwind CSS v4, React Router v6 |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (Neon), Prisma ORM v7 |
| Auth | JWT Access Tokens + Refresh Tokens (HttpOnly cookies) |
| AI | OpenAI GPT-4o (evaluation + resume analysis) |
| File Upload | Multer (images + PDFs) |
| Charts | Recharts (RadialBar, Area, Pie) |
| Deployment | Frontend → Vercel, Backend → Render, DB → Neon |

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- PostgreSQL database (local or [Neon](https://neon.tech))
- OpenAI API Key

### 1. Clone the repo
```bash
git clone https://github.com/maniktyagi04/Interview_IQ.git
cd Interview_IQ
```

### 2. Setup Backend
```bash
cd backend
cp .env.example .env      # fill in your values
npm install
npx prisma migrate deploy
npm run seed              # seeds 45 questions + admin/user accounts
npm run dev               # runs on http://localhost:5001
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev               # runs on http://localhost:5173
```

### Environment Variables (Backend `.env`)
```env
DATABASE_URL=postgresql://user:password@host/db
JWT_SECRET=your_super_secret_key
REFRESH_TOKEN_SECRET=your_refresh_secret
OPENAI_API_KEY=sk-...
PORT=5001
CLIENT_URL=http://localhost:5173
```

---

## 🔑 Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@interviewiq.com | admin123 |
| User | user@interviewiq.com | user123 |

---

## 📁 Project Structure

```
Interview_IQ/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database models
│   │   ├── client.js          # Prisma + pg adapter setup
│   │   └── seed.js            # Seed data (45 questions, demo users)
│   ├── controllers/           # Route handlers (auth, user, interview, etc.)
│   ├── middleware/            # JWT auth, RBAC, file upload
│   ├── routes/                # Express router definitions
│   └── server.js              # Express app entry point
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── user/          # Dashboard, Interview, Reports, Notes, Profile
    │   │   └── admin/         # Admin Dashboard, Users, Questions, Reviews
    │   ├── components/        # Layout, ProtectedRoute, AdminRoute
    │   ├── context/           # AuthContext (JWT session management)
    │   └── services/          # Axios API client with interceptors
    └── index.html
```

---

## 🔄 Interview Workflow

```
User selects domain + difficulty
    → Backend picks 5 random questions
    → User writes detailed answers
    → OpenAI evaluates each answer (score 1–10 + feedback)
    → AI generates overall report (summary, strengths, weaknesses)
    → Admin reviews and approves/rejects the report
    → User sees approved report in their dashboard
```

---

## 📜 License

MIT — Built as a portfolio project for internship recruitment.
