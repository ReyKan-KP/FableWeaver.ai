// app/providers.jsx
"use client";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";
import { ReactNode } from "react";
import PostHogPageView from "@/app/(admin)/PostHostPageView/page";
interface PostHogProviderProps {
  children: ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    const phKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!phKey) {
      console.warn("PostHog key is not defined");
      return;
    }

    posthog.init(phKey, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      capture_pageview: false,
      autocapture: false,
      loaded: (posthog) => {
        // Disable console logging and error reporting
        posthog.opt_out_capturing();
      }
    });
  }, []);

  return (
    <PHProvider client={posthog}>
      <PostHogPageView />
      {children}
    </PHProvider>
  );
}
