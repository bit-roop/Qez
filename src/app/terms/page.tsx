export default function TermsPage() {
  return (
    <main className="page-shell">
      <section className="card">
        <span className="eyebrow">Terms &amp; Conditions</span>
        <h1>Terms of Service</h1>
        <p className="section-copy">
          <strong>Last updated:</strong> April 7, 2026
        </p>
        <p className="section-copy">By using Qez, you agree to the following terms:</p>
      </section>

      <section className="card">
        <h2>1. Use of the Platform</h2>
        <p className="section-copy">Qez is intended for:</p>
        <ul className="section-copy legal-list">
          <li>educational use</li>
          <li>competitive quiz events</li>
        </ul>
        <p className="section-copy">
          You agree not to misuse the platform or attempt to disrupt its functionality.
        </p>
      </section>

      <section className="card">
        <h2>2. User Accounts</h2>
        <ul className="section-copy legal-list">
          <li>You are responsible for maintaining the confidentiality of your account</li>
          <li>You must provide accurate information</li>
          <li>You are responsible for all activity under your account</li>
        </ul>
      </section>

      <section className="card">
        <h2>3. Quiz Integrity</h2>
        <p className="section-copy">Users must not:</p>
        <ul className="section-copy legal-list">
          <li>attempt to manipulate results</li>
          <li>bypass system restrictions</li>
          <li>use unfair means during quizzes</li>
        </ul>
        <p className="section-copy">
          Suspicious activity may be flagged and reviewed.
        </p>
      </section>

      <section className="card">
        <h2>4. Intellectual Property</h2>
        <p className="section-copy">
          All content, design, and system logic of Qez are owned by the platform
          creators.
        </p>
        <p className="section-copy">
          Users may not copy, reproduce, or redistribute platform content without
          permission.
        </p>
      </section>

      <section className="card">
        <h2>5. Limitation of Liability</h2>
        <p className="section-copy">
          Qez is provided “as is” without guarantees of uninterrupted or error-free
          operation.
        </p>
        <p className="section-copy">We are not liable for:</p>
        <ul className="section-copy legal-list">
          <li>data loss</li>
          <li>service interruptions</li>
          <li>incorrect results due to misuse</li>
        </ul>
      </section>

      <section className="card">
        <h2>6. Termination</h2>
        <p className="section-copy">We reserve the right to:</p>
        <ul className="section-copy legal-list">
          <li>suspend or terminate accounts</li>
          <li>restrict access for violations of terms</li>
        </ul>
      </section>

      <section className="card">
        <h2>7. Changes to Terms</h2>
        <p className="section-copy">
          We may update these terms periodically. Continued use indicates acceptance.
        </p>
      </section>

      <section className="card">
        <h2>8. Contact</h2>
        <p className="section-copy">
          For any concerns regarding these terms:{" "}
          <a href="mailto:qez.quiz@gmail.com">qez.quiz@gmail.com</a>
        </p>
      </section>
    </main>
  );
}
