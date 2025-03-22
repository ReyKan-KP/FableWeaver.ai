import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { springTransition } from "./animation-variants";
import { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend: "up" | "down";
  trendValue: string;
  color: string;
  description?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color,
  description
}: StatsCardProps) {
  
  const handleCardClick = () => {
    toast.info(`${title} Details`, {
      description: `Current value: ${value.toLocaleString()} (${trend === "up" ? "+" : "-"}${trendValue})`,
      icon: <Icon style={{ color }} />,
    });
  };
  
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={springTransition}
      onClick={handleCardClick}
      className="cursor-pointer"
    >
      <Card className="overflow-hidden relative h-[15vh]">
        <motion.div
          className="absolute inset-0 opacity-10"
          style={{ backgroundColor: color }}
          whileHover={{ opacity: 0.15 }}
          transition={{ duration: 0.2 }}
        />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <motion.div
            whileHover={{ rotate: 15 }}
            transition={springTransition}
          >
            <Icon className="h-4 w-4" style={{ color }} />
          </motion.div>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-2xl font-bold">{value.toLocaleString()}</div>
            <motion.p
              className="text-xs text-muted-foreground flex items-center gap-1 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {description}
            </motion.p>
            <div className="flex items-center pt-2">
              {trend === "up" ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-xs ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
                {trendValue}
              </span>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 