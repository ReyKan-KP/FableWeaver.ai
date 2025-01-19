"use client";

import Image from "next/image";
import Link from "next/link";
import { SignUpForm } from "@/app/(auth)/sign-up/_components/sign-up-form";
import { Toaster } from "sonner";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignUp() {
  return (
    <section className="min-h-screen flex items-center justify-center">
      <Toaster />
      <div className="w-full max-w-6xl p-4 sm:p-6 lg:p-8">
        {/* <Card className="w-full"> */}
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
                    Join FableWeaver.ai
                  </CardTitle>
                  <CardDescription className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                    Already have an account?{" "}
                    <Link
                      href="/sign-in"
                      className="font-semibold text-primary transition-all duration-200 hover:underline"
                    >
                      Sign In
                    </Link>
                  </CardDescription>
                </CardHeader>
                <SignUpForm />
              </motion.div>
              <motion.div
                className="hidden lg:flex items-center justify-center p-6 rounded-r-lg"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Image
                  className="rounded-lg shadow-xl"
                  src="/images/sign-up.svg"
                  alt="Sign up illustration"
                  width={500}
                  height={500}
                  objectFit="contain"
                />
              </motion.div>
            </div>
          </CardContent>
        {/* </Card> */}
      </div>
    </section>
  );
}
