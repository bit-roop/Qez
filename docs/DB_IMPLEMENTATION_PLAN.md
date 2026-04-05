# Database Implementation Plan

## 1. PostgreSQL Responsibilities

Application code should not be trusted for critical quiz rules. PostgreSQL should enforce:

- one attempt per user per quiz
- valid quiz state and timing checks
- question ownership validation
- score and total time updates
- suspicious activity tracking integrity

## 2. Core Constraints

### Unique Constraints

- `users.email`
- `quizzes.join_code`
- `attempts(user_id, quiz_id)`
- `responses(attempt_id, question_id)`
- `questions(quiz_id, display_order)`
- `question_options(question_id, option_key)`

### Foreign Keys

- `quizzes.owner_id -> users.id`
- `questions.quiz_id -> quizzes.id`
- `question_options.question_id -> questions.id`
- `attempts.user_id -> users.id`
- `attempts.quiz_id -> quizzes.id`
- `responses.attempt_id -> attempts.id`
- `responses.question_id -> questions.id`
- `suspicious_events.attempt_id -> attempts.id`

### Check Constraints to Add in SQL Migration

- `starts_at < ends_at`
- `time_limit_seconds > 0`
- `total_time_seconds >= 0`
- `warning_level >= 0`
- `tab_switch_count >= 0`
- `max_attempts >= 1`

## 3. Stored Procedure Plan

## `submit_quiz`

Purpose:

- accept a participant id, quiz id, and JSON array of responses
- validate eligibility
- insert the attempt and response rows
- compute total score and total time
- mark the attempt submitted
- trigger webinar ranking update when applicable

Suggested signature:

```sql
submit_quiz(
  p_user_id bigint,
  p_quiz_id bigint,
  p_responses jsonb
)
```

### Validation Steps

1. ensure quiz exists
2. ensure quiz is `ACTIVE`
3. ensure current timestamp is between `starts_at` and `ends_at`
4. ensure user exists and has allowed role
5. ensure user has not already attempted the quiz
6. ensure all question ids in input belong to the quiz
7. ensure each question is answered at most once

### Transaction Outcome

- all inserts succeed together
- no partial attempt record remains on failure

## `update_webinar_rankings`

Purpose:

- rank completed attempts for webinar quizzes
- assign points by final ordering

Ordering:

1. `total_score DESC`
2. `total_time_seconds ASC`
3. `submitted_at ASC`

## 4. Trigger Plan

## Response Scoring Trigger

Trigger timing:

- `AFTER INSERT ON responses`

Responsibilities:

- compare `selected_option_key` with `questions.correct_option_key`
- update `responses.is_correct`
- increment `attempts.total_score` when correct
- add to `attempts.total_time_seconds`

Note:

If you prefer simpler debugging in the first version, compute score in the procedure and move to triggers in the final DBMS version.

## Suspicious Activity Trigger

Optional trigger or procedure helper:

- update `warning_level`
- increment `tab_switch_count` for tab events
- set `suspicious = true` when rule threshold is crossed

## 5. Views to Create

## `leaderboard_view`

Columns:

- quiz_id
- user_id
- user_name
- total_score
- total_time_seconds
- submitted_at
- rank

## `quiz_analytics_view`

Columns:

- quiz_id
- total_attempts
- avg_score
- avg_time
- suspicious_attempts

## `question_analytics_view`

Columns:

- question_id
- quiz_id
- attempts_count
- correct_count
- accuracy_percent
- avg_time_taken

## `student_analytics_view`

Columns:

- user_id
- total_attempts
- avg_score
- avg_time
- best_score

## 6. Index Plan

Essential indexes:

- `attempts(user_id, quiz_id)`
- `attempts(quiz_id, submitted_at)`
- `responses(attempt_id)`
- `responses(question_id)`
- `questions(quiz_id)`
- `suspicious_events(attempt_id, created_at)`
- `webinar_results(quiz_id, rank)`

## 7. Security Notes

The backend should:

- validate JWT
- identify the real user from token data
- never accept score from the frontend
- never accept result visibility decisions from the frontend

The database should remain the source of truth for submission state and scoring.

## 8. Suggested Milestone SQL Order

1. tables and enums
2. foreign keys and constraints
3. indexes
4. views
5. scoring trigger
6. `submit_quiz` procedure
7. `update_webinar_rankings` procedure
8. sample seed data

## 9. Demo Queries

Useful queries for presentation:

- top 10 quiz leaderboard
- hardest question in a quiz
- average score by quiz
- suspicious attempts for a teacher's quiz
- webinar winners with awarded points
