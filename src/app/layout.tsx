import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { ScrollRestoration } from "@/components/scroll-restoration";
import { SiteHeader } from "@/components/site-header";

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
      <body>
        <ScrollRestoration />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
