"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { apiFetch } from "@/lib/client-auth";
import { AuthSession } from "@/types/client-auth";

type WebinarQuizCreateClientProps = {
  session: AuthSession;
};

type CreateQuizResponse = {
  quiz: {
    id: string;
    joinCode: string;
  };
};

const emptyQuestion = (displayOrder: number) => ({
  prompt: "",
  explanation: "",
  difficulty: "MEDIUM",
  timeLimitSeconds: 20,
  displayOrder,
  correctOptionKey: "A",
  options: [
    { optionKey: "A", optionText: "" },
    { optionKey: "B", optionText: "" },
    { optionKey: "C", optionText: "" },
    { optionKey: "D", optionText: "" }
  ]
});

function extractEmails(rawText: string) {
  const matches = rawText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  return [...new Set(matches.map((email) => email.trim().toLowerCase()))];
}

function parseDomainRules(rawText: string) {
  return [
    ...new Set(
      rawText
        .split(/[\n,; ]+/)
        .map((item) => item.trim().toLowerCase().replace(/^[@.]+/, ""))
        .filter(Boolean)
    )
  ];
}

async function copyQuizInvite(title: string, joinCode: string) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://qez.vercel.app";
  const joinLink = `${baseUrl}/?code=${joinCode}`;
  const message = `Hey, join the webinar quiz "${title}" on Qez.\nOpen ${joinLink}\nYour room code is: ${joinCode}`;
  await navigator.clipboard.writeText(message);
}

