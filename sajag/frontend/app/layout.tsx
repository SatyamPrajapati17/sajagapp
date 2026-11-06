import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  style: ["italic"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["italic"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sajag AI — Scam-Baiting Multi-Agent Defence",
  description: "Real-time AI voice scam intervention, baiting decoy agent, and structured evidence extraction.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jetbrains.variable} dark`}>
      <body className="min-h-screen bg-[#050B14] text-[#D7E6F5] italic font-sans antialiased gridbg selection:bg-[#22E5FF] selection:text-black">
        {children}
      </body>
    </html>
  );
}
