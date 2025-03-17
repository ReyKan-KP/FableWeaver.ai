"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Mail,
  User,
  Calendar,
  Loader2,
  RefreshCw,
  Search,
  XCircle,
  Info,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ContactSubmission {
  id: string;
  created_at: string;
  sender_name: string;
  sender_email: string;
  sender_message: string;
  message_type: string;
}

export default function ContactSubmissionsPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSubmissions, setFilteredSubmissions] = useState<ContactSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(null);

  const fetchContactSubmissions = async () => {
    setIsLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from('contact')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setContactSubmissions(data || []);
      setFilteredSubmissions(data || []);
    } catch (error) {
      console.error("Error fetching contact submissions:", error);
      toast.error("Failed to load contact submissions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubmission = async () => {
    if (!submissionToDelete) return;
    
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase
        .from('contact')
        .delete()
        .eq('id', submissionToDelete);

      if (error) {
        throw error;
      }

      toast.success("Submission deleted successfully");
      
      // Remove the deleted submission from the state
      setContactSubmissions(prev => 
        prev.filter(submission => submission.id !== submissionToDelete)
      );
      setFilteredSubmissions(prev => 
        prev.filter(submission => submission.id !== submissionToDelete)
      );
      
      // Close the dialogs
      setIsDeleteDialogOpen(false);
      setSubmissionToDelete(null);
      
      // If the deleted submission was being viewed, close that dialog too
      if (selectedSubmission?.id === submissionToDelete) {
        setSelectedSubmission(null);
      }
    } catch (error) {
      console.error("Error deleting submission:", error);
      toast.error("Failed to delete submission");
    }
  };

  useEffect(() => {
    if (session) {
      fetchContactSubmissions();
    }
  }, [session]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSubmissions(contactSubmissions);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = contactSubmissions.filter(
        (submission) =>
          submission.sender_name?.toLowerCase().includes(lowercaseQuery) ||
          submission.sender_email?.toLowerCase().includes(lowercaseQuery) ||
          submission.sender_message?.toLowerCase().includes(lowercaseQuery)
      );
      setFilteredSubmissions(filtered);
    }
  }, [searchQuery, contactSubmissions]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch (error) {
      return "Invalid date";
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading contact submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container py-10 max-w-7xl mx-auto">
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Contact Submissions</h1>
              <p className="text-muted-foreground">
                View and manage contact form submissions from users
              </p>
            </div>
            <Button 
              onClick={fetchContactSubmissions}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>All Submissions</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search submissions..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-2.5"
                    >
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
              <CardDescription>
                {filteredSubmissions.length} submissions found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>
                  {filteredSubmissions.length === 0
                    ? "No contact submissions found"
                    : "List of all contact form submissions"}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-[300px]">Message</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(submission.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {submission.sender_name || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a 
                            href={`mailto:${submission.sender_email}`}
                            className="text-primary hover:underline"
                          >
                            {submission.sender_email || "N/A"}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                          <span className="line-clamp-2">{submission.sender_message || "No message"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                            {submission.message_type || "contact"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedSubmission(submission)}
                            title="View details"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive/80"
                            onClick={() => {
                              setSubmissionToDelete(submission.id);
                              setIsDeleteDialogOpen(true);
                            }}
                            title="Delete submission"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submission Detail Dialog */}
      <Dialog 
        open={!!selectedSubmission} 
        onOpenChange={(open) => !open && setSelectedSubmission(null)}
      >
        {selectedSubmission && (
          <DialogContent className="max-w-md sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Contact Submission Details</DialogTitle>
              <DialogDescription>
                Submission from {selectedSubmission.sender_name || 'Unknown'} on {formatDate(selectedSubmission.created_at)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Name</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <p className="font-medium">{selectedSubmission.sender_name || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <a 
                    href={`mailto:${selectedSubmission.sender_email}`}
                    className="font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    {selectedSubmission.sender_email || 'N/A'}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Message</p>
                <div className="bg-secondary/50 rounded-md p-3">
                  <p className="whitespace-pre-wrap">{selectedSubmission.sender_message || 'No message'}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Type</p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                    {selectedSubmission.message_type || "contact"}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Submission ID</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-mono bg-secondary/50 px-2 py-1 rounded">{selectedSubmission.id}</p>
                </div>
              </div>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button
                variant="destructive"
                onClick={() => {
                  setSubmissionToDelete(selectedSubmission.id);
                  setIsDeleteDialogOpen(true);
                }}
                className="gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedSubmission(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the contact submission from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSubmissionToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSubmission}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 