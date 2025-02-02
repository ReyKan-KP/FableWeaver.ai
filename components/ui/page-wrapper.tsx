import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      type: "spring",
      stiffness: 100,
      damping: 20,
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      type: "spring",
      stiffness: 100,
      damping: 20,
    },
  },
};

export function PageWrapper({
  children,
  className,
  title,
  subtitle,
}: PageWrapperProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={cn("space-y-6", className)}
      >
        {(title || subtitle) && (
          <motion.div className="space-y-1" variants={containerVariants}>
            {title && (
              <motion.div className="overflow-hidden" variants={itemVariants}>
                <motion.h1
                  className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent"
                  whileHover={{
                    scale: 1.01,
                    transition: { duration: 0.2 },
                  }}
                >
                  {title}
                </motion.h1>
              </motion.div>
            )}
            {subtitle && (
              <motion.div className="overflow-hidden" variants={itemVariants}>
                <motion.p
                  className="text-muted-foreground"
                  whileHover={{
                    x: 5,
                    transition: { duration: 0.2 },
                  }}
                >
                  {subtitle}
                </motion.p>
              </motion.div>
            )}
          </motion.div>
        )}
        <motion.div variants={containerVariants} className="relative">
          {children}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary-100/5 to-secondary-100/5 dark:from-primary-900/5 dark:to-secondary-900/5 pointer-events-none rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
