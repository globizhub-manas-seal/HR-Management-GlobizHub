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
    default: "GlobizHR – HRMS, Payroll & Attendance Software for India",
    template: "%s | GlobizHR",
  },
  description:
    "All-in-one HR software for Indian businesses: attendance, leave, shifts, EPF/ESI/PT/TDS payroll and payslips. Start free for up to 5 users.",
  keywords: [
    "HRMS",
    "payroll software India",
    "attendance software",
    "leave management",
    "Payroll Software",
    "Attendance Tracking",
    "HR Management",
    "GlobizHR",
  ],
  authors: [{ name: "GlobizHub India Pvt Ltd" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://hr.globizhub.com",
    title: "GlobizHR – HRMS, Payroll & Attendance Software for India",
    description:
      "All-in-one HR software for Indian businesses: attendance, leave, shifts, EPF/ESI/PT/TDS payroll and payslips. Start free for up to 5 users.",
    siteName: "GlobizHR",
  },
  twitter: {
    card: "summary_large_image",
    title: "GlobizHR – HRMS, Payroll & Attendance Software for India",
    description:
      "All-in-one HR software for Indian businesses: attendance, leave, shifts, EPF/ESI/PT/TDS payroll and payslips.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "256x256" },
      { url: "/globizhr-logo.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#F97316", // GlobizHR brand orange
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
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground selection:bg-primary/30 selection:text-foreground">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
