const transactions = [
  { title: "Deposit", detail: "UPI • ₹15,000", status: "Pending", time: "Today, 10:05" },
  { title: "Withdraw", detail: "Bank • ₹4,000", status: "Completed", time: "Yesterday" },
  { title: "Deposit", detail: "UPI • ₹8,000", status: "Completed", time: "Tue" }
];

export default function CashPage() {
  return (
    <div className="page">
      <section className="hero-card">
        <h1>Cash</h1>
        <p>Keep INR ready to trade. Fast deposits, transparent withdrawals.</p>
        <div className="action-row">
          <button className="action-btn primary">Deposit</button>
          <button className="action-btn">Withdraw</button>
        </div>
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Balance</h2>
          <span>INR</span>
        </div>
        <div className="balance">₹18,240</div>
        <p className="muted">Available to invest instantly.</p>
        <div className="hero-actions">
          <button className="pill primary">Deposit with UPI</button>
          <button className="pill">Bank transfer</button>
        </div>
      </section>

      <section className="card soft">
        <div className="section-title">
          <h2>Pending transfers</h2>
          <span>Status</span>
        </div>
        <p className="muted">No pending transfers.</p>
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Recent transactions</h2>
          <span>Latest</span>
        </div>
        <div className="list">
          {transactions.map((item) => (
            <div key={item.title + item.time} className="list-item">
              <div>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </div>
              <div>
                <strong>{item.status}</strong>
                <span>{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
