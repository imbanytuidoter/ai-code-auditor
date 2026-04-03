import { createClient, createAccount } from "../frontend/node_modules/genlayer-js/dist/index.js";
import { testnetAsimov, testnetBradbury } from "../frontend/node_modules/genlayer-js/dist/chains/index.js";

const privateKey = "0x5b58a9baa0de4ff9db103511f97db85a82259be47ad983556077d18f0687846e";
const account = createAccount(privateKey);

// Try with both chain configs
for (const chain of [testnetAsimov, testnetBradbury]) {
  const client = createClient({ chain, account });
  const txId = "0xf6c85052f8e89bbfd7d6f6a98aa3f1c06abe1d6bb4ee641df93dc6ddefd2c6ac";

  try {
    const tx = await client.waitForTransactionReceipt({ hash: txId, fullTransaction: true, retries: 0 });
    console.log(`\n=== ${chain.name} (fullTransaction) ===`);
    const str = JSON.stringify(tx, (_, v) => typeof v === "bigint" ? v.toString() : v, 2);
    console.log(str.slice(0, 3000));
  } catch (e) {
    console.log(`${chain.name}: error -`, e.message.slice(0, 200));
  }
}
