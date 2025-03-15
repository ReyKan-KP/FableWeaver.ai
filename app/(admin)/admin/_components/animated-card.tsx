import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { scaleIn, springTransition } from "./animation-variants";
import { toast } from "sonner";

interface AnimatedCardProps {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function AnimatedCard({
  title,
  icon: Icon,
  children,
  className,
  onClick,
}: AnimatedCardProps) {
  
  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      toast.info(`${title}`, {
        description: "Card clicked",
        icon: Icon ? <Icon className="h-5 w-5" /> : undefined,
      });
    }
  };
  
  return (
    <motion.div
      variants={scaleIn}
      transition={springTransition}
      whileHover={{ y: -5 }}
      onClick={handleCardClick}
      className="cursor-pointer"
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