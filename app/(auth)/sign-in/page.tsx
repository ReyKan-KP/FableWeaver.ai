"use client";

import Image from "next/image";
import Link from "next/link";
import { SignInForm } from "@/app/(auth)/sign-in/_components/sign-in-form";
import { Toaster } from "sonner";
import { motion, useMotionValue, useSpring } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignIn() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150 };
  const rotateX = useSpring(useMotionValue(0), springConfig);
  const rotateY = useSpring(useMotionValue(0), springConfig);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = event;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();

    const xPos = (clientX - left) / width - 0.5;
    const yPos = (clientY - top) / height - 0.5;

    mouseX.set(xPos * 20);
    mouseY.set(yPos * -20);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.section
      className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Toaster />
      <motion.div
        className="w-full max-w-6xl p-4 sm:p-6 lg:p-8"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          perspective: 1000,
        }}
      >
        <CardContent className="p-0">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="flex flex-col justify-center p-6 sm:p-8  backdrop-blur-sm rounded-2xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
            >
              <CardHeader className="p-0 mb-6">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <CardTitle className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
                    Welcome Back to FableWeaver.ai
                  </CardTitle>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <CardDescription className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                    Don&apos;t have an account?{" "}
                    <motion.span whileHover={{ scale: 1.05 }}>
                      <Link
                        href="/sign-up"
                        className="font-semibold text-primary transition-all duration-200 hover:underline"
                      >
                        Create a free account
                      </Link>
                    </motion.span>
                  </CardDescription>
                </motion.div>
              </CardHeader>
              <SignInForm />
            </motion.div>
            <motion.div
              className="hidden lg:flex items-center justify-center p-6 rounded-2xl backdrop-blur-sm overflow-hidden"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
            >
              <motion.div
                className="relative w-full h-full"
                animate={{
                  rotateY: [0, 5, 0, -5, 0],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <Image
                  className="rounded-lg shadow-xl"
                  src="/images/sign-in.svg"
                  alt="Sign in illustration"
                  width={500}
                  height={500}
                  objectFit="contain"
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg"
                  animate={{
                    opacity: [0, 0.2, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </CardContent>
      </motion.div>
    </motion.section>
  );
}
