"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-auth";

type QuizQuestionOption = {
  id?: string;
  optionKey: "A" | "B" | "C" | "D";
  optionText: string;
};

type QuizQuestion = {
  id?: string;
  prompt: string;
  explanation?: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  timeLimitSeconds: number;
  displayOrder: number;
  correctOptionKey: "A" | "B" | "C" | "D";
  options: QuizQuestionOption[];
};

type TeacherQuizDetail = {
  id: string;
  title: string;
  description?: string | null;
  state: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  mode: "ACADEMIC" | "WEBINAR";
  joinCode: string;
  startsAt: string;
  endsAt: string;
  allowLeaderboard: boolean;
  leaderboardVisibility: "HIDDEN" | "TOP_10" | "FULL";
  showResultsToStudents: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  _count: {
    attempts: number;
    questions?: number;
  };
  questions: QuizQuestion[];
};

type GetQuizResponse = {
  quiz: TeacherQuizDetail;
};

type UpdateQuizResponse = {
  quiz: TeacherQuizDetail;
};

type QuizDetailClientProps = {
  quizId: string;
};

type QuizFormState = {
  title: string;
  description: string;
  mode: TeacherQuizDetail["mode"];
  startsAt: string;
  endsAt: string;
  allowLeaderboard: boolean;
  leaderboardVisibility: TeacherQuizDetail["leaderboardVisibility"];
  showResultsToStudents: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
};

const emptyQuestion = (displayOrder: number): QuizQuestion => ({
  prompt: "",
  explanation: "",
  difficulty: "MEDIUM",
  timeLimitSeconds: 30,
  displayOrder,
  correctOptionKey: "A",
  options: [
    { optionKey: "A", optionText: "" },
    { optionKey: "B", optionText: "" },
    { optionKey: "C", optionText: "" },
    { optionKey: "D", optionText: "" }
  ]
});

function toDateTimeInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function buildFormState(quiz: TeacherQuizDetail): QuizFormState {
  return {
    title: quiz.title,
    description: quiz.description ?? "",
    mode: quiz.mode,
    startsAt: toDateTimeInput(quiz.startsAt),
    endsAt: toDateTimeInput(quiz.endsAt),
    allowLeaderboard: quiz.allowLeaderboard,
    leaderboardVisibility: quiz.leaderboardVisibility,
    showResultsToStudents: quiz.showResultsToStudents,
    shuffleQuestions: quiz.shuffleQuestions,
    shuffleOptions: quiz.shuffleOptions
  };
}

function cloneQuestions(questions: QuizQuestion[]) {
  return questions.map((question, questionIndex) => ({
    ...question,
    explanation: question.explanation ?? "",
    displayOrder: questionIndex + 1,
    options: question.options.map((option) => ({ ...option }))
  }));
}

