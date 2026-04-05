# Qez Project Blueprint

## 1. Product Summary

Qez is a unified quiz platform with two operating modes:

- `Academic Mode`
  - teacher-controlled assessments
  - timed questions
  - private results and analytics
  - anti-cheat event logging
- `Webinar Mode`
  - live public competition
  - speed-based ranking
  - prize distribution logic
  - optional public leaderboard

The product should feel like one system with configurable quiz behavior rather than two unrelated apps.

## 2. Core Modules

### Authentication and Users

- registration and login
- JWT-based session handling
- password hashing with bcrypt
- role-based authorization

### Quiz Management

- create quiz
- edit quiz
- archive or delete quiz
- draft, active, completed state management
- academic or webinar mode selection

### Question Management

- MCQ questions with four options
- difficulty tagging
- per-question timer
- optional reusable question bank

### Attempt and Submission Engine

- one attempt per participant per quiz
- secure response insertion
- score calculation on the server
- total time aggregation
- automatic submission when time expires

### Leaderboard and Ranking

- score descending
- total time ascending
- public or private visibility
- special webinar points assignment

### Analytics and Reporting

- student performance
- quiz-level analytics
- question difficulty analytics
- suspicious behavior visibility for teachers/admins

### Anti-Cheat Monitoring

- tab switch detection
- right-click detection
- devtools heuristic detection
- warning escalation
- suspicious event logging

## 3. Key User Flows

### Teacher Flow

1. Login
2. Create quiz
3. Add questions and timings
4. Publish quiz
5. Monitor attempts
6. View results, leaderboard, and analytics

### Student Flow

1. Login
2. Join quiz using code or dashboard
3. Attempt quiz
4. Receive warnings if suspicious behavior occurs
5. Submit or auto-submit
6. View results only if allowed

### Webinar Host Flow

1. Login
2. Create webinar quiz
3. Start event
4. Participants answer in live mode
5. Leaderboard updates
6. Winners identified for prize distribution

## 4. Suggested Frontend Architecture

### Public Pages

- landing page
- login page
- register page
- join quiz page

### Role-Based Dashboards

- student dashboard
- teacher dashboard
- webinar host dashboard
- admin dashboard

### Feature Pages

- create quiz wizard
- question bank manager
- quiz details page
- quiz attempt page
- leaderboard page
- analytics page
- suspicious events review page

### Important UI Components

- `Navbar`
- `RoleGuard`
- `QuizCard`
- `QuestionCard`
- `QuestionEditor`
- `QuizTimer`
- `AttemptNavigator`
- `LeaderboardTable`
- `AnalyticsCharts`
- `WarningOverlay`
- `JoinCodeModal`

## 5. Suggested Next.js App Structure

```text
src/
  app/
    (auth)/
      login/
      register/
    dashboard/
      student/
      teacher/
      host/
      admin/
    quizzes/
      create/
      [quizId]/
      [quizId]/attempt/
      [quizId]/leaderboard/
      [quizId]/analytics/
    api/
      auth/
      quizzes/
      attempts/
      leaderboard/
      analytics/
      suspicious-events/
  components/
    ui/
    auth/
    dashboard/
    quiz/
    leaderboard/
    analytics/
  lib/
    auth/
    prisma/
    validators/
    permissions/
  server/
    services/
    repositories/
    procedures/
  types/
```

## 6. Backend Responsibilities

- validate JWT
- enforce role restrictions
- validate quiz state and time windows
- call secure database logic for submission
- expose leaderboard and analytics endpoints
- log suspicious events

Critical rules should not rely only on the frontend.

## 7. Database Design Priorities

### Design Principles

- normalized schema
- strong foreign keys
- unique constraints for attempt control
- server-side scoring
- triggers and procedures for integrity
- views for leaderboard and analytics
- indexes for attempt-heavy queries

### Important Constraints

- one attempt per user per quiz
- responses must belong to questions from the same quiz
- attempts allowed only inside quiz time window
- only teacher, admin, or host can create quizzes
- only student can submit academic attempts

## 8. Entity Outline

### `users`

- identity and auth information
- role and profile details

### `quizzes`

- owner
- mode
- state
- time window
- result visibility settings

### `questions`

- quiz linkage
- statement
- difficulty
- allotted time
- answer key

### `options`

- option content for each question
- stable labels A, B, C, D

### `attempts`

- participant
- quiz
- submission status
- score
- total time
- warning metrics

### `responses`

- attempt linkage
- question linkage
- selected option
- correctness
- time taken

### `suspicious_events`

- attempt linkage
- event type
- timestamp
- metadata

## 9. Leaderboard Logic

### Base Ranking

Order by:

1. `total_score DESC`
2. `total_time ASC`
3. `submitted_at ASC`

### Webinar Prize Points

Suggested points system:

- 1st: 5
- 2nd: 4
- 3rd: 3
- all other correct participants: 1

This can be stored in a materialized result table or computed dynamically depending on scale.

## 10. Anti-Cheat Policy

Qez should not auto-disqualify users. It should:

- record suspicious events
- increase warning levels
- flag the attempt for review
- expose the data to teachers and admins

That makes the system fairer and easier to defend in a project presentation.

## 11. Analytics Ideas

### Student Analytics

- attempt history
- average score
- total quizzes attempted
- average response time

### Quiz Analytics

- total attempts
- average score
- completion rate
- average completion time

### Question Analytics

- hardest question
- easiest question
- average time taken
- option selection distribution

## 12. API Plan

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Quizzes

- `POST /api/quizzes`
- `GET /api/quizzes/:quizId`
- `PATCH /api/quizzes/:quizId`
- `PATCH /api/quizzes/:quizId/status`
- `POST /api/quizzes/join`

### Questions

- `POST /api/quizzes/:quizId/questions`
- `PATCH /api/questions/:questionId`
- `DELETE /api/questions/:questionId`

### Attempts

- `POST /api/attempts/start`
- `POST /api/attempts/submit`
- `GET /api/attempts/:attemptId`

### Leaderboard and Analytics

- `GET /api/quizzes/:quizId/leaderboard`
- `GET /api/quizzes/:quizId/analytics`
- `GET /api/students/me/analytics`

### Suspicious Events

- `POST /api/suspicious-events`

## 13. Recommended First Deliverable

Build this first:

1. auth
2. role-based dashboard shells
3. quiz CRUD
4. question CRUD
5. attempt creation and submission
6. score calculation
7. leaderboard page

Add analytics and anti-cheat immediately after that.

## 14. Viva / Presentation Talking Points

- why PostgreSQL was chosen
- why Prisma improves type safety
- why one-attempt constraints matter
- why scoring is enforced on the server
- how triggers and procedures improve data integrity
- how webinar ranking differs from academic evaluation
- why anti-cheat logging is better than automatic punishment

