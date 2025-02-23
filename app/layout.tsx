import { Navbar } from "@/components/layout/navbar";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Toaster2 } from "sonner";
import { Inter } from "next/font/google";
import AuthProvider from "@/components/providers/session-provider";
import "./globals.css";
import Footer from "@/components/layout/footer";
import { Analytics } from "@vercel/analytics/react";
import { AnimatedGradient } from "@/components/ui/animated-gradient";
import type { Metadata } from "next";
import { updateLastSeen } from "@/lib/supabase";
import { createServerSupabaseClient } from "@/lib/supabase";
import { PostHogProvider } from "@/components/providers/posthog-provider";
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
  // Get the current user's session
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Update last_seen if user is logged in
  if (session?.user?.id) {
    await updateLastSeen(session.user.id);
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} transition-colors duration-300`}>
        <AuthProvider>
          <PostHogProvider>
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
              <Toaster2 />
              {children}
            </main>
            <footer className="mt-auto">
              <Footer />
            </footer>
            <Analytics />
            </ThemeProvider>
          </PostHogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
