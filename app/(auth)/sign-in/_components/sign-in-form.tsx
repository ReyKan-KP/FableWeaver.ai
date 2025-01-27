"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function SignInForm() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const router = useRouter();

  const formFields = {
    email: {
      label: "Email address",
      type: "email",
      placeholder: "Enter your email",
      value: email,
      onChange: setEmail,
    },
    password: {
      label: "Password",
      type: "password",
      placeholder: "Enter your password",
      value: password,
      onChange: setPassword,
    },
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email,
        password: password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      toast.success("Signed in successfully!");
      router.push("/weave-anime");
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      await signIn("google", {
        callbackUrl: "/weave-anime",
      });
    } catch (error) {
      toast.error("Failed to sign in with Google");
      setLoading(false);
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  const inputVariants = {
    focused: {
      scale: 1.02,
      boxShadow: "0 0 0 2px rgba(147, 197, 253, 0.3)",
      transition: { duration: 0.2 },
    },
    unfocused: {
      scale: 1,
      boxShadow: "none",
      transition: { duration: 0.2 },
    },
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="wait">
        {Object.entries(formFields).map(([key, field]) => (
          <motion.div
            key={key}
            className="space-y-2"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="flex items-center justify-between">
              <Label htmlFor={key}>{field.label}</Label>
              {key === "password" && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/forgot-password"
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </motion.div>
              )}
            </div>
            <motion.div
              variants={inputVariants}
              animate={focusedField === key ? "focused" : "unfocused"}
            >
              <Input
                id={key}
                type={field.type}
                placeholder={field.placeholder}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onFocus={() => setFocusedField(key)}
                onBlur={() => setFocusedField(null)}
                className="transition-all duration-200 hover:border-primary/50 focus:border-primary"
                required
              />
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.div
        className="flex items-center space-x-2"
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
      >
        <Checkbox id="remember" />
        <Label htmlFor="remember">Remember me</Label>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Button
          type="submit"
          className="w-full h-12 border border-gray-300 focus:ring-4 focus:ring-gray-100 hover:shadow-[0_0_15px_rgba(119, 0, 255, 0.3)] transition-all duration-300 bg-gradient-to-r from-purple-600 via-blue-600 to-teal-500 hover:scale-[1.02]"
          disabled={loading}
        >
          <motion.div
            className="flex items-center justify-center w-full"
            initial={false}
            animate={loading ? { opacity: 0.7 } : { opacity: 1 }}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                Sign In
                <motion.div
                  className="ml-2"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <ArrowRight size={16} />
                </motion.div>
              </>
            )}
          </motion.div>
        </Button>
      </motion.div>

      <motion.div className="relative" variants={itemVariants}>
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <motion.span
            className="bg-background px-2 text-muted-foreground"
            whileHover={{ scale: 1.05 }}
          >
            Or continue with
          </motion.span>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Button
          onClick={handleGoogleSignIn}
          variant="outline"
          className="w-full h-12 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-800 border border-gray-300 focus:ring-4 focus:ring-gray-100 hover:shadow-[0_0_15px_rgba(119, 0, 255, 0.3)] transition-all duration-300"
          aria-label="Sign in with Google"
        >
          <motion.div
            className="flex items-center justify-center w-full"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.svg
              className="mr-2 h-4 w-4"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="github"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
              <path d="M1 1h22v22H1z" fill="none" />
            </motion.svg>
            Sign in with Google
          </motion.div>
        </Button>
      </motion.div>
    </motion.form>
  );
}
