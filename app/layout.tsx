import { Navbar } from "@/components/layout/navbar";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Inter } from "next/font/google";
import AuthProvider from "@/components/providers/session-provider";
import "./globals.css";
import Footer from "@/components/layout/footer";
import { Analytics } from "@vercel/analytics/react";
import { AnimatedGradient } from "@/components/ui/animated-gradient";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FableWeaver.ai",
  description: "Where AI Weaves Your Story Universe",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} transition-colors duration-300`}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Navbar />
            <AnimatedGradient />
            <main className="pt-28">
              <Toaster />
              {children}
            </main>
            <footer className="mt-auto">
              <Footer />
            </footer>
            <Analytics />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
