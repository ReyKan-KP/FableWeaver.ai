"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface ExportButtonProps {
  novelId: string;
}

export default function ExportButton({ novelId }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await fetch("/api/story-weaver/export-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ novelId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to export PDF");
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element
      const link = document.createElement("a");
      link.href = url;
      link.download = `novel-${novelId}.pdf`;

      // Append to the document, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Your novel has been exported as PDF",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Error",
        description: "Failed to export novel as PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
    >
      <Button
        onClick={handleExport}
        disabled={isExporting}
        variant="outline"
        className="gap-2 bg-gradient-to-r hover:from-violet-500/10 hover:via-blue-500/10 hover:to-teal-500/10 transition-all duration-300 hover:shadow-md border-gradient-to-r from-violet-500/20 via-blue-500/20 to-teal-500/20"
      >
        {isExporting ? (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
            <span className="bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 text-transparent bg-clip-text">
              Exporting...
            </span>
          </motion.div>
        ) : (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <FileDown className="h-4 w-4 text-violet-500" />
            <span className="bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 text-transparent bg-clip-text">
              Export as PDF
            </span>
          </motion.div>
        )}
      </Button>
    </motion.div>
  );
}
