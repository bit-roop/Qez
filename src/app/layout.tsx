import "./globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Syne } from "next/font/google";
import { ReactNode } from "react";
import { ScrollRestoration } from "@/components/scroll-restoration";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"]
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["700", "800"]
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
    <html lang="en">
      <body className={`${jakarta.variable} ${syne.variable} app-body`}>
        <ScrollRestoration />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
