import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "highlight.js/styles/github.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hermes Ops — 智能运维平台",
  description: "基于 Hermes Agent 的企业级智能运维平台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="zh-CN"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
