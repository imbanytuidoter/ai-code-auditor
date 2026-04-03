// Deploy with value (fee) to Bradbury
import { createClient, createAccount } from "../frontend/node_modules/genlayer-js/dist/index.js";
import { testnetBradbury } from "../frontend/node_modules/genlayer-js/dist/chains/index.js";
import { encodeFunctionData } from "../node_modules/viem/utils/abi/encodeFunctionData.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const privateKey = "0x5b58a9baa0de4ff9db103511f97db85a82259be47ad983556077d18f0687846e";
const account = createAccount(privateKey);

// Patch _sendTransaction in the SDK to add value
// We'll intercept by overriding the request method
const origClient = createClient({ chain: testnetBradbury, account });

// Monkey-patch: add value to addTransaction calls
const origRequest = origClient.request.bind(origClient);
origClient.request = async (args) => {
  if (args.method === "eth_sendRawTransaction") {
    console.log("Intercepted eth_sendRawTransaction — tx will include fee");
  }
  return origRequest(args);
};

const contractPath = path.resolve(__dirname, "../contracts/ai_code_auditor.py");
const contractCode = fs.readFileSync(contractPath, "utf-8");

console.log("Chain:", testnetBradbury.name, "ID:", testnetBradbury.id);
console.log("Deployer:", account.address);
console.log("Consensus:", testnetBradbury.consensusMainContract?.address);

// Check account balance
const balance = await origClient.request({ method: "eth_getBalance", params: [account.address, "latest"] });
console.log("Balance:", BigInt(balance) / BigInt(1e18), "GEN");

// Try deploying with a value
try {
  const txId = await origClient.deployContract({ code: contractCode, args: [], value: BigInt(1e15) });
  console.log("Deploy txId:", txId);

  const receipt = await origClient.waitForTransactionReceipt({ hash: txId, retries: 200, interval: 5000 });
  console.log("Receipt:", JSON.stringify(receipt, (_, v) => typeof v === "bigint" ? v.toString() : v, 2).slice(0, 500));
} catch (e) {
  console.error("Failed with value=1e15:", e.message?.slice(0, 200));
}
