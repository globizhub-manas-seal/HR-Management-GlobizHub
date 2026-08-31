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
  themeColor: "#FDCD56", // Matches your new warm golden brand color
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (_) {}
              })()
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground selection:bg-primary/30 selection:text-foreground">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}