"use client";

import { motion, AnimatePresence } from "framer-motion";
import { theme } from "@/styles/theme";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen  relative overflow-hidden"
      >
        {/* Animated background elements */}
        <motion.div
          className="absolute inset-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <motion.div
            className="absolute -top-40 -right-40 w-80 h-80 bg-violet-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, -90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 45, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            duration: 0.6,
            type: "spring",
            stiffness: 100,
            damping: 20,
          }}
          className="container relative z-10 mx-auto px-4 py-8 pt-16"
        >
          <motion.div
            className="relative z-10 w-full max-w-7xl mx-auto"
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.5,
              type: "spring",
              stiffness: 200,
              damping: 25,
            }}
          >
            <motion.div
              className="backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-200/50"
              whileHover={{
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                transition: { duration: 0.3 },
              }}
            >
              <motion.div
                className="p-6 sm:p-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {children}
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
