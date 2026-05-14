import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CréaScope — Diagnostiquez votre projet entrepreneurial avec l'IA",
  description:
    "CréaScope est une plateforme SaaS innovante qui combine intelligence artificielle et accompagnement humain pour diagnostiquer et guider les projets entrepreneuriaux. Accessible, gamifiée et modulaire.",
  keywords: [
    "CréaScope",
    "entrepreneuriat",
    "diagnostic",
    "IA",
    "intelligence artificielle",
    "création d'entreprise",
    "accompagnement",
    "startup",
  ],
  authors: [{ name: "CréaScope" }],
  openGraph: {
    title: "CréaScope — Diagnostic Entrepreneurial IA",
    description:
      "Diagnostiquez votre projet entrepreneurial avec l'IA. Gamification, accessibilité et accompagnement personnalisé.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
