"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { clearSession, apiFetch } from "@/lib/client-auth";
import { AuthSession } from "@/types/client-auth";

type TeacherQuiz = {
  id: string;
  title: string;
  description?: string | null;
  state: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  mode: "ACADEMIC" | "WEBINAR";
  joinCode: string;
  startsAt: string;
  endsAt: string;
  allowLeaderboard: boolean;
  _count: {
    questions: number;
    attempts: number;
  };
};

type TeacherDashboardClientProps = {
  session: AuthSession;
};

type CreateQuizResponse = {
  quiz: TeacherQuiz;
};

type ListQuizResponse = {
  quizzes: TeacherQuiz[];
};

type UpdateQuizResponse = {
  quiz: TeacherQuiz;
};

type DeleteQuizResponse = {
  success: boolean;
  deletedQuizId: string;
  message: string;
};

const emptyQuestion = (displayOrder: number) => ({
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

export function TeacherDashboardClient({ session }: TeacherDashboardClientProps) {
  const [activePanel, setActivePanel] = useState<"create" | "library">(() => {
    if (typeof window === "undefined") {
      return "create";
    }

    const saved = window.sessionStorage.getItem("qez.teacher.dashboard.tab");
    return saved === "library" ? "library" : "create";
  });
  const [draggedQuestionIndex, setDraggedQuestionIndex] = useState<number | null>(null);
  const [quizzes, setQuizzes] = useState<TeacherQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState([emptyQuestion(1)]);

  const quizStats = {
    total: quizzes.length,
    live: quizzes.filter((quiz) => quiz.state === "ACTIVE").length,
    attempts: quizzes.reduce((sum, quiz) => sum + (quiz._count?.attempts ?? 0), 0),
    questions: quizzes.reduce((sum, quiz) => sum + (quiz._count?.questions ?? 0), 0)
  };

  async function loadQuizzes() {
    try {
      setIsLoading(true);
      const data = await apiFetch<ListQuizResponse>("/api/quizzes", {
        method: "GET"
      });
      setQuizzes(data.quizzes);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load quizzes.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadQuizzes();
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem("qez.teacher.dashboard.tab", activePanel);
  }, [activePanel]);

  async function updateQuizState(quizId: string, state: TeacherQuiz["state"]) {
    setError(null);
    setMessage(null);

    try {
      const data = await apiFetch<UpdateQuizResponse>(`/api/quizzes/${quizId}`, {
        method: "PATCH",
        body: JSON.stringify({ state })
      });

      setQuizzes((current) =>
        current.map((quiz) => (quiz.id === quizId ? data.quiz : quiz))
      );
      setMessage(`Quiz updated to ${state}.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update quiz.");
    }
  }

  function getStateActionClass(quizState: TeacherQuiz["state"], targetState: TeacherQuiz["state"]) {
    return quizState === targetState ? "primary-button" : "secondary-button";
  }

  async function deleteQuiz(quizId: string, title: string) {
    const confirmed = window.confirm(
      `Delete "${title}"? This will remove its questions, attempts, leaderboard entries, and suspicious-event logs.`
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    setMessage(null);

    try {
      const data = await apiFetch<DeleteQuizResponse>(`/api/quizzes/${quizId}`, {
        method: "DELETE"
      });

      setQuizzes((current) => current.filter((quiz) => quiz.id !== quizId));
      setMessage(data.message);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to delete quiz.");
    }
  }

  function updateQuestion(index: number, key: string, value: string | number) {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, [key]: value } : question
      )
    );
  }

  function updateOption(
    questionIndex: number,
    optionIndex: number,
    value: string
  ) {
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

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth"
        });
      });
    });
  }

  function removeQuestion(index: number) {
    setQuestions((current) =>
      current
        .filter((_, questionIndex) => questionIndex !== index)
        .map((question, nextIndex) => ({
          ...question,
          displayOrder: nextIndex + 1
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

  async function handleCreateQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    const form = event.currentTarget;

    const formData = new FormData(form);
    const payload = {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      mode: String(formData.get("mode") ?? "ACADEMIC"),
      startsAt: String(formData.get("startsAt") ?? ""),
      endsAt: String(formData.get("endsAt") ?? ""),
      allowLeaderboard: formData.get("allowLeaderboard") === "on",
      leaderboardVisibility: String(formData.get("leaderboardVisibility") ?? "HIDDEN"),
      showResultsToStudents: formData.get("showResultsToStudents") === "on",
      shuffleQuestions: formData.get("shuffleQuestions") === "on",
      shuffleOptions: formData.get("shuffleOptions") === "on",
      questions
    };

    try {
      const data = await apiFetch<CreateQuizResponse>("/api/quizzes", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setQuizzes((current) => [data.quiz, ...current]);
      setQuestions([emptyQuestion(1)]);
      form.reset();
      setMessage(`Quiz created successfully. Join code: ${data.quiz.joinCode}`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create quiz.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="dashboard-shell">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <span className="eyebrow">Teacher Workspace</span>
          <h1>Build quizzes, control timing, and monitor results from one screen.</h1>
          <p className="section-copy">
            Signed in as <strong>{session.user.name}</strong>. This is the operational center for
            timed classroom assessments and webinar competitions.
          </p>
        </div>
        <div className="dashboard-actions">
          <button
            className="secondary-link button-reset"
            onClick={() => {
              clearSession();
              window.location.href = "/login";
            }}
            type="button"
          >
            Logout
          </button>
        </div>
      </section>

      <section className="stats-grid">
        <article className="metric-card">
          <strong>{quizStats.total}</strong>
          <span>Total quizzes created</span>
        </article>
        <article className="metric-card">
          <strong>{quizStats.live}</strong>
          <span>Currently active quizzes</span>
        </article>
        <article className="metric-card">
          <strong>{quizStats.attempts}</strong>
          <span>Total attempts recorded so far</span>
        </article>
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-tabs">
          <button
            className={`dashboard-tab ${activePanel === "create" ? "dashboard-tab--active" : ""}`}
            onClick={() => setActivePanel("create")}
            type="button"
          >
            Create Quiz
          </button>
          <button
            className={`dashboard-tab ${activePanel === "library" ? "dashboard-tab--active" : ""}`}
            onClick={() => setActivePanel("library")}
            type="button"
          >
            Quiz Library
          </button>
        </div>

        {activePanel === "create" ? (
        <article className="card form-card dashboard-card--full">
          <span className="eyebrow">Create Quiz</span>
          <h2>New quiz setup</h2>
          <form className="teacher-form" onSubmit={handleCreateQuiz}>
            <div className="two-column-grid">
              <label className="field">
                <span>Quiz title</span>
                <input name="title" placeholder="DBMS Midterm Assessment" required type="text" />
              </label>

              <label className="field">
                <span>Mode</span>
                <select defaultValue="ACADEMIC" name="mode">
                  <option value="ACADEMIC">Academic</option>
                  <option value="WEBINAR">Webinar</option>
                </select>
              </label>
            </div>

            <label className="field">
              <span>Description</span>
              <textarea
                name="description"
                placeholder="Add quiz instructions, topic scope, or scoring notes"
                rows={4}
              />
            </label>

            <div className="two-column-grid">
              <label className="field">
                <span>Start time</span>
                <input name="startsAt" required type="datetime-local" />
              </label>

              <label className="field">
                <span>End time</span>
                <input name="endsAt" required type="datetime-local" />
              </label>
            </div>

            <div className="toggle-grid">
              <label className="toggle-row">
                <input name="allowLeaderboard" type="checkbox" />
                <span>Enable leaderboard</span>
              </label>
              <label className="toggle-row">
                <input name="showResultsToStudents" type="checkbox" />
                <span>Show results to students</span>
              </label>
              <label className="toggle-row">
                <input name="shuffleQuestions" type="checkbox" />
                <span>Shuffle questions</span>
              </label>
              <label className="toggle-row">
                <input name="shuffleOptions" type="checkbox" />
                <span>Shuffle options</span>
              </label>
            </div>

            <label className="field">
              <span>Leaderboard visibility</span>
              <select defaultValue="HIDDEN" name="leaderboardVisibility">
                <option value="HIDDEN">Hidden</option>
                <option value="TOP_10">Top 10</option>
                <option value="FULL">Full</option>
              </select>
            </label>

            <div className="question-builder-header">
              <div>
                <span className="eyebrow">Questions</span>
                <h3>Question builder</h3>
              </div>
            </div>

            <div className="question-stack">
              {questions.map((question, questionIndex) => (
                <article
                  className={`question-editor ${draggedQuestionIndex === questionIndex ? "question-editor--dragging" : ""}`}
                  key={question.displayOrder}
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
                      placeholder="Enter the question prompt"
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
                      placeholder="Optional explanation shown later"
                      rows={2}
                      value={question.explanation}
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
                          updateQuestion(
                            questionIndex,
                            "timeLimitSeconds",
                            Number(event.target.value)
                          )
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
                      <label className="field" key={option.optionKey}>
                        <span>Option {option.optionKey}</span>
                        <input
                          onChange={(event) =>
                            updateOption(questionIndex, optionIndex, event.target.value)
                          }
                          placeholder={`Write option ${option.optionKey}`}
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

            {message ? <p className="form-success">{message}</p> : null}
            {error ? <p className="form-error">{error}</p> : null}

            <button className="primary-link button-reset wide-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Creating quiz..." : "Create quiz"}
            </button>
          </form>
        </article>
        ) : (
        <article className="card dashboard-card--full">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Quiz Library</span>
              <h2>Your quizzes</h2>
            </div>
            <span className="question-badge">{quizStats.questions} total questions</span>
          </div>
          <p className="section-copy">
            Track draft quizzes, live quizzes, and post-attempt activity from a single list.
          </p>

          {isLoading ? <p className="section-copy">Loading quizzes...</p> : null}

          {!isLoading && quizzes.length === 0 ? (
            <div className="empty-state">
              <h3>No quizzes yet</h3>
              <p className="section-copy">Create your first quiz from the form on the left.</p>
            </div>
          ) : null}

          <div className="quiz-list">
            {quizzes.map((quiz) => (
              <article className="quiz-list-item" key={quiz.id}>
                <div className="quiz-list-meta">
                  <span className={`pill pill-${quiz.state.toLowerCase()}`}>{quiz.state}</span>
                  <span className="pill pill-outline">{quiz.mode}</span>
                </div>
                <h3>{quiz.title}</h3>
                <p>{quiz.description || "No description provided."}</p>
                <dl className="quiz-stats">
                  <div>
                    <dt>Join Code</dt>
                    <dd>{quiz.joinCode}</dd>
                  </div>
                  <div>
                    <dt>Questions</dt>
                    <dd>{quiz._count?.questions ?? 0}</dd>
                  </div>
                  <div>
                    <dt>Attempts</dt>
                    <dd>{quiz._count?.attempts ?? 0}</dd>
                  </div>
                </dl>
                <div className="quiz-actions">
                  <Link className="secondary-button" href={`/quizzes/${quiz.id}`}>
                    View quiz
                  </Link>
                  {quiz._count?.attempts === 0 ? (
                    <Link className="primary-button" href={`/quizzes/${quiz.id}`}>
                      Edit quiz
                    </Link>
                  ) : (
                    <span className="question-badge">Editing locked after attempts</span>
                  )}
                  <Link className="secondary-button" href={`/quizzes/${quiz.id}/monitor`}>
                    Review flags
                  </Link>
                  <Link className="secondary-button" href={`/quizzes/${quiz.id}/analytics`}>
                    Analytics
                  </Link>
                  <Link className="secondary-button" href={`/quizzes/${quiz.id}/leaderboard`}>
                    Leaderboard
                  </Link>
                  <button
                    className={getStateActionClass(quiz.state, "DRAFT")}
                    disabled={quiz.state === "DRAFT"}
                    onClick={() => updateQuizState(quiz.id, "DRAFT")}
                    title="Move the quiz back to draft so it is no longer live for students."
                    type="button"
                  >
                    Draft
                  </button>
                  <button
                    className={getStateActionClass(quiz.state, "ACTIVE")}
                    disabled={quiz.state === "ACTIVE"}
                    onClick={() => updateQuizState(quiz.id, "ACTIVE")}
                    type="button"
                  >
                    Activate
                  </button>
                  <button
                    className={getStateActionClass(quiz.state, "COMPLETED")}
                    disabled={quiz.state === "COMPLETED"}
                    onClick={() => updateQuizState(quiz.id, "COMPLETED")}
                    type="button"
                  >
                    Complete
                  </button>
                  <button
                    className="danger-button"
                    onClick={() => deleteQuiz(quiz.id, quiz.title)}
                    type="button"
                  >
                    Delete
                  </button>
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
