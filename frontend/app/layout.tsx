import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PermiSense — Cyber-Physical Incident Intelligence & Response',
  description: 'Detect the threat. Trace the impact. Decide the response. Connecting industrial Modbus/TCP communications to physical process deviation, evidence correlation, operational risk, and human-in-the-loop recovery.',
  openGraph: {
    title: 'PermiSense — Cyber-Physical Incident Intelligence & Response',
    description: 'Detect the threat. Trace the impact. Decide the response.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PermiSense — Cyber-Physical Incident Intelligence & Response',
    description: 'Detect the threat. Trace the impact. Decide the response.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-[#F5F7F9] text-[#0B1220] selection:bg-[#1769FF] selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
