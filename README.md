# AI Code Auditor

> Decentralized smart contract security auditor powered by GenLayer AI validators.
> Paste Solidity, Vyper, or Python code — get an AI-driven security report instantly.

Built for the **GenLayer Bradbury Builders Hackathon 2026**.

---

## What It Does

1. **Paste** your smart contract (Solidity, Vyper, or Python)
2. **AI Analysis** — GenLayer LLM validators scan for vulnerabilities using `exec_prompt`
3. **Report** — Risk score 0–10, severity breakdown, and detailed findings with recommendations

**Vulnerability categories detected:**
reentrancy · access control · integer overflow · front-running · unchecked returns · denial of service · timestamp dependence · tx.origin auth · flash loan attacks · oracle manipulation · self-destruct · delegatecall · signature replay · logic errors

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | GenLayer Studionet |
| Smart Contract | Python Intelligent Contract |
| AI | `exec_prompt` + `eq_principle.strict_eq` |
| Frontend | Next.js 15, TypeScript |
| Web3 Client | genlayer-js |

---

## Project Structure

```
├── contracts/
│   └── ai_code_auditor.py     # GenLayer Intelligent Contract
├── deploy/
│   └── deploy_studionet.mjs   # Deploy script
├── frontend/
│   ├── src/app/               # Next.js pages + CSS
│   ├── src/components/        # AuditResult, FindingCard, SeverityBadge
│   └── src/lib/               # GenLayer client + contract address
└── test/
    └── test_auditor.py
```

---

## Local Development

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local and add your GenLayer testnet private key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy

The frontend deploys to Vercel (set root directory to `frontend`).
The Intelligent Contract is deployed on GenLayer Studionet — address in `frontend/src/lib/contract.ts`.

---

## GenLayer Hackathon Compliance

| Requirement | Implementation |
|---|---|
| Intelligent Contract in Python | `contracts/ai_code_auditor.py` |
| AI via `exec_prompt` | LLM-based vulnerability analysis |
| Equivalence Principle | `gl.eq_principle.strict_eq` with deterministic JSON |
| Deployed on GenLayer | GenLayer Studionet |
| Real-world use case | Smart contract security — critical Web3 infrastructure |
