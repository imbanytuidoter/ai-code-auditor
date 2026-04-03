"use client";

import { useState, useCallback, useEffect, useRef, Fragment } from "react";
import { toast } from "sonner";
import { previewAudit, getAuditCount } from "@/lib/genlayer";
import type { AuditReport, Finding } from "@/lib/genlayer";
import { AuditResult } from "@/components/AuditResult";

const EXAMPLE_VULNERABLE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VulnerableVault {
    mapping(address => uint256) public balances;
    address public owner;

    constructor() { owner = msg.sender; }

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    // VULNERABLE: reentrancy — external call before state update
    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient");
        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");
        balances[msg.sender] -= amount;
    }

    // VULNERABLE: no access control
    function emergencyWithdraw() public {
        payable(msg.sender).transfer(address(this).balance);
    }

    // VULNERABLE: tx.origin auth
    function adminTransfer(address to, uint256 amount) public {
        require(tx.origin == owner, "Not owner");
        payable(to).transfer(amount);
    }

    // VULNERABLE: unchecked overflow
    function addBalance(address user, uint256 amount) public {
        unchecked { balances[user] += amount; }
    }
}`;

const EXAMPLE_SAFE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SecureVault is ReentrancyGuard, Ownable {
    mapping(address => uint256) private _balances;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    constructor() Ownable(msg.sender) {}

    function deposit() external payable {
        require(msg.value > 0, "Amount must be > 0");
        _balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(_balances[msg.sender] >= amount, "Insufficient");
        _balances[msg.sender] -= amount;
        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    function balanceOf(address user) external view returns (uint256) {
        return _balances[user];
    }
}`;

type Step = "idle" | "waiting" | "done" | "error";

