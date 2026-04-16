# Qez — Quiz Made Easy 🎯

A real-time competitive assessment platform built with **Next.js 15**, **PostgreSQL (Neon DB)**, and **Prisma ORM**.

🌐 **Live App:** [qez.vercel.app](https://qez.vercel.app)

## 👥 Project Members

| # | Name | Reg No |
|---|------|--------|
| 1 | Roopesh Singhal | RA2411030030042 |
| 2 | Nikunj Miglani | RA2411030030043 |

**Guide:** Dr. Anirudha Gaikwad, Assistant Professor, Dept. of CSE  
**Institution:** SRM Institute of Science & Technology, Delhi-NCR Campus

---

## 📁 Project Documents

| Sr | Description | Link |
|----|-------------|------|
| 1 | Project Code (GitHub) | [View](https://github.com/bit-roop/qez) |
| 2 | RA2411030030042 — Project Report | [View](https://drive.google.com/file/d/1eAwcLCVuA1cGre2e_TJs6dopWXeC2Ofb/view?usp=drive_link) |
| 3 | RA2411030030043 — Project Report | [View](https://drive.google.com/file/d/1WQ_9q7u6Eq0z9U-kZC7nnivue6LVIKGf/view?usp=share_link) |
| 4 | Final PPT | [View](https://drive.google.com/file/d/1RTK8MIeL28GCEN3vmWALT_2Y1qAwWdw5/view?usp=drive_link) |
| 5 | RA2411030030042 — Certificate | [View](https://drive.google.com/file/d/1gUYLUBmzC-jp7dMVa3SGqbroSgV34D4i/view?usp=drive_link) |
| 6 | RA2411030030043 — Certificate | [View](https://drive.google.com/file/d/1Kfuwe-UkRL4jxhaJ5QRFgCvnaF0bYyGL/view?usp=share_link) |
| 7 | RA2411030030042 — Course Report | [View](https://drive.google.com/file/d/1H4JLzbDeZ9s87UZE5tRNBkep89HSIdeQ/view?usp=drive_link) |
| 8 | RA2411030030043 — Course Report | [View](https://drive.google.com/file/d/1PKWay00mn-YNLR1P3A5Hjpq9T--PtBt1/view?usp=share_link) |

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 🔐 **Authentication** | Email/password login with bcrypt hashing, JWT tokens, Google OAuth 2.0, email verification, and Cloudflare Turnstile CAPTCHA |
| 👤 **Role-Based Access** | Four distinct roles — Student, Teacher, Webinar Host, Admin — each with layered permission checks at API and DB level |
| 📝 **Quiz Creation** | Teachers create MCQ quizzes with per-question timers, difficulty levels, shuffle options, and a unique 6-character join code |
| 🎓 **Academic Mode** | Timed institutional assessments with private results, anti-cheat monitoring, and per-question answer validation |
| 🏆 **Webinar Mode** | Live competitive quiz events with real-time leaderboard streaming via Server-Sent Events (SSE) |
| 🚨 **Anti-Cheat System** | Detects and logs tab switches, right-clicks, DevTools attempts, and fullscreen exits — stored in a dedicated `SuspiciousEvent` table |
| 💾 **Draft Recovery** | Answers auto-saved as JSONB in PostgreSQL; students resume from where they left off after a page refresh |
| 📊 **Analytics Dashboard** | Per-quiz analytics including average score, accuracy by question, warning level distribution, and best performer |
| 🏅 **Certificates** | PDF completion certificates generated and downloadable per attempt; bulk export for teachers |
| 🗂️ **Admin Panel** | Platform-wide user management and overview statistics |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router), React 19, Tailwind CSS, Framer Motion |
| **Backend** | Next.js API Route Handlers, Zod validation, jsonwebtoken, bcryptjs, Nodemailer |
| **Database** | PostgreSQL on Neon DB (serverless), Prisma ORM |
| **Auth** | JWT (7-day), Google OAuth 2.0, Cloudflare Turnstile CAPTCHA |
| **Deployment** | Vercel (CI/CD from GitHub) |
| **Email** | Gmail SMTP via Nodemailer |

---

## 🗄️ Database Schema (11 Tables)

```
User              — All registered users across all roles
Quiz              — Quiz metadata, mode, state, access control
Question          — MCQ questions with timers and display order
QuestionOption    — Four answer choices per question
Attempt           — Per-user quiz attempt with draft JSONB columns
Response          — Per-question answers linked to each attempt
SuspiciousEvent   — Anti-cheat event log linked to attempts
WebinarResult     — Final rankings for webinar quiz participants
CertificateClaim  — Certificate records per user per quiz
PasswordResetToken
EmailVerificationToken
```

PostgreSQL enums used: `UserRole`, `QuizMode`, `QuizState`, `DifficultyLevel`, `QuestionType`, `AttemptStatus`, `LeaderboardVisibility`, `SuspiciousEventType`

---

## ⚙️ Environment Setup

Create a `.env` file at the project root with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Auth
JWT_SECRET="your_random_secret"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
APP_URL="https://qez.vercel.app"
NEXT_PUBLIC_APP_URL="https://qez.vercel.app"
NEXT_PUBLIC_APP_NAME="Qez"
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED="true"

# Admin
ADMIN_EMAIL=""
ADMIN_PASSWORD=""

# CAPTCHA (Cloudflare Turnstile)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
TURNSTILE_SECRET_KEY=""

# SMTP Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="qez.quiz@gmail.com"
SMTP_PASS=""
SMTP_FROM_EMAIL="qez.quiz@gmail.com"
```

---

## 🚀 Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/bit-roop/qez.git
cd qez
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env
# Fill in the values as described above
```

### 4. Run Prisma migrations
```bash
npx prisma migrate deploy
npx prisma generate
```

### 5. Start the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
qez/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # Register, Login, OAuth, Reset Password
│   │   │   ├── quizzes/       # CRUD, join, attempt, leaderboard
│   │   │   ├── attempts/      # Submission and draft saving
│   │   │   ├── analytics/     # Quiz and question analytics
│   │   │   ├── suspicious-events/  # Anti-cheat event reporting
│   │   │   ├── admin/         # Admin overview and user management
│   │   │   └── profile/       # User profile endpoints
│   │   ├── dashboard/         # Role-based dashboards
│   │   └── quizzes/[quizId]/  # Attempt, result, leaderboard pages
│   ├── components/            # Reusable UI components
│   ├── lib/                   # Auth, Prisma client, mail, API helpers
│   └── types/                 # TypeScript type definitions
├── prisma/
│   ├── schema.prisma          # Single source of truth for DB schema
│   └── migrations/            # Version-controlled SQL migrations
├── public/                    # Static assets
├── .env.example               # Environment variable template
└── package.json
```

---

## 🔑 Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate and receive JWT |
| `POST` | `/api/quizzes` | Create a quiz (Teacher/Admin) |
| `POST` | `/api/quizzes/join` | Join quiz by 6-char code (Student) |
| `POST` | `/api/attempts/submit` | Submit attempt — server-side scoring |
| `GET` | `/api/quizzes/[id]/leaderboard` | Fetch ranked leaderboard |
| `GET` | `/api/quizzes/[id]/leaderboard/stream` | SSE stream for live leaderboard |
| `GET` | `/api/analytics/quizzes/[id]` | Full quiz analytics (Teacher/Admin) |
| `POST` | `/api/suspicious-events` | Log anti-cheat event |
| `GET` | `/api/quizzes/[id]/certificate/pdf` | Download PDF certificate |

---

## 🧠 DBMS Concepts Demonstrated

- Relational schema design across **11 tables** with full normalisation
- **Foreign key constraints** with CASCADE and RESTRICT behaviours
- **PostgreSQL enum types** for domain-level integrity
- **Unique constraints** (e.g., one attempt per user per quiz)
- **JSONB columns** for semi-structured draft answer storage
- **Strategic indexing** on attempt, response, and leaderboard queries
- **Prisma Migrate** for version-controlled schema migrations
- Planned **SQL Views** and **PL/pgSQL Stored Procedures** for future DB-layer logic

---

## ⚠️ Known Limitations

- Stored procedures (`submit_quiz`, `update_webinar_rankings`) are planned but currently implemented at the application layer
- No database-level triggers yet — scoring updates are handled in API code
- Only MCQ question type is currently supported (schema is extensible)
- No full-text search on questions

---

## 🔮 Future Enhancements

- PL/pgSQL stored procedures and AFTER INSERT triggers for score updates
- SQL Views for leaderboard, analytics, and student dashboards
- Additional question types: True/False, Short Answer, Fill-in-the-Blank
- Reusable question bank shared across quizzes
- React Native mobile app
- Webcam-based proctoring integration
- Multi-language (i18n) support

---

## 📜 License

This project was developed as an academic submission for the B.Tech CSE programme at SRM Institute of Science & Technology, Delhi-NCR Campus (April 2026).
