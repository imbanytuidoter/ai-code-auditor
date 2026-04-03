"use client";

type Severity = "critical" | "high" | "medium" | "low" | "info";

export function SeverityBadge({ severity }: { severity: string }) {
  const s = severity.toLowerCase() as Severity;
  return (
    <span className={`severity-badge ${s}`}>
      {severity}
    </span>
  );
}

export function RiskScore({ score, risk }: { score: number; risk: string }) {
  const r = risk.toLowerCase();
  const bars = Array.from({ length: 10 }, (_, i) => i < score);

  return (
    <div className="risk-score-row">
      <span className={`risk-number ${r}`}>{score}</span>
      <div className="risk-bars">
        {bars.map((filled, i) => (
          <div key={i} className={`risk-bar ${filled ? `filled ${r}` : "empty"}`} />
        ))}
      </div>
      <span className={`risk-label ${r}`}>{risk}</span>
    </div>
  );
}
