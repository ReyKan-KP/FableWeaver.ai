import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ContentCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  active?: boolean;
  delay?: number;
}

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      delay: delay,
      type: "spring",
      stiffness: 100,
      damping: 20,
    },
  }),
  hover: {
    scale: 1.02,
    y: -5,
    transition: {
      duration: 0.3,
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

export function ContentCard({
  children,
  className,
  onClick,
  hover = true,
  active = false,
  delay = 0,
}: ContentCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={hover ? "hover" : undefined}
      whileTap={hover ? "tap" : undefined}
      custom={delay}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-background/60 p-6",
        "backdrop-blur-lg transition-colors",
        "border-border/40 dark:border-border/40",
        "shadow-sm hover:shadow-xl",
        active && "ring-2 ring-primary-500",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.1 }}
      >
        {children}
      </motion.div>
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary-100/10 to-secondary-100/10 
        dark:from-primary-900/10 dark:to-secondary-900/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.2 }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary-400/0 to-secondary-400/0 
        hover:from-primary-400/5 hover:to-secondary-400/5 
        dark:hover:from-primary-400/10 dark:hover:to-secondary-400/10
        transition-all duration-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.3 }}
      />
    </motion.div>
  );
}
