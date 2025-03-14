"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary/80 text-primary-foreground shadow hover:bg-primary/90 dark:hover:bg-neutral-800 dark:hover:text-neutral-200",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 dark:hover:bg-neutral-800 dark:hover:text-neutral-200",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-primary/70 dark:hover:bg-neutral-800 dark:hover:text-neutral-200",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90 dark:hover:bg-neutral-800 dark:hover:text-neutral-200",
        ghost: "hover:bg-accent hover:text-primary/80 dark:hover:bg-neutral-800 dark:hover:text-neutral-200",
        link: "text-primary underline-offset-4 hover:underline",
        gradient:
          "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-sm hover:opacity-90 relative overflow-hidden",
        transparent: "bg-transparent text-primary-foreground shadow-sm hover:opacity-90 relative overflow-hidden",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const buttonAnimation = {
  rest: {
    scale: 1,
    transition: {
      duration: 0.2,
      type: "spring",
      stiffness: 400,
      damping: 17,
    },
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      type: "spring",
      stiffness: 400,
      damping: 17,
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
    },
  },
}

const glowAnimation = {
  rest: {
    opacity: 0,
    x: "100%",
  },
  hover: {
    opacity: [0, 1, 0],
    x: ["-100%", "0%", "100%"],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear",
    },
  },
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isGradient = variant === "gradient"

    return (
      <motion.div
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        animate="rest"
        variants={buttonAnimation}
      >
        <div className="relative">
          <Comp
            className={cn(buttonVariants({ variant, size, className }))}
            ref={ref}
            {...props}
          />
          {isGradient && (
            <motion.div
              variants={glowAnimation}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none dark:via-white/10"
            />
          )}
        </div>
      </motion.div>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
