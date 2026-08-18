// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";

const poppins = Poppins({ 
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Professional SEO & OpenGraph Metadata
export const metadata: Metadata = {
  title: {
    default: "TeamHub HRMS — Modern Workforce & Payroll Engine",
    template: "%s | TeamHub HRMS",
  },
  description: "Enterprise human resource management system featuring automated payroll, smart attendance tracking, leave policies, and secure employee directories.",
  keywords: ["HRMS", "Payroll Software", "Attendance Tracking", "HR Management", "Next.js HRMS"],
  authors: [{ name: "TeamHub Engineering" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://teamhub-hrms.com",
    title: "TeamHub HRMS — Modern Workforce & Payroll Engine",
    description: "Manage your people, not just your paperwork. Unified payroll, attendance, and team success.",
    siteName: "TeamHub HRMS",
  },
  twitter: {
    card: "summary_large_image",
    title: "TeamHub HRMS",
    description: "Enterprise human resource management system.",
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981", // Matches your brand emerald color
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}