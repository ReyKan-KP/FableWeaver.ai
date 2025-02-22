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
        className="min-h-screen"
      >
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
          className="container mx-auto px-4 py-8 pt-16"
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
              className="backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
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
