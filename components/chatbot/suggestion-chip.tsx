"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { SparklesIcon } from "lucide-react"

interface SuggestionChipProps {
  text: string
  onClick: () => void
}

export default function SuggestionChip({ text, onClick }: SuggestionChipProps) {
  return (
    <motion.div 
      whileHover={{ scale: 1.05, y: -3 }} 
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3,
        type: "spring",
        stiffness: 400,
        damping: 15
      }}
    >
      <Button 
        variant="outline" 
        className="rounded-full text-sm py-1.5 px-4 h-auto flex items-center gap-1.5 border-primary/30 shadow-sm hover:shadow-md hover:border-primary/60 transition-all duration-300 bg-background/60 backdrop-blur-sm"
        onClick={onClick}
      >
        <SparklesIcon className="w-3 h-3 text-primary animate-pulse" />
        {text}
      </Button>
    </motion.div>
  )
}

