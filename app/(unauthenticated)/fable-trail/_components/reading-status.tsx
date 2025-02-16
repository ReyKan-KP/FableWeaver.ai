"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Eye,
  Clock,
  Timer,
  Hourglass,
  XCircle,
  ChevronDown,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReadingStatusProps {
  novelId: string;
  initialStatus?: string;
  onStatusChange?: (status: string) => void;
}

const statusConfig = {
  reading: {
    icon: BookOpen,
    label: "Reading Now",
    color: "text-blue-500 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
  },
  viewed: {
    icon: Eye,
    label: "Viewed",
    color: "text-purple-500 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
  },
  will_read: {
    icon: Clock,
    label: "Will Read",
    color: "text-green-500 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/20",
  },
  awaiting: {
    icon: Timer,
    label: "Awaiting",
    color: "text-yellow-500 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
  },
  delayed: {
    icon: Hourglass,
    label: "Delayed",
    color: "text-orange-500 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
  },
  dropped: {
    icon: XCircle,
    label: "Dropped",
    color: "text-red-500 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-900/20",
  },
};

export default function ReadingStatus({
  novelId,
  initialStatus,
  onStatusChange,
}: ReadingStatusProps) {
  const { data: session } = useSession();
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);

  const updateStatus = async (newStatus: string) => {
    if (!session) {
      toast.error("Please sign in to track your reading status");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/reading-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          novel_id: novelId,
          status: newStatus,
        }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      setStatus(newStatus);
      onStatusChange?.(newStatus);
      toast.success(
        `Status updated to ${statusConfig[newStatus as keyof typeof statusConfig].label}`
      );
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update reading status");
    } finally {
      setIsLoading(false);
    }
  };

  const removeStatus = async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/reading-status?novelId=${novelId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to remove status");
      setStatus("");
      onStatusChange?.("");
      toast.success("Reading status removed");
    } catch (error) {
      console.error("Error removing status:", error);
      toast.error("Failed to remove reading status");
    } finally {
      setIsLoading(false);
    }
  };

  const currentStatus = status
    ? statusConfig[status as keyof typeof statusConfig]
    : null;
  const StatusIcon = currentStatus?.icon || BookOpen;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={status ? "outline" : "default"}
          size="sm"
          className={cn(
            "w-full justify-between",
            currentStatus?.color,
            currentStatus?.bgColor
          )}
          disabled={isLoading}
        >
          <div className="flex items-center gap-2">
            <StatusIcon className="w-4 h-4" />
            <span>
              {currentStatus ? currentStatus.label : "Add to Reading List"}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {Object.entries(statusConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => updateStatus(key)}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                status === key && "bg-accent"
              )}
            >
              <Icon className={cn("w-4 h-4", config.color)} />
              <span className="flex-1">{config.label}</span>
              {status === key && <Check className="w-4 h-4" />}
            </DropdownMenuItem>
          );
        })}
        {status && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={removeStatus}
              className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Remove Status</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
