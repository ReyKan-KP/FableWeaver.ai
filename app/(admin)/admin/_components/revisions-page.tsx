"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Eye, History } from "lucide-react";
import { formatDistance } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface ChapterRevision {
  id: string;
  chapter_id: string;
  content: string;
  summary: string;
  version: number;
  created_at: string;
  created_by: string;
  novel_title?: string;
  chapter_title?: string;
}

export default function RevisionsPage() {
  const [revisions, setRevisions] = useState<ChapterRevision[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRevision, setSelectedRevision] = useState<ChapterRevision | null>(null);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    fetchRevisions();
  }, []);

  const fetchRevisions = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("chapter_revisions")
        .select(`
          *,
          chapters:chapter_id (
            title,
            novels:novel_id (
              title
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const processedData = data.map(revision => ({
        ...revision,
        novel_title: revision.chapters?.novels?.title,
        chapter_title: revision.chapters?.title,
      }));

      setRevisions(processedData);
      toast.success("Revisions loaded successfully", {
        description: `${processedData.length} revisions found`,
      });
    } catch (error) {
      console.error("Error fetching revisions:", error);
      toast.error("Failed to load revisions", {
        description: "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRevisions = revisions.filter((revision) =>
    revision.chapter_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    revision.novel_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Chapter Revisions</h1>
          <p className="text-sm text-gray-500">Track all chapter changes and revisions</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search revisions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Novel</TableHead>
              <TableHead>Chapter</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Modified</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRevisions.map((revision) => (
              <TableRow key={revision.id}>
                <TableCell className="font-medium">
                  {revision.novel_title}
                </TableCell>
                <TableCell>{revision.chapter_title}</TableCell>
                <TableCell>
                  <Badge variant="outline">v{revision.version}</Badge>
                </TableCell>
                <TableCell>
                  {formatDistance(new Date(revision.created_at), new Date(), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedRevision(revision)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedRevision} onOpenChange={() => setSelectedRevision(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Revision Details
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-full mt-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {selectedRevision?.novel_title} - {selectedRevision?.chapter_title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Badge variant="outline">v{selectedRevision?.version}</Badge>
                  <span>•</span>
                  <span>
                    {selectedRevision?.created_at &&
                      formatDistance(new Date(selectedRevision.created_at), new Date(), {
                        addSuffix: true,
                      })}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Summary</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    {selectedRevision?.summary}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Content</h4>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {selectedRevision?.content.split("\n").map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
} 