import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { springTransition } from "./animation-variants";
import { toast } from "sonner";

interface AnimatedSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSearch?: (value: string) => void;
}

export function AnimatedSearch({
  value,
  onChange,
  placeholder = "Search...",
  onSearch,
}: AnimatedSearchProps) {
  
  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    
    if (newValue.length > 2) {
      if (onSearch) {
        onSearch(newValue);
      }
    }
  };
  
  const handleClear = () => {
    onChange("");
    toast.info("Search cleared");
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      if (onSearch) {
        onSearch(value);
      }
      toast.success(`Searching for "${value}"`, {
        icon: <Search className="h-4 w-4" />,
      });
    }
  };
  
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
    >
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10 w-full"
        onKeyDown={handleKeyDown}
      />
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={springTransition}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
            onClick={handleClear}
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 