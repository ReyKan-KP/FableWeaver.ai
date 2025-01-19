"use client";

import Image from "next/image";
import Link from "next/link";
import { SignInForm } from "@/app/(auth)/sign-in/_components/sign-in-form";
import { Toaster } from "sonner";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignIn() {
  return (
    <section className="min-h-screen flex items-center justify-center">
      <Toaster />
      <div className="w-full max-w-6xl p-4 sm:p-6 lg:p-8">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                className="flex flex-col justify-center p-6 sm:p-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                    Welcome Back to FableWeaver.ai
                  </CardTitle>
                  <CardDescription className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                    Don&apos;t have an account?{" "}
                    <Link
                      href="/sign-up"
                      className="font-semibold text-primary transition-all duration-200 hover:underline"
                    >
                      Create a free account
                    </Link>
                  </CardDescription>
                </CardHeader>
                <SignInForm />
              </motion.div>
              <motion.div
                className="hidden lg:flex items-center justify-center p-6 rounded-r-lg"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Image
                  className="rounded-lg shadow-xl"
                  src="/images/sign-in.svg"
                  alt="Sign in illustration"
                  width={500}
                  height={500}
                  objectFit="contain"
                />
              </motion.div>
            </div>
          </CardContent>
      </div>
    </section>
  );
}
