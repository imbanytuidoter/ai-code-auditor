import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { CONTRACT_ADDRESS } from "./contract";

const DEMO_PRIVATE_KEY = process.env.NEXT_PUBLIC_DEMO_PRIVATE_KEY as `0x${string}` | undefined;

function getClient() {
  const account = createAccount(DEMO_PRIVATE_KEY);
  return createClient({ chain: studionet, account });
}

export type AuditReport = {
  submission_id: string;
  language: string;
  overall_risk: "low" | "medium" | "high" | "critical" | "unknown";
  risk_score: number;
  safe_to_deploy: boolean;
  summary: string;
  findings_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  status: string;
  error?: string;
};

export type Finding = {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: string;
  title: string;
  location: string;
  description: string;
  recommendation: string;
};

export async function previewAudit(
  sourceCode: string,
  auditPolicy: string
): Promise<{ report: AuditReport; findings: Finding[] }> {
  const client = getClient();

  const raw = await client.simulateWriteContract({
    address: CONTRACT_ADDRESS,
    functionName: "preview_audit",
    args: [sourceCode, auditPolicy],
  });

  let parsed: Record<string, unknown>;
  if (typeof raw === "string") {
    parsed = JSON.parse(raw);
  } else if (raw && typeof raw === "object") {
    parsed = raw as Record<string, unknown>;
  } else {
    throw new Error("Unexpected response from GenLayer: " + String(raw));
  }

  if (parsed.error) throw new Error(String(parsed.error));

  const findings = (parsed.findings as Finding[]) ?? [];
  const report: AuditReport = {
    submission_id: (parsed.submission_id as string) ?? "preview",
    language:      (parsed.language as string) ?? "unknown",
    overall_risk:  (parsed.overall_risk as AuditReport["overall_risk"]) ?? "unknown",
    risk_score:    Number(parsed.risk_score ?? 0),
    safe_to_deploy: Boolean(parsed.safe_to_deploy),
    summary:       (parsed.summary as string) ?? "",
    findings_count: Number(parsed.findings_count ?? findings.length),
    critical_count: Number(parsed.critical_count ?? 0),
    high_count:     Number(parsed.high_count ?? 0),
    medium_count:   Number(parsed.medium_count ?? 0),
    low_count:      Number(parsed.low_count ?? 0),
    status: "preview",
  };

  return { report, findings };
}

export async function getAuditCount(): Promise<number> {
  const client = getClient();
  const result = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_audit_count",
    args: [],
  });
  return Number(result ?? 0);
}
