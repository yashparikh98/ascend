"use client";

export default function LearnMoreModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="section-title">
          <h2>How it works</h2>
          <button className="pill" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <div className="list-compact">
          <div className="list-item">
            <strong>INR onramp</strong>
            <span>Deposit with Google Pay/UPI. Funds settle as INR balance.</span>
          </div>
          <div className="list-item">
            <strong>Convert to USDC</strong>
            <span>We convert INR to USDC and execute your swap with transparent fees.</span>
          </div>
          <div className="list-item">
            <strong>Own tokenized assets</strong>
            <span>Buy US Stocks, Crypto, Indices, and SPV-backed Pre-IPO tokens.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
