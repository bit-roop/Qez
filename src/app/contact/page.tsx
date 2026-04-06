export default function ContactPage() {
  return (
    <main className="page-shell">
      <section className="card">
        <span className="eyebrow">Contact</span>
        <h1>Contact</h1>
        <p className="section-copy">
          For any queries, support requests, or feedback, feel free to reach out.
        </p>
        <p className="section-copy">
          <strong>Email:</strong>{" "}
          <a href="mailto:qez.quiz@gmail.com">qez.quiz@gmail.com</a>
        </p>
        <p className="section-copy">
          We aim to respond to all queries within 24–48 hours.
        </p>
      </section>

      <section className="card">
        <h2>For technical issues, please include</h2>
        <ul className="section-copy legal-list">
          <li>a brief description of the problem</li>
          <li>screenshots, if applicable</li>
          <li>steps to reproduce the issue</li>
        </ul>
      </section>
    </main>
  );
}