export function WebinarQuizCreateClient({ session }: WebinarQuizCreateClientProps) {
  const [questions, setQuestions] = useState([emptyQuestion(1)]);
  const [collapsedQuestions, setCollapsedQuestions] = useState<number[]>([]);
  const [draggedQuestionIndex, setDraggedQuestionIndex] = useState<number | null>(null);
  const [allowedEmailsInput, setAllowedEmailsInput] = useState("");
  const [allowedDomainsInput, setAllowedDomainsInput] = useState("");
  const [uploadedRosterEmails, setUploadedRosterEmails] = useState<string[]>([]);
  const [uploadedRosterFileName, setUploadedRosterFileName] = useState<string | null>(null);
  const [latestInvite, setLatestInvite] = useState<{ title: string; joinCode: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleQuestionCollapse(index: number) {
    setCollapsedQuestions((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index]
    );
  }

  function updateQuestion(index: number, key: string, value: string | number) {
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
        .map((question, nextIndex) => ({
          ...question,
          displayOrder: nextIndex + 1
        }))
    );
    setCollapsedQuestions((current) =>
      current.filter((item) => item !== index).map((item) => (item > index ? item - 1 : item))
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

  async function handleRosterUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const emails = extractEmails(text);
      setUploadedRosterEmails(emails);
      setUploadedRosterFileName(file.name);
      setMessage(`Imported ${emails.length} participant emails from ${file.name}.`);
      setError(null);
    } catch {
      setError("Unable to read that roster file.");
    }
  }

  async function handleCreateQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const data = await apiFetch<CreateQuizResponse>("/api/quizzes", {
        method: "POST",
        body: JSON.stringify({
          title: String(formData.get("title") ?? ""),
          description: String(formData.get("description") ?? ""),
          mode: "WEBINAR",
          startsAt: String(formData.get("startsAt") ?? ""),
          endsAt: String(formData.get("endsAt") ?? ""),
          allowLeaderboard: true,
          leaderboardVisibility: String(formData.get("leaderboardVisibility") ?? "FULL"),
          showResultsToStudents: formData.get("showResultsToStudents") === "on",
          shuffleQuestions: formData.get("shuffleQuestions") === "on",
          shuffleOptions: formData.get("shuffleOptions") === "on",
          allowedParticipantEmails: [...new Set([...uploadedRosterEmails, ...extractEmails(allowedEmailsInput)])],
          allowedEmailDomains: parseDomainRules(allowedDomainsInput),
          questions
        })
      });

      setLatestInvite({
        title: String(formData.get("title") ?? ""),
        joinCode: data.quiz.joinCode
      });
      setMessage(`Webinar quiz created. Join code: ${data.quiz.joinCode}`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create webinar quiz.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="dashboard-shell">
      <article className="dashboard-hero dashboard-hero--webinar">
        <div className="dashboard-hero-copy">
          <span className="eyebrow">Webinar Studio</span>
          <h1>Create a live round as {session.user.name}.</h1>
          <p className="section-copy">Only webinar-host accounts can access this studio.</p>
        </div>
      </article>

      <article className="card form-card dashboard-card--full">
        <form className="teacher-form" onSubmit={handleCreateQuiz}>
          <div className="two-column-grid">
            <label className="field">
              <span>Round title</span>
              <input name="title" placeholder="Innovation Day Finale" required type="text" />
            </label>
            <label className="field">
              <span>Leaderboard visibility</span>
              <select defaultValue="FULL" name="leaderboardVisibility">
                <option value="TOP_10">Top 10</option>
                <option value="FULL">Full leaderboard</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>Description</span>
            <textarea name="description" placeholder="Add live host notes and prize details" rows={4} />
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
            <label className="toggle-row"><input defaultChecked name="showResultsToStudents" type="checkbox" /><span>Show results after submission</span></label>
            <label className="toggle-row"><input name="shuffleQuestions" type="checkbox" /><span>Shuffle questions</span></label>
            <label className="toggle-row"><input name="shuffleOptions" type="checkbox" /><span>Shuffle options</span></label>
          </div>

          <div className="two-column-grid">
            <label className="field">
              <span>Allowed participant emails</span>
              <textarea onChange={(event) => setAllowedEmailsInput(event.target.value)} rows={4} value={allowedEmailsInput} />
            </label>
            <label className="field">
              <span>Allowed email domains</span>
              <textarea onChange={(event) => setAllowedDomainsInput(event.target.value)} rows={4} value={allowedDomainsInput} />
            </label>
          </div>

          <label className="field">
            <span>Roster CSV upload</span>
            <input accept=".csv,.txt" onChange={handleRosterUpload} type="file" />
          </label>

          {uploadedRosterFileName ? <p className="section-copy">Imported from <strong>{uploadedRosterFileName}</strong>.</p> : null}

          {latestInvite ? (
            <div className="upload-hint-card">
              <strong>Share this webinar room</strong>
              <p className="section-copy">
                Send participants code <strong>{latestInvite.joinCode}</strong> or copy the ready webinar invite.
              </p>
              <button
                className="secondary-button"
                onClick={() => {
                  void copyQuizInvite(latestInvite.title, latestInvite.joinCode);
                  setMessage("Webinar invite copied.");
                }}
                type="button"
              >
                Copy link and invite text
              </button>
            </div>
          ) : null}

          <div className="question-stack">
            {questions.map((question, questionIndex) => {
              const isCollapsed = collapsedQuestions.includes(questionIndex);

              return (
                <article
                  className={`question-editor ${draggedQuestionIndex === questionIndex ? "question-editor--dragging" : ""}`}
                  key={question.displayOrder}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleQuestionDrop(questionIndex)}
                >
                  <div className="question-editor-header">
                    <div>
                      <h4>Question {questionIndex + 1}</h4>
                      {isCollapsed ? <p className="question-editor-preview">{question.prompt || "Collapsed question"}</p> : null}
                    </div>
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
                      <button className="secondary-button question-action-button" onClick={() => toggleQuestionCollapse(questionIndex)} type="button">
                        {isCollapsed ? "Expand" : "Collapse"}
                      </button>
                      {questions.length > 1 ? <button className="text-button button-reset" onClick={() => removeQuestion(questionIndex)} type="button">Remove</button> : null}
                    </div>
                  </div>

                  {!isCollapsed ? (
                    <>
                      <label className="field"><span>Prompt</span><textarea onChange={(event) => updateQuestion(questionIndex, "prompt", event.target.value)} rows={3} value={question.prompt} /></label>
                      <label className="field"><span>Explanation</span><textarea onChange={(event) => updateQuestion(questionIndex, "explanation", event.target.value)} rows={2} value={question.explanation} /></label>
                      <div className="three-column-grid">
                        <label className="field"><span>Difficulty</span><select onChange={(event) => updateQuestion(questionIndex, "difficulty", event.target.value)} value={question.difficulty}><option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option></select></label>
                        <label className="field"><span>Time limit (seconds)</span><input min={5} onChange={(event) => updateQuestion(questionIndex, "timeLimitSeconds", Number(event.target.value))} type="number" value={question.timeLimitSeconds} /></label>
                        <label className="field"><span>Correct option</span><select onChange={(event) => updateQuestion(questionIndex, "correctOptionKey", event.target.value)} value={question.correctOptionKey}><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select></label>
                      </div>
                      <div className="option-grid">
                        {question.options.map((option, optionIndex) => (
                          <label className="field" key={option.optionKey}><span>Option {option.optionKey}</span><input onChange={(event) => updateOption(questionIndex, optionIndex, event.target.value)} type="text" value={option.optionText} /></label>
                        ))}
                      </div>
                    </>
                  ) : null}
                </article>
              );
            })}
          </div>

          <div className="question-builder-footer">
            <button className="secondary-link button-reset" onClick={addQuestion} type="button">Add question below</button>
          </div>

          {message ? <p className="form-success">{message}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-link button-reset wide-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating webinar quiz..." : "Create webinar quiz"}
          </button>
        </form>
      </article>
    </section>
  );
}