export function QuizDetailClient({ quizId }: QuizDetailClientProps) {
  const [quiz, setQuiz] = useState<TeacherQuizDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [draggedQuestionIndex, setDraggedQuestionIndex] = useState<number | null>(null);
  const [formState, setFormState] = useState<QuizFormState | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  const editingLocked = (quiz?._count.attempts ?? 0) > 0;

  async function loadQuiz() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiFetch<GetQuizResponse>(`/api/quizzes/${quizId}`, {
        method: "GET"
      });

      setQuiz(data.quiz);
      setFormState(buildFormState(data.quiz));
      setQuestions(cloneQuestions(data.quiz.questions));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load this quiz.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadQuiz();
  }, [quizId]);

  function startEditing() {
    if (!quiz || editingLocked) {
      return;
    }

    setFormState(buildFormState(quiz));
    setQuestions(cloneQuestions(quiz.questions));
    setMessage(null);
    setError(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    if (!quiz) {
      return;
    }

    setFormState(buildFormState(quiz));
    setQuestions(cloneQuestions(quiz.questions));
    setIsEditing(false);
    setError(null);
    setMessage(null);
  }

  function updateFormState<Key extends keyof QuizFormState>(key: Key, value: QuizFormState[Key]) {
    setFormState((current) => (current ? { ...current, [key]: value } : current));
  }

  function updateQuestion(index: number, key: keyof QuizQuestion, value: string | number) {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, [key]: value } : question
      )
    );
  }

  function updateOption(questionIndex: number, optionIndex: number, value: string) {
    setQuestions((current) =>
      current.map((question, currentQuestionIndex) =>
        currentQuestionIndex === questionIndex
          ? {
              ...question,
              options: question.options.map((option, currentOptionIndex) =>
                currentOptionIndex === optionIndex ? { ...option, optionText: value } : option
              )
            }
          : question
      )
    );
  }

  function addQuestion() {
    setQuestions((current) => [...current, emptyQuestion(current.length + 1)]);
  }

  function removeQuestion(index: number) {
    setQuestions((current) =>
      current
        .filter((_, questionIndex) => questionIndex !== index)
        .map((question, questionIndex) => ({
          ...question,
          displayOrder: questionIndex + 1
        }))
    );
  }

  function moveQuestion(index: number, targetIndex: number) {
    setQuestions((current) => {
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [movedQuestion] = next.splice(index, 1);
      next.splice(targetIndex, 0, movedQuestion);

      return next.map((question, questionIndex) => ({
        ...question,
        displayOrder: questionIndex + 1
      }));
    });
  }

  function handleQuestionDrop(targetIndex: number) {
    if (draggedQuestionIndex === null || draggedQuestionIndex === targetIndex) {
      setDraggedQuestionIndex(null);
      return;
    }

    moveQuestion(draggedQuestionIndex, targetIndex);
    setDraggedQuestionIndex(null);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formState) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const data = await apiFetch<UpdateQuizResponse>(`/api/quizzes/${quizId}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...formState,
          questions: questions.map((question, questionIndex) => ({
            prompt: question.prompt,
            explanation: question.explanation?.trim() ? question.explanation : undefined,
            difficulty: question.difficulty,
            timeLimitSeconds: question.timeLimitSeconds,
            displayOrder: questionIndex + 1,
            correctOptionKey: question.correctOptionKey,
            options: question.options.map((option) => ({
              optionKey: option.optionKey,
              optionText: option.optionText
            }))
          }))
        })
      });

      setQuiz(data.quiz);
      setFormState(buildFormState(data.quiz));
      setQuestions(cloneQuestions(data.quiz.questions));
      setIsEditing(false);
      setMessage("Quiz updated successfully.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save quiz.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="card">
        <span className="eyebrow">Loading</span>
        <h1>Quiz Workspace</h1>
        <p className="section-copy">Fetching the quiz and question set.</p>
      </section>
    );
  }

  if (!quiz || !formState) {
    return (
      <section className="card">
        <span className="eyebrow">Unavailable</span>
        <h1>Quiz Workspace</h1>
        <p className="form-error">{error ?? "Quiz not found."}</p>
      </section>
    );
  }

  return (
    <div className="quiz-detail-shell">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <span className="eyebrow">Quiz Workspace</span>
          <h1>{quiz.title}</h1>
          <p className="section-copy">
            Review the full question flow, verify timing, and make final edits before students
            begin.
          </p>
        </div>
        <div className="dashboard-actions">
          <Link className="secondary-link" href="/dashboard/teacher">
            Back to dashboard
          </Link>
          {!editingLocked ? (
            <button
              className="primary-link button-reset"
              onClick={isEditing ? cancelEditing : startEditing}
              type="button"
            >
              {isEditing ? "Cancel editing" : "Edit quiz"}
            </button>
          ) : null}
        </div>
      </section>

      {message ? <p className="form-success">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <section className="quiz-detail-grid">
        <article className="card quiz-detail-summary">
          <div className="quiz-list-meta">
            <span className={`pill pill-${quiz.state.toLowerCase()}`}>{quiz.state}</span>
            <span className={`pill ${quiz.mode === "ACADEMIC" ? "pill--academic" : "pill--webinar"}`}>
              {quiz.mode}
            </span>
          </div>
          <dl className="quiz-stats">
            <div>
              <dt>Join code</dt>
              <dd>{quiz.joinCode}</dd>
            </div>
            <div>
              <dt>Questions</dt>
              <dd>{quiz.questions.length}</dd>
            </div>
            <div>
              <dt>Attempts</dt>
              <dd>{quiz._count.attempts}</dd>
            </div>
            <div>
              <dt>Window</dt>
              <dd>
                {new Date(quiz.startsAt).toLocaleString()} to {new Date(quiz.endsAt).toLocaleString()}
              </dd>
            </div>
          </dl>
          <div className="quiz-summary-card__meta">
            <span className="question-badge">
              {quiz.allowLeaderboard ? "Leaderboard on" : "Leaderboard off"}
            </span>
            <span className="question-badge">{quiz.leaderboardVisibility}</span>
            <span className="question-badge">
              {quiz.showResultsToStudents ? "Student results visible" : "Teacher-only results"}
            </span>
          </div>
          <div className="quiz-summary-card__meta">
            {quiz.shuffleQuestions ? <span className="question-badge">Shuffled questions</span> : null}
            {quiz.shuffleOptions ? <span className="question-badge">Shuffled options</span> : null}
          </div>
          {editingLocked ? (
            <div className="locked-note">
              Editing is locked because this quiz already has student attempts.
            </div>
          ) : (
            <div className="locked-note locked-note--soft">
              No attempts yet, so you can still edit questions and quiz settings.
            </div>
          )}
        </article>

        {isEditing ? (
          <article className="card dashboard-card--full">
            <span className="eyebrow">Edit Quiz</span>
            <h2>Update settings and question order</h2>
            <form className="teacher-form" onSubmit={handleSave}>
              <div className="two-column-grid">
                <label className="field">
                  <span>Quiz title</span>
                  <input
                    onChange={(event) => updateFormState("title", event.target.value)}
                    required
                    type="text"
                    value={formState.title}
                  />
                </label>
                <label className="field">
                  <span>Mode</span>
                  <select
                    onChange={(event) =>
                      updateFormState("mode", event.target.value as TeacherQuizDetail["mode"])
                    }
                    value={formState.mode}
                  >
                    <option value="ACADEMIC">Academic</option>
                    <option value="WEBINAR">Webinar</option>
                  </select>
                </label>
              </div>

              <label className="field">
                <span>Description</span>
                <textarea
                  onChange={(event) => updateFormState("description", event.target.value)}
                  rows={4}
                  value={formState.description}
                />
              </label>

              <div className="two-column-grid">
                <label className="field">
                  <span>Start time</span>
                  <input
                    onChange={(event) => updateFormState("startsAt", event.target.value)}
                    required
                    type="datetime-local"
                    value={formState.startsAt}
                  />
                </label>
                <label className="field">
                  <span>End time</span>
                  <input
                    onChange={(event) => updateFormState("endsAt", event.target.value)}
                    required
                    type="datetime-local"
                    value={formState.endsAt}
                  />
                </label>
              </div>

              <div className="toggle-grid">
                <label className="toggle-row">
                  <input
                    checked={formState.allowLeaderboard}
                    onChange={(event) => updateFormState("allowLeaderboard", event.target.checked)}
                    type="checkbox"
                  />
                  <span>Enable leaderboard</span>
                </label>
                <label className="toggle-row">
                  <input
                    checked={formState.showResultsToStudents}
                    onChange={(event) =>
                      updateFormState("showResultsToStudents", event.target.checked)
                    }
                    type="checkbox"
                  />
                  <span>Show results to students</span>
                </label>
                <label className="toggle-row">
                  <input
                    checked={formState.shuffleQuestions}
                    onChange={(event) => updateFormState("shuffleQuestions", event.target.checked)}
                    type="checkbox"
                  />
                  <span>Shuffle questions</span>
                </label>
                <label className="toggle-row">
                  <input
                    checked={formState.shuffleOptions}
                    onChange={(event) => updateFormState("shuffleOptions", event.target.checked)}
                    type="checkbox"
                  />
                  <span>Shuffle options</span>
                </label>
              </div>

              <label className="field">
                <span>Leaderboard visibility</span>
                <select
                  onChange={(event) =>
                    updateFormState(
                      "leaderboardVisibility",
                      event.target.value as TeacherQuizDetail["leaderboardVisibility"]
                    )
                  }
                  value={formState.leaderboardVisibility}
                >
                  <option value="HIDDEN">Hidden</option>
                  <option value="TOP_10">Top 10</option>
                  <option value="FULL">Full</option>
                </select>
              </label>

              <div className="question-builder-header">
                <div>
                  <span className="eyebrow">Questions</span>
                  <h3>Question editor</h3>
                </div>
                <span className="inline-note">Drag the handle to reorder questions.</span>
              </div>

              <div className="question-stack">
                {questions.map((question, questionIndex) => (
                  <article
                    className={`question-editor ${draggedQuestionIndex === questionIndex ? "question-editor--dragging" : ""}`}
                    key={`${questionIndex}-${question.displayOrder}`}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleQuestionDrop(questionIndex)}
                  >
                    <div className="question-editor-header">
                      <h4>Question {questionIndex + 1}</h4>
                      <div className="question-editor-actions">
                        <button
                          aria-label={`Drag question ${questionIndex + 1}`}
                          className="drag-handle button-reset"
                          draggable
                          onDragEnd={() => setDraggedQuestionIndex(null)}
                          onDragStart={() => setDraggedQuestionIndex(questionIndex)}
                          type="button"
                        >
                          <span />
                          <span />
                          <span />
                        </button>
                        {questions.length > 1 ? (
                          <button
                            className="text-button button-reset"
                            onClick={() => removeQuestion(questionIndex)}
                            type="button"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <label className="field">
                      <span>Prompt</span>
                      <textarea
                        onChange={(event) =>
                          updateQuestion(questionIndex, "prompt", event.target.value)
                        }
                        rows={3}
                        value={question.prompt}
                      />
                    </label>

                    <label className="field">
                      <span>Explanation</span>
                      <textarea
                        onChange={(event) =>
                          updateQuestion(questionIndex, "explanation", event.target.value)
                        }
                        rows={2}
                        value={question.explanation ?? ""}
                      />
                    </label>

                    <div className="three-column-grid">
                      <label className="field">
                        <span>Difficulty</span>
                        <select
                          onChange={(event) =>
                            updateQuestion(questionIndex, "difficulty", event.target.value)
                          }
                          value={question.difficulty}
                        >
                          <option value="EASY">Easy</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HARD">Hard</option>
                        </select>
                      </label>
                      <label className="field">
                        <span>Time limit (seconds)</span>
                        <input
                          min={5}
                          onChange={(event) =>
                            updateQuestion(questionIndex, "timeLimitSeconds", Number(event.target.value))
                          }
                          type="number"
                          value={question.timeLimitSeconds}
                        />
                      </label>
                      <label className="field">
                        <span>Correct option</span>
                        <select
                          onChange={(event) =>
                            updateQuestion(questionIndex, "correctOptionKey", event.target.value)
                          }
                          value={question.correctOptionKey}
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </label>
                    </div>

                    <div className="option-grid">
                      {question.options.map((option, optionIndex) => (
                        <label className="field" key={`${questionIndex}-${option.optionKey}`}>
                          <span>Option {option.optionKey}</span>
                          <input
                            onChange={(event) =>
                              updateOption(questionIndex, optionIndex, event.target.value)
                            }
                            type="text"
                            value={option.optionText}
                          />
                        </label>
                      ))}
                    </div>
                  </article>
                ))}
              </div>

              <div className="question-builder-footer">
                <button className="secondary-link button-reset" onClick={addQuestion} type="button">
                  Add question below
                </button>
              </div>

              <div className="button-row">
                <button
                  className="secondary-button"
                  onClick={cancelEditing}
                  type="button"
                >
                  Cancel
                </button>
                <button className="primary-button" disabled={isSaving} type="submit">
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </article>
        ) : (
          <article className="card dashboard-card--full">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Quiz Overview</span>
                <h2>All questions</h2>
              </div>
              <span className="question-badge">{quiz.questions.length} questions</span>
            </div>
            <p className="section-copy">{quiz.description || "No description provided."}</p>

            <div className="question-stack">
              {quiz.questions.map((question) => (
                <article className="question-editor" key={question.id ?? question.displayOrder}>
                  <div className="question-editor-header">
                    <div>
                      <span className="question-order-badge">Question {question.displayOrder}</span>
                      <h4>{question.prompt}</h4>
                    </div>
                    <div className="quiz-summary-card__meta">
                      <span className="question-badge">{question.difficulty}</span>
                      <span className="question-badge">{question.timeLimitSeconds}s</span>
                    </div>
                  </div>
                  {question.explanation ? (
                    <p className="section-copy">{question.explanation}</p>
                  ) : null}
                  <div className="option-grid">
                    {question.options.map((option) => (
                      <div
                        className={`option-preview ${option.optionKey === question.correctOptionKey ? "option-preview--correct" : ""}`}
                        key={option.id ?? option.optionKey}
                      >
                        <strong>{option.optionKey}</strong>
                        <span>{option.optionText}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </article>
        )}
      </section>
    </div>
  );
}
