import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { scaleIn, springTransition } from "./animation-variants";

interface AnimatedCardProps {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
}

export function AnimatedCard({
  title,
  icon: Icon,
  children,
  className,
}: AnimatedCardProps) {
  return (
    <motion.div
      variants={scaleIn}
      transition={springTransition}
      whileHover={{ y: -5 }}
    >
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {Icon && (
              <motion.div
                whileHover={{ rotate: 15 }}
                transition={springTransition}
              >
                <Icon className="h-5 w-5" />
              </motion.div>
            )}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
} 