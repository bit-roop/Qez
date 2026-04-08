export default function PrivacyPage() {
  return (
    <main className="page-shell">
      <section className="card">
        <span className="eyebrow">Privacy Policy</span>
        <h1>Privacy Policy</h1>
        <p className="section-copy">
          <strong>Last updated:</strong> April 7, 2026
        </p>
        <p className="section-copy">
          Qez respects your privacy and is committed to protecting your personal
          information.
        </p>
      </section>

      <section className="card">
        <h2>1. Information We Collect</h2>
        <ul className="section-copy legal-list">
          <li>Name and email address for account creation and authentication</li>
          <li>Quiz activity data such as responses, scores, and timestamps</li>
          <li>Usage data related to basic interaction with the platform</li>
        </ul>
      </section>

      <section className="card">
        <h2>2. How We Use Information</h2>
        <ul className="section-copy legal-list">
          <li>Provide and maintain the platform</li>
          <li>Authenticate users and manage sessions</li>
          <li>Process quiz submissions and generate results</li>
          <li>Improve system performance and user experience</li>
        </ul>
      </section>

      <section className="card">
        <h2>3. Data Security</h2>
        <p className="section-copy">
          We implement reasonable security measures to protect your data, including
          server-side validation and controlled access mechanisms.
        </p>
        <p className="section-copy">
          However, no system is completely secure, and we cannot guarantee absolute
          security.
        </p>
      </section>

      <section className="card">
        <h2>4. Data Sharing</h2>
        <p className="section-copy">We do not sell or rent your personal data.</p>
        <p className="section-copy">Data may only be shared:</p>
        <ul className="section-copy legal-list">
          <li>when required by law</li>
          <li>to maintain system functionality, such as hosting providers</li>
        </ul>
      </section>

      <section className="card">
        <h2>5. Cookies and Storage</h2>
        <p className="section-copy">We may use browser storage or cookies to:</p>
        <ul className="section-copy legal-list">
          <li>maintain sessions</li>
          <li>improve usability</li>
        </ul>
      </section>

      <section className="card">
        <h2>6. Your Rights</h2>
        <p className="section-copy">You may request:</p>
        <ul className="section-copy legal-list">
          <li>access to your data</li>
          <li>correction of inaccurate information</li>
          <li>deletion of your account</li>
        </ul>
        <p className="section-copy">
          To do so, contact <a href="mailto:qez.quiz@gmail.com">qez.quiz@gmail.com</a>.
        </p>
      </section>

      <section className="card">
        <h2>7. Changes to This Policy</h2>
        <p className="section-copy">
          We may update this policy from time to time. Continued use of the platform
          implies acceptance of updates.
        </p>
      </section>
    </main>
  );
}
