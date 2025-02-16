import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { containerVariants, fadeIn, springTransition } from "./animation-variants";

interface AnimatedTableProps {
  headers: string[];
  children: React.ReactNode;
}

export function AnimatedTable({ headers, children }: AnimatedTableProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="border rounded-lg overflow-hidden"
    >
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header, index) => (
              <TableHead key={header}>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {header}
                </motion.div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="wait">{children}</AnimatePresence>
        </TableBody>
      </Table>
    </motion.div>
  );
}

export function AnimatedTableRow({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <motion.tr
      variants={fadeIn}
      whileHover={{ scale: 1.01, backgroundColor: "rgba(0,0,0,0.02)" }}
      whileTap={{ scale: 0.99 }}
      transition={springTransition}
      onClick={onClick}
      className="cursor-pointer"
    >
      {children}
    </motion.tr>
  );
} 