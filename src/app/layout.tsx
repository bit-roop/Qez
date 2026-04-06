import "./globals.css";
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ReactNode } from "react";
import { ScrollRestoration } from "@/components/scroll-restoration";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Qez",
  description: "Smart quizzes for classrooms and live events."
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} app-body`}>
        <ScrollRestoration />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
