// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Professional SEO & OpenGraph Metadata
export const metadata: Metadata = {
  title: {
    default: "TeamHub HRMS — Modern Workforce & Payroll Engine",
    template: "%s | TeamHub HRMS",
  },
  description:
    "Enterprise human resource management system featuring automated payroll, smart attendance tracking, leave policies, and secure employee directories.",
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
  themeColor: "#FDCD56", // TeamHub accent gold
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
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground selection:bg-primary/30 selection:text-foreground">
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
