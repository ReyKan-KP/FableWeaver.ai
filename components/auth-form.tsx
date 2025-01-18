"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { signUp, signIn } from "@/actions/auth-actions";
import { motion } from "framer-motion";
import { signIn as signInNextAuth } from "next-auth/react";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);

    try {
      if (mode === "signup") {
        const result = await signUp(formData);
        if (result?.error) {
          throw new Error(result.error);
        }
      }

      // Sign in with NextAuth
      const signInResult = await signInNextAuth("credentials", {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }

      router.push("/weave-anime");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      await signInNextAuth("google", {
        callbackUrl: "/weave-anime",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign in with Google",
        variant: "destructive",
      });
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl"
    >
      <form action={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              placeholder="Enter your username"
              required
              className="bg-gray-50 dark:bg-gray-700"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            required
            className="bg-gray-50 dark:bg-gray-700"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            required
            className="bg-gray-50 dark:bg-gray-700"
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          disabled={loading}
        >
          {loading ? "Loading..." : mode === "login" ? "Sign In" : "Sign Up"}
        </Button>
      </form>
      <div className="mt-4">
        <Button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
          disabled={loading}
        >
          Sign in with Google
        </Button>
      </div>
    </motion.div>
  );
}
