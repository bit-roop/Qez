import "./globals.css";
import "./globals_ui_improvements.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { ToastProvider } from "@/components/feedback/toast-provider";
import { ScrollRestoration } from "@/components/scroll-restoration";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Manrope, Sora } from "next/font/google";

const jakarta = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"]
});

const syne = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["600", "700", "800"]
});

export const metadata: Metadata = {
  title: "Qez",
  description: "Smart quizzes for classrooms and live events.",
  icons: {
    icon: "/qez-logo.png",
    shortcut: "/qez-logo.png",
    apple: "/qez-logo.png"
  }
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.variable} ${syne.variable} app-body`} suppressHydrationWarning>
        <ToastProvider>
          <ScrollRestoration />
          <SiteHeader />
          {children}
          <SiteFooter />
        </ToastProvider>
      </body>
    </html>
  );
}
