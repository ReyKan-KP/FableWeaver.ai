import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface DeleteNovelDialogProps {
  novelId: string;
  novelTitle: string;
  trigger: React.ReactNode;
}

export function DeleteNovelDialog({
  novelId,
  novelTitle,
  trigger,
}: DeleteNovelDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(
        `/api/admin/novels/${novelId}/delete`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      toast({
        title: "Novel deleted",
        description: `"${novelTitle}" has been successfully deleted.`,
      });
      
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete novel",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Novel
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{novelTitle}&quot;? This action cannot be
            undone. All associated chapters, comments, and data will be permanently
            deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Novel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 