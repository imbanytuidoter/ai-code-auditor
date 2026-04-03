import { createClient, createAccount } from "../frontend/node_modules/genlayer-js/dist/index.js";
import { testnetAsimov, testnetBradbury } from "../frontend/node_modules/genlayer-js/dist/chains/index.js";

const account = createAccount("0x5b58a9baa0de4ff9db103511f97db85a82259be47ad983556077d18f0687846e");

// Try both chains
for (const chain of [testnetAsimov, testnetBradbury]) {
  const client = createClient({ chain, account });
  console.log(`\n====== Chain: ${chain.name} ======`);
  for (const addr of ["0xc808968e5F747eb068C9d053e3eE71d7ddcB04bD", "0x730E28a7Abd5Bbd1520B2Ce44796aB715d12E6c3"]) {
    try {
      const c = await client.readContract({ address: addr, functionName: "get_audit_count", args: [] });
      console.log(`${addr}: count=${c} ✅`);
    } catch (e) {
      console.log(`${addr}: ${e.message.slice(0, 80)}`);
    }
  }
}

const client = createClient({ chain: testnetAsimov, account });

// Test both contract addresses
const CONTRACTS = [
  { addr: "0xc808968e5F747eb068C9d053e3eE71d7ddcB04bD", label: "script-deployed (asimov)" },
  { addr: "0x730E28a7Abd5Bbd1520B2Ce44796aB715d12E6c3", label: "user-deployed (studio)" },
];

for (const { addr, label } of CONTRACTS) {
  console.log(`\n=== ${label}: ${addr} ===`);
  try {
    const c = await client.readContract({ address: addr, functionName: "get_audit_count", args: [] });
    console.log("get_audit_count:", c, "✅");
    const r = await client.readContract({ address: addr, functionName: "get_all_reports", args: [] });
    console.log("get_all_reports:", r);
  } catch (e) {
    console.log("error:", e.message.slice(0, 120));
  }
}

const CONTRACT = "";

