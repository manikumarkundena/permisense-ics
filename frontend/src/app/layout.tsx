import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "PermiSense — Cyber-Physical Incident Intelligence", template: "%s | PermiSense" },
  description: "Detect industrial threats, trace cyber-to-process impact, explain the evidence, and guide human-approved response.",
  applicationName: "PermiSense",
  keywords: ["industrial cybersecurity", "ICS security", "OT security", "incident intelligence", "Modbus", "cyber physical security", "SOC"],
  authors: [{ name: "PermiSense" }],
  openGraph: {
    title: "PermiSense — Cyber-Physical Incident Intelligence",
    description: "Detect the threat. Trace the impact. Decide the response.",
    type: "website",
    siteName: "PermiSense"
  },
  robots: { index: true, follow: true }
};

export const viewport: Viewport = {
  themeColor: "#f6f8fa",
  colorScheme: "light"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
