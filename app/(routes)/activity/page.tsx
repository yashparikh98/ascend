const history = [
  {
    title: "Bought NVDAx",
    detail: "INR 8,200 - USDC - NVDAx",
    time: "Today, 10:14 AM"
  },
  {
    title: "DCA: MAG 7",
    detail: "$100 split across 7 tokens",
    time: "Yesterday, 6:40 PM"
  },
  {
    title: "Sold SOL",
    detail: "0.45 SOL - USDC",
    time: "Mon, 9:02 AM"
  },
  {
    title: "Onramp deposit",
    detail: "Google Pay - INR 15,000",
    time: "Sun, 4:20 PM"
  }
];

export default function ActivityPage() {
  return (
    <div className="page">
      <section className="hero-card">
        <h1>Activity</h1>
        <p>Everything you do is recorded in real time.</p>
      </section>

      <section>
        <div className="section-title">
          <h2>Transaction history</h2>
          <span>Latest first</span>
        </div>
        <div className="list">
          {history.map((item) => (
            <div key={item.title} className="list-item">
              <div>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </div>
              <div>
                <strong>Completed</strong>
                <span>{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
