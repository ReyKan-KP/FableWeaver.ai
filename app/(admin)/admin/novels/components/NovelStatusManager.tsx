import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, AlertCircle, Clock, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

interface NovelStatusManagerProps {
  novelId: string;
  currentStatus: string;
  isPublic: boolean;
}

const statusConfig = {
  pending: {
    label: "Pending Review",
    icon: Clock,
    color: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  },
  approved: {
    label: "Approved",
    icon: Check,
    color: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  },
  rejected: {
    label: "Rejected",
    icon: X,
    color: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  },
  draft: {
    label: "Draft",
    icon: FileText,
    color: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
  },
};

export function NovelStatusManager({
  novelId,
  currentStatus,
  isPublic,
}: NovelStatusManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const config = statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.draft;
  const Icon = config.icon;

  const handleSubmit = async () => {
    if (!action) return;

    try {
      setIsSubmitting(true);
      const endpoint = action === "approve" ? "approve" : "reject";
      const response = await fetch(
        `/api/admin/novels/${novelId}/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ feedback }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      toast({
        title: `Novel ${action === "approve" ? "approved" : "rejected"}`,
        description: feedback
          ? `Feedback: ${feedback}`
          : `The novel has been ${action === "approve" ? "approved" : "rejected"}.`,
      });

      setIsOpen(false);
      setFeedback("");
      setAction(null);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${action} novel`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`w-[140px] justify-start gap-2 ${config.color}`}
          >
            <Icon className="h-4 w-4" />
            {config.label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {currentStatus !== "approved" && (
            <DropdownMenuItem
              onClick={() => {
                setAction("approve");
                setIsOpen(true);
              }}
            >
              <Check className="h-4 w-4 mr-2 text-green-500" />
              Approve Novel
            </DropdownMenuItem>
          )}
          {currentStatus !== "rejected" && (
            <DropdownMenuItem
              onClick={() => {
                setAction("reject");
                setIsOpen(true);
              }}
            >
              <X className="h-4 w-4 mr-2 text-red-500" />
              Reject Novel
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "Approve Novel" : "Reject Novel"}
            </DialogTitle>
            <DialogDescription>
              {action === "approve"
                ? "Provide optional feedback for the author before approving the novel."
                : "Please provide feedback explaining why the novel is being rejected."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter your feedback here..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[100px]"
            required={action === "reject"}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setFeedback("");
                setAction(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant={action === "approve" ? "default" : "destructive"}
              onClick={handleSubmit}
              disabled={isSubmitting || (action === "reject" && !feedback.trim())}
            >
              {isSubmitting
                ? "Submitting..."
                : action === "approve"
                ? "Approve Novel"
                : "Reject Novel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 