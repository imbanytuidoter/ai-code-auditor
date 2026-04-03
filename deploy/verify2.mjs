// Use root genlayer-js (0.18.14) to test reading contracts
import { createClient, createAccount } from "../node_modules/genlayer-js/dist/index.js";
import { testnetBradbury } from "../frontend/node_modules/genlayer-js/dist/chains/index.js";

const account = createAccount("0x5b58a9baa0de4ff9db103511f97db85a82259be47ad983556077d18f0687846e");
const client = createClient({ chain: testnetBradbury, account });

const addrs = [
  { addr: "0xD9cb261E43e121E407415a84009682128C3d34FC", label: "bradbury-deploy-1" },
  { addr: "0x5d6CeC99aa9b4Ee6Ea03ef385EC5061a9e3f813D", label: "bradbury-deploy-2" },
  { addr: "0x730E28a7Abd5Bbd1520B2Ce44796aB715d12E6c3", label: "user-studio" },
];

for (const { addr, label } of addrs) {
  console.log(`\n[${label}] ${addr}`);
  try {
    const result = await client.readContract({
      address: addr,
      functionName: "get_audit_count",
      args: [],
    });
    console.log("get_audit_count:", result, "✅");
  } catch (e) {
    console.log("error:", e.message?.slice(0, 150));
  }
}
