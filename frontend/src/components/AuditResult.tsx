"use client";

import { RiskScore } from "./SeverityBadge";
import { FindingCard } from "./FindingCard";
import type { AuditReport, Finding } from "@/lib/genlayer";

type Props = { report: AuditReport; findings: Finding[] };

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export function AuditResult({ report, findings }: Props) {
  const sorted = [...findings].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 5) - (SEVERITY_ORDER[b.severity] ?? 5)
  );

  return (
    <div>
      {/* Status banner */}
      <div className="report-banner">
        <div className="banner-check">✓</div>
        <div className="banner-info">
          <div className="banner-title">AI Analysis Complete</div>
          <div className="banner-sub">
            {(report.language ?? "unknown").toUpperCase()} · {(report.submitter ?? "").slice(0, 14)}...
          </div>
        </div>
        <span className={`deploy-badge ${report.safe_to_deploy ? "safe" : "unsafe"}`}>
          {report.safe_to_deploy ? "✓ Safe" : "✗ Not Safe"}
        </span>
      </div>

      {/* Risk score */}
      <div className="risk-panel">
        <div className="risk-panel-label">Overall Risk Assessment</div>
        <RiskScore score={report.risk_score} risk={report.overall_risk} />
        <p className="risk-summary">{report.summary}</p>
      </div>

      {/* Counters */}
      <div className="counters-grid">
        {([
          { label: "Critical", count: report.critical_count ?? 0, cls: "critical" },
          { label: "High",     count: report.high_count ?? 0,     cls: "high" },
          { label: "Medium",   count: report.medium_count ?? 0,   cls: "medium" },
          { label: "Low",      count: report.low_count ?? 0,      cls: "low" },
          { label: "Total",    count: report.findings_count ?? 0, cls: "total" },
        ] as const).map(({ label, count, cls }) => (
          <div key={label} className={`counter-card ${cls}`}>
            <div className="counter-num">{count}</div>
            <div className="counter-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Findings */}
      {sorted.length > 0 ? (
        <div>
          <div className="findings-header">Findings ({sorted.length})</div>
          <div className="findings-list">
            {sorted.map((f, i) => (
              <FindingCard key={f.id} finding={f} index={i} />
            ))}
          </div>
        </div>
      ) : (
        <div className="no-findings">
          <div className="no-findings-icon">🛡️</div>
          <div className="no-findings-title">No vulnerabilities found</div>
          <div className="no-findings-sub">Contract appears safe to deploy</div>
        </div>
      )}
    </div>
  );
}
