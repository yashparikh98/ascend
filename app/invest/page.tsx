const trending = [
  { title: "NVDAx", subtitle: "Tokenized US stock", delta: "+3.1%" },
  { title: "ZenPay", subtitle: "Pre-IPO", delta: "+1.4%" },
  { title: "Global Tech 12", subtitle: "Index", delta: "+0.9%" }
];

const categories = ["US Stocks", "Crypto", "Pre-IPO", "Index"];

const indices = [
  {
    name: "MAG 7",
    allocation: "Equal 14.28%",
    assets: "NVDA, AMZN, MSFT, TSLA, AAPL, GOOG, META"
  },
  {
    name: "Fintech",
    allocation: "Equal 20%",
    assets: "Stripe, Plaid, Revolut, Nubank, Adyen"
  },
  {
    name: "Pre-IPO",
    allocation: "Equal 25%",
    assets: "SpaceX, OpenAI, Databricks, Canva"
  }
];

export default function InvestPage() {
  return (
    <div className="page">
      <section className="hero-card">
        <h1>Invest in one search.</h1>
        <p>
          Discover tokenized stocks, curated indices, and pre-IPO tokens in a
          single flow.
        </p>
        <div className="search">
          <label htmlFor="asset-search">Search</label>
          <input
            id="asset-search"
            placeholder="Search NVDA, MAG 7, Gold, Solana"
          />
        </div>
      </section>

      <section>
        <div className="section-title">
          <h2>Trending</h2>
          <span>Top assets</span>
        </div>
        <div className="grid cols-3">
          {trending.map((item) => (
            <div key={item.title} className="card">
              <div className="section-title">
                <h3>{item.title}</h3>
                <span>{item.delta}</span>
              </div>
              <p>{item.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="section-title">
          <h2>Categories</h2>
          <span>Quick filters</span>
        </div>
        <div className="chip-row">
          {categories.map((category) => (
            <span key={category} className="chip">
              {category}
            </span>
          ))}
        </div>
      </section>

      <section className="card soft">
        <div className="section-title">
          <h2>Recurring buy / DCA</h2>
          <span>Automated weekly buy</span>
        </div>
        <p>Set a weekly buy or build the MAG 7 bucket with $100 split evenly.</p>
        <div className="action-row">
          <button className="action-btn primary">Create plan</button>
          <button className="action-btn">MAG 7 bucket</button>
          <button className="action-btn">Schedule weekly</button>
        </div>
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Index baskets</h2>
          <span>Equal allocation</span>
        </div>
        <div className="grid">
          {indices.map((item) => (
            <div key={item.name} className="card index-card">
              <h3>{item.name}</h3>
              <p>{item.assets}</p>
              <span>{item.allocation}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
