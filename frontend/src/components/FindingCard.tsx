"use client";

import { useState } from "react";
import { SeverityBadge } from "./SeverityBadge";
import type { Finding } from "@/lib/genlayer";

export function FindingCard({ finding, index }: { finding: Finding; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="finding-card" style={{ animationDelay: `${index * 0.05}s` }}>
      <button className="finding-header" onClick={() => setOpen(!open)}>
        <SeverityBadge severity={finding.severity} />
        <div className="finding-meta">
          <div className="finding-title">
            {finding.title}
            <span className="finding-cat">{finding.category}</span>
          </div>
          <div className="finding-location">📍 {finding.location}</div>
        </div>
        <span className={`finding-arrow${open ? " open" : ""}`}>▼</span>
      </button>

      {open && (
        <div className="finding-body">
          <div>
            <div className="finding-section-label">Description</div>
            <p className="finding-desc">{finding.description}</p>
          </div>
          <div>
            <div className="finding-section-label">Recommendation</div>
            <p className="finding-rec">{finding.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
