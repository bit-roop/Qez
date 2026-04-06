export default function AboutPage() {
  return (
    <main className="page-shell">
      <section className="card">
        <span className="eyebrow">About Qez</span>
        <h1>About Qez</h1>
        <p className="section-copy">
          Qez is a platform designed to simplify and elevate the way quizzes,
          assessments, and live competitions are conducted.
        </p>
        <p className="section-copy">
          It combines structured academic testing with real-time competitive quiz
          environments, allowing educators, organizers, and teams to run reliable,
          scalable, and engaging quiz experiences.
        </p>
      </section>

      <section className="grid-section">
        <article className="card">
          <h2>Accuracy</h2>
          <p className="section-copy">
            All scoring is handled securely on the server to prevent manipulation.
          </p>
        </article>

        <article className="card">
          <h2>Fairness</h2>
          <p className="section-copy">
            Built-in mechanisms help detect suspicious behavior during attempts.
          </p>
        </article>
      </section>

      <section className="grid-section">
        <article className="card">
          <h2>Scalability</h2>
          <p className="section-copy">
            Designed to handle both classroom assessments and large live events.
          </p>
        </article>

        <article className="card">
          <h2>Built for real use</h2>
          <p className="section-copy">
            Whether it&apos;s a teacher conducting timed tests or a host running a live
            webinar competition, Qez provides the tools to manage, evaluate, and track
            performance effectively.
          </p>
        </article>
      </section>
    </main>
  );
}
