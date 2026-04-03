# AI Code Auditor

> Decentralized smart contract security auditor powered by GenLayer AI validators.
> Paste Solidity, Vyper, or Python code — get an on-chain AI security report instantly.

Built for the **GenLayer Bradbury Builders Hackathon 2026**.

🔗 **Live demo:** [Deploy on Vercel — see below]

---

## What It Does

1. **Paste** your smart contract (Solidity, Vyper, Python)
2. **AI Analysis** — GenLayer's LLM validators scan for vulnerabilities
3. **Report** — Risk score, severity breakdown, findings with recommendations

Vulnerability categories: reentrancy, access control, integer overflow, front-running, unchecked returns, DoS, timestamp dependence, tx.origin auth, flash loan attacks, oracle manipulation, and more.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | [GenLayer Studionet](https://studio.genlayer.com) |
| Smart Contract | Python Intelligent Contract (`contracts/ai_code_auditor.py`) |
| AI Consensus | GenLayer LLM validators via `exec_prompt_session` |
| Frontend | Next.js 15, TypeScript, pure CSS |
| Web3 Client | genlayer-js 0.28.2 |

---

## Project Structure

```
├── contracts/
│   └── ai_code_auditor.py     # GenLayer Intelligent Contract
├── deploy/
│   └── deploy_studionet.mjs   # Deploy script for Studionet
├── frontend/
│   ├── src/app/               # Next.js 15 pages + CSS
│   ├── src/components/        # AuditResult, FindingCard, SeverityBadge
│   └── src/lib/               # GenLayer client, types, contract address
└── test/
    └── test_auditor.py        # Test suite
```

---

## Local Development

```bash
cd frontend
npm install
cp .env.example .env.local     # add your NEXT_PUBLIC_DEMO_PRIVATE_KEY
npm run dev
# Open http://localhost:3000
```

---




