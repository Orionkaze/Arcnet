import type { Metadata } from "next";
import { Chakra_Petch, Inter, Manrope } from "next/font/google";
import "./globals.css";
import { AuthInit } from "@/components/auth/AuthInit";
import { DemoAuthGate } from "@/components/auth/DemoAuthGate";
import { ThemeScript } from "@/components/theme/ThemeScript";

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Caliber",
  description: "Practice real problems. Get instant feedback. Build a rating that proves your ability.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${chakraPetch.variable} ${inter.variable} ${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col font-sans text-arc-primary" suppressHydrationWarning>
        <AuthInit />
        <DemoAuthGate>{children}</DemoAuthGate>
      </body>
    </html>
  );
}
