import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "AI Code Auditor | GenLayer",
  description: "Decentralized smart contract security auditor powered by GenLayer AI consensus",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1e1a2e",
              border: "1px solid rgba(95,74,139,0.4)",
              color: "#f0ecff",
            },
          }}
        />
      </body>
    </html>
  );
}
