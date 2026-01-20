export default function AIPage() {
  return (
    <div className="page">
      <section className="hero-card">
        <h1>AI Advisor</h1>
        <p>
          A calm space to plan investments, rebalance, and automate DCA
          strategies. Coming soon.
        </p>
        <div className="hero-actions">
          <button className="pill primary">Join the waitlist</button>
          <button className="pill">See sample prompts</button>
        </div>
      </section>

      <section className="card soft">
        <div className="section-title">
          <h2>Sample prompts</h2>
          <span>Read-only</span>
        </div>
        <div className="list">
          <div className="list-item">
            <strong>
              Build me a balanced plan with 60% US stocks, 20% crypto, 20%
              indices.
            </strong>
          </div>
          <div className="list-item">
            <strong>
              Set weekly buys for NVDAx and a MAG 7 index using INR 5,000.
            </strong>
          </div>
          <div className="list-item">
            <strong>Explain why pre-IPO tokens are SPV backed.</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
