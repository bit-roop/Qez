# Qez

Qez is a competitive quiz and assessment platform designed for two main use cases:

- Academic Mode for schools, colleges, and universities
- Webinar Mode for live events, competitions, and prize distribution

The project is designed around PostgreSQL, Prisma, Next.js, and a role-based architecture that keeps critical quiz submission and scoring logic secure on the server side.

## Core Stack

- Database: PostgreSQL (Neon)
- ORM: Prisma
- Frontend: Next.js + React
- Backend: Next.js Route Handlers or Express + Prisma
- Deployment:
  - Frontend: Vercel
  - Backend: Railway or Render
  - Database: Neon

## Product Goals

- Allow teachers and webinar hosts to create timed quizzes
- Allow students and participants to submit secure quiz attempts
- Support auto-scoring, rankings, and analytics
- Support real-time or near real-time leaderboards
- Log suspicious behavior without automatically disqualifying users

## Main Roles

- `STUDENT`
- `TEACHER`
- `ADMIN`
- `WEBINAR_HOST`

## Modes

- `ACADEMIC`
- `WEBINAR`

## Suggested Build Order

1. Finalize database schema and relations
2. Set up Prisma and migrations
3. Implement auth and role-based access control
4. Build quiz creation and question management APIs
5. Implement secure submission logic and scoring
6. Build student quiz-taking interface
7. Build leaderboard and analytics pages
8. Add suspicious activity logging and overlays
9. Deploy and test end-to-end

## Project Docs

- Blueprint: `docs/PROJECT_BLUEPRINT.md`
- Prisma schema draft: `prisma/schema.prisma`
- Setup guide: `docs/SETUP.md`

## First Milestone

The first milestone should include:

- user auth
- role-based dashboards
- quiz CRUD
- question CRUD
- one-attempt submission flow
- score calculation
- leaderboard