export default function Home() {
  const [code, setCode]     = useState("");
  const [policy, setPolicy] = useState(
    "Check all vulnerability categories: reentrancy, access control, integer overflow, front-running, unchecked returns, denial of service, timestamp dependence, tx.origin auth, logic errors."
  );
  const [step, setStep]         = useState<Step>("idle");
  const [report, setReport]     = useState<AuditReport | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [statusMsg, setStatusMsg] = useState("");

  // Stats
  const [auditsRun, setAuditsRun]     = useState(0);
  const [avgTime, setAvgTime]         = useState(0);
  const [chainCount, setChainCount]   = useState<number | null>(null);
  const [statUpdating, setStatUpdating] = useState(false);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const stored = parseInt(localStorage.getItem("gl_audits") || "0", 10);
    const storedAvg = parseFloat(localStorage.getItem("gl_avgtime") || "0");
    setAuditsRun(stored);
    setAvgTime(storedAvg);

    // Fetch on-chain count once
    getAuditCount().then(setChainCount).catch(() => null);
  }, []);

  const bumpStats = useCallback((elapsed: number) => {
    setAuditsRun(prev => {
      const next = prev + 1;
      const prevAvg = parseFloat(localStorage.getItem("gl_avgtime") || "0");
      const newAvg = prevAvg === 0 ? elapsed : (prevAvg * prev + elapsed) / next;
      localStorage.setItem("gl_audits", String(next));
      localStorage.setItem("gl_avgtime", String(newAvg));
      setAvgTime(newAvg);
      return next;
    });
    setStatUpdating(true);
    setTimeout(() => setStatUpdating(false), 600);
  }, []);

  const handleAudit = useCallback(async () => {
    if (!code.trim()) {
      toast.error("Please paste your smart contract code first");
      return;
    }
    if (code.length > 40_000) {
      toast.error("Contract too large (max 40 KB)");
      return;
    }
    setStep("waiting");
    setReport(null);
    setFindings([]);
    setStatusMsg("AI validators are analyzing your contract...");
    startTimeRef.current = Date.now();

    try {
      const { report: r, findings: f } = await previewAudit(code, policy);
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      bumpStats(elapsed);
      setReport(r);
      setFindings(f);
      setStep("done");
      toast.success("Audit complete!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStep("error");
      setStatusMsg("Audit failed: " + msg);
      toast.error("Audit failed: " + msg.slice(0, 80));
    }
  }, [code, policy, bumpStats]);

  const avgLabel = avgTime > 0 ? `~${Math.round(avgTime)}s` : "—";

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-logo">
          <img src="/logo.svg" alt="AI Code Auditor" className="logo-img" />
          <div className="logo-sub">Powered by imbanytui · Optimistic Democracy Consensus</div>
        </div>
        <div className="header-status">
          <span className="dot" />
          GenLayer Studionet
        </div>
      </header>

      {/* Stats bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className={`stat-value${statUpdating ? " updating" : ""}`}>{auditsRun}</span>
          <span className="stat-label">Audits run</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{chainCount !== null ? chainCount : "—"}</span>
          <span className="stat-label">On-chain stored</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">5</span>
          <span className="stat-label">AI validators</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{avgLabel}</span>
          <span className="stat-label">Avg response</span>
        </div>
      </div>

      <div className="main">
        {/* ── LEFT: Input ── */}
        <div className="glass-card">
          <div style={{ marginBottom: "1.25rem" }}>
            <div className="section-title">Submit Contract for Audit</div>
            <div className="section-sub">
              Paste Solidity, Vyper, or Python code. GenLayer AI analyzes it for vulnerabilities.
            </div>
          </div>

          {/* Examples */}
          <div className="examples-row">
            <span className="examples-label">Examples</span>
            <button className="btn-example danger" onClick={() => setCode(EXAMPLE_VULNERABLE)}>⚠ Vulnerable</button>
            <button className="btn-example safe" onClick={() => setCode(EXAMPLE_SAFE)}>✓ Safe</button>
            <button className="btn-example neutral" onClick={() => setCode("")}>Clear</button>
          </div>

          {/* Code */}
          <div className="field">
            <label className="field-label">Smart Contract Code</label>
            <div className={`code-wrapper${step === "waiting" ? " scanning" : ""}`}>
              <textarea
                className="code-area"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={"// Paste your Solidity, Vyper, or Python contract here..."}
                rows={18}
              />
            </div>
            <div className="field-meta">
              <span>{code.length} chars</span>
              <span>{code.trim() ? `~${code.split("\n").length} lines` : ""}</span>
            </div>
          </div>

          {/* Policy */}
          <div className="field">
            <label className="field-label">Audit Policy</label>
            <textarea
              className="policy-area"
              value={policy}
              onChange={(e) => setPolicy(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit */}
          <button
            className="btn-primary"
            onClick={handleAudit}
            disabled={step === "waiting"}
          >
            {step === "waiting" ? (
              <><span className="spinner" /> Analyzing with AI...</>
            ) : (
              "Audit Contract"
            )}
          </button>

          {/* Status */}
          {statusMsg && step !== "done" && (
            <div className={`status-box ${step === "error" ? "error" : "info"}`}>
              {step === "waiting" && (
                <div className="validators-row">
                  {["Leader LLM", "Validator 2", "Validator 3"].map((v, i) => (
                    <div className="validator-item" key={v}>
                      <span className="validator-dot" style={{ animation: `pulse 1.4s ease-in-out ${i * 0.25}s infinite` }} />
                      {v}
                    </div>
                  ))}
                </div>
              )}
              <div>{statusMsg}</div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Result ── */}
        <div>
          <div className="section-title" style={{ marginBottom: "1rem" }}>Audit Report</div>

          {step === "idle" && (
            <div className="empty-state">
              <div className="empty-icon">◎</div>
              <div className="empty-title">No audit yet</div>
              <div className="empty-desc">
                Choose an example or paste your contract, then click <strong>Audit Contract</strong>.
              </div>
              <div className="steps-row">
                {["Paste Code", "AI Analysis", "Report"].map((s, i, arr) => (
                  <Fragment key={s}>
                    <div className="step">
                      <div className="step-num">{i + 1}</div>
                      <div className="step-label">{s}</div>
                    </div>
                    {i < arr.length - 1 && <div className="step-connector" />}
                  </Fragment>
                ))}
              </div>
            </div>
          )}

          {step === "waiting" && (
            <div className="consensus-state">
              <span className="consensus-icon">⚡</span>
              <div className="consensus-title">AI Analysis in Progress</div>
              <div className="consensus-desc">
                GenLayer AI node is scanning your contract for vulnerabilities
              </div>
              <div className="validators-grid">
                {["Leader", "Validator 2", "Validator 3"].map((v, i) => (
                  <div className="validator-card" key={v}>
                    <div className="validator-avatar active" style={{ animationDelay: `${i * 0.4}s` }}>AI</div>
                    <div className="validator-name">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === "done" && report && (
            <AuditResult report={report} findings={findings} />
          )}

          {step === "error" && (
            <div className="error-state">
              <div className="empty-icon">❌</div>
              <div className="empty-title" style={{ color: "#f87171" }}>Audit Failed</div>
              <div className="empty-desc">Check the status panel on the left for details.</div>
            </div>
          )}
        </div>
      </div>

      {/* Roadmap */}
      <div className="roadmap">
        <div className="roadmap-title">Roadmap</div>
        <div className="roadmap-track">
          {[
            { name: "Studionet", active: true },
            { name: "Bradbury",  active: false },
            { name: "Clarke",    active: false },
            { name: "Mainnet",   active: false },
          ].map((phase, i, arr) => (
            <Fragment key={phase.name}>
              <div className={`roadmap-node${phase.active ? " active" : ""}`}>
                <div className="roadmap-dot" />
                <div className="roadmap-name">{phase.name}</div>
              </div>
              {i < arr.length - 1 && (
                <div className={`roadmap-line${phase.active ? " lit" : ""}`} />
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </>
  );
}
