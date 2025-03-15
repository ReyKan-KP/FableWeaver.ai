"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Layers, MessageCircle, ThumbsUp, Filter, Search, RefreshCw, Download, Trash2, Edit, Eye, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";  
import Loading from "./loading";

// Define interfaces for thread data
interface Thread {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  status: "published" | "draft" | "archived";
  comment_count: number;
  reaction_count: number;
  like_count: number;
  dislike_count: number;
  view_count: number;
  user_name: string;
  user_avatar: string;
  report_count?: number;
}

interface Comment {
  id: string;
  thread_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  likes_count: number;
  dislikes_count: number;
  status: "active" | "deleted";
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_avatar?: string;
  replies_count?: number;
}

interface ThreadStats {
  totalThreads: number;
  totalComments: number;
  totalReactions: number;
  totalViews: number;
  totalReports: number;
  threadsPerDay: { date: string; count: number }[];
  threadsByStatus: { status: string; count: number }[];
  topThreads: Thread[];
  mostActiveUsers: { user_id: string; user_name: string; thread_count: number }[];
  reactionsByType: { type: string; count: number }[];
  reportsByStatus: { status: string; count: number }[];
  commentsByStatus: { status: string; count: number }[];
}

interface Report {
  id: string;
  user_id: string;
  target_type: "thread" | "comment";
  target_id: string;
  reason: string;
  status: "pending" | "reviewed" | "resolved";
  created_at: string;
  updated_at: string;
  user_name: string;
  target_title?: string;
}

// Define chart colors
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe"];

export default function ThreadTapestryAdmin() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [stats, setStats] = useState<ThreadStats>({
    totalThreads: 0,
    totalComments: 0,
    totalReactions: 0,
    totalViews: 0,
    totalReports: 0,
    threadsPerDay: [],
    threadsByStatus: [],
    topThreads: [],
    mostActiveUsers: [],
    reactionsByType: [],
    reportsByStatus: [],
    commentsByStatus: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("threads");
  const [reportStatusFilter, setReportStatusFilter] = useState<string>("all");
  const [commentStatusFilter, setCommentStatusFilter] = useState<string>("all");
  
  // State for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'thread' | 'report' | 'comment' } | null>(null);
  
  // State for edit functionality
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingThread, setEditingThread] = useState<Thread | null>(null);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  
  useEffect(() => {
    fetchThreadData();
  }, []);

  const fetchThreadData = async () => {
    try {
      setIsLoading(true);
      const supabase = createBrowserSupabaseClient();

      // Fetch users first
      const { data: userData, error: userError } = await supabase
        .from("user")
        .select("user_id, user_name, avatar_url");

      if (userError) throw userError;

      // Create a map of user IDs to user data for quick lookup
      const userMap = new Map();
      userData?.forEach(user => {
        userMap.set(user.user_id, {
          name: user.user_name || "Unknown User",
          avatar: user.avatar_url
        });
      });

      // Fetch threads
      const { data: threadsData, error: threadsError } = await supabase
        .from("threads")
        .select("*");

      if (threadsError) throw threadsError;

      // Create a map of thread IDs to thread titles for reports
      const threadMap = new Map();
      threadsData?.forEach(thread => {
        threadMap.set(thread.id, thread.title);
      });

      // Fetch comments count
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("*");

      if (commentsError) throw commentsError;

      // Group comments by thread_id and count them
      const commentCounts: Record<string, number> = {};
      commentsData?.forEach(comment => {
        if (!commentCounts[comment.thread_id]) {
          commentCounts[comment.thread_id] = 0;
        }
        commentCounts[comment.thread_id]++;
      });

      // Count comments by status
      const commentStatusCount: Record<string, number> = {};
      commentsData?.forEach(comment => {
        const status = comment.status;
        commentStatusCount[status] = (commentStatusCount[status] || 0) + 1;
      });

      const commentsByStatus = Object.entries(commentStatusCount).map(([status, count]) => ({
        status,
        count,
      }));

      // Process comments data with user info
      const processedComments = commentsData?.map((comment) => {
        const userData = userMap.get(comment.user_id) || { name: "Unknown User", avatar: "" };
        
        // Count replies for this comment
        const repliesCount = commentsData.filter(c => c.parent_id === comment.id).length;
        
        return {
          id: comment.id,
          thread_id: comment.thread_id,
          user_id: comment.user_id,
          parent_id: comment.parent_id,
          content: comment.content,
          likes_count: comment.likes_count || 0,
          dislikes_count: comment.dislikes_count || 0,
          status: comment.status,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          user_name: userData.name,
          user_avatar: userData.avatar || "",
          replies_count: repliesCount
        };
      }) || [];

      setComments(processedComments);

      // Fetch reactions count - updated for new schema
      const { data: reactionsData, error: reactionsError } = await supabase
        .from("reactions")
        .select("*")
        .eq("target_type", "thread");

      if (reactionsError) throw reactionsError;

      // Group reactions by target_id (thread_id) and count them
      const reactionCounts: Record<string, number> = {};
      const likeCounts: Record<string, number> = {};
      const dislikeCounts: Record<string, number> = {};
      
      reactionsData?.forEach(reaction => {
        if (!reactionCounts[reaction.target_id]) {
          reactionCounts[reaction.target_id] = 0;
        }
        reactionCounts[reaction.target_id]++;
        
        // Count by reaction type
        if (reaction.reaction_type === 'like') {
          if (!likeCounts[reaction.target_id]) {
            likeCounts[reaction.target_id] = 0;
          }
          likeCounts[reaction.target_id]++;
        } else if (reaction.reaction_type === 'dislike') {
          if (!dislikeCounts[reaction.target_id]) {
            dislikeCounts[reaction.target_id] = 0;
          }
          dislikeCounts[reaction.target_id]++;
        }
      });

      // Count reactions by type
      const reactionTypeCount: Record<string, number> = {};
      reactionsData?.forEach(reaction => {
        const type = reaction.reaction_type;
        reactionTypeCount[type] = (reactionTypeCount[type] || 0) + 1;
      });

      const reactionsByType = Object.entries(reactionTypeCount).map(([type, count]) => ({
        type,
        count,
      }));

      // Fetch reports
      const { data: reportsData, error: reportsError } = await supabase
        .from("reports")
        .select("*");

      if (reportsError) throw reportsError;

      // Group reports by target_id and count them
      const reportCounts: Record<string, number> = {};
      reportsData?.forEach(report => {
        if (report.target_type === "thread") {
          if (!reportCounts[report.target_id]) {
            reportCounts[report.target_id] = 0;
          }
          reportCounts[report.target_id]++;
        }
      });

      // Count reports by status
      const reportStatusCount: Record<string, number> = {};
      reportsData?.forEach(report => {
        const status = report.status;
        reportStatusCount[status] = (reportStatusCount[status] || 0) + 1;
      });

      const reportsByStatus = Object.entries(reportStatusCount).map(([status, count]) => ({
        status,
        count,
      }));

      // Process reports data with user info
      const processedReports = reportsData?.map((report) => {
        const userData = userMap.get(report.user_id) || { name: "Unknown User", avatar: "" };
        let targetTitle = "";
        
        if (report.target_type === "thread") {
          targetTitle = threadMap.get(report.target_id) || "Unknown Thread";
        } else if (report.target_type === "comment") {
          targetTitle = "Comment"; // We could fetch comment content if needed
        }
        
        return {
          id: report.id,
          user_id: report.user_id,
          target_type: report.target_type,
          target_id: report.target_id,
          reason: report.reason,
          status: report.status,
          created_at: report.created_at,
          updated_at: report.updated_at,
          user_name: userData.name,
          target_title: targetTitle,
        };
      }) || [];

      setReports(processedReports);

      // Process thread data with user info from the map
      const processedThreads = threadsData?.map((thread) => {
        const userData = userMap.get(thread.user_id) || { name: "Unknown User", avatar: "" };
        const threadId = thread.id as string;
        
        return {
          id: thread.id,
          title: thread.title,
          content: thread.content,
          user_id: thread.user_id,
          created_at: thread.created_at,
          updated_at: thread.updated_at,
          status: thread.status || "published",
          comment_count: commentCounts[threadId] || 0,
          reaction_count: reactionCounts[threadId] || 0,
          like_count: likeCounts[threadId] || 0,
          dislike_count: dislikeCounts[threadId] || 0,
          view_count: thread.view_count || 0,
          report_count: reportCounts[threadId] || 0,
          user_name: userData.name,
          user_avatar: userData.avatar || "",
        };
      }) || [];

      setThreads(processedThreads);

      // Calculate stats
      const now = new Date();
      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - 7);

      // Threads per day for the last week
      const threadsPerDay = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = format(date, "MMM dd");
        const count = processedThreads.filter((thread) => {
          const threadDate = new Date(thread.created_at);
          return (
            threadDate.getDate() === date.getDate() &&
            threadDate.getMonth() === date.getMonth() &&
            threadDate.getFullYear() === date.getFullYear()
          );
        }).length;
        return { date: dateStr, count };
      }).reverse();

      // Threads by status
      const statusCounts: Record<string, number> = {};
      processedThreads.forEach((thread) => {
        const status = thread.status || "published";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const threadsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      }));

      // Top threads by engagement (comments + reactions)
      const topThreads = [...processedThreads]
        .sort((a, b) => {
          const engagementA = a.comment_count + a.reaction_count;
          const engagementB = b.comment_count + b.reaction_count;
          return engagementB - engagementA;
        })
        .slice(0, 5);

      // Most active users
      const userThreadCounts: Record<string, { user_id: string; user_name: string; count: number }> = {};
      processedThreads.forEach((thread) => {
        if (!userThreadCounts[thread.user_id]) {
          userThreadCounts[thread.user_id] = {
            user_id: thread.user_id,
            user_name: thread.user_name,
            count: 0,
          };
        }
        userThreadCounts[thread.user_id].count += 1;
      });

      const mostActiveUsers = Object.values(userThreadCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((user) => ({
          user_id: user.user_id,
          user_name: user.user_name,
          thread_count: user.count,
        }));

      setStats({
        totalThreads: processedThreads.length,
        totalComments: processedThreads.reduce((sum, thread) => sum + thread.comment_count, 0),
        totalReactions: processedThreads.reduce((sum, thread) => sum + thread.reaction_count, 0),
        totalViews: processedThreads.reduce((sum, thread) => sum + (thread.view_count || 0), 0),
        totalReports: processedReports.length,
        threadsPerDay,
        threadsByStatus,
        topThreads,
        mostActiveUsers,
        reactionsByType,
        reportsByStatus: reportsByStatus,
        commentsByStatus: commentsByStatus,
      });
    } catch (error) {
      console.error("Error fetching thread data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter threads based on search query and status filter
  const filteredThreads = threads.filter((thread) => {
    const matchesSearch = searchQuery
      ? thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.user_name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesStatus = statusFilter !== "all" ? thread.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  // Filter reports based on search query and status filter
  const filteredReports = reports.filter((report) => {
    const matchesSearch = searchQuery
      ? report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (report.target_title && report.target_title.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    const matchesStatus = reportStatusFilter !== "all" ? report.status === reportStatusFilter : true;

    return matchesSearch && matchesStatus;
  });

  // Filter comments based on search query and status filter
  const filteredComments = comments.filter((comment) => {
    const matchesSearch = searchQuery
      ? comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (comment.user_name && comment.user_name.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    const matchesStatus = commentStatusFilter !== "all" ? comment.status === commentStatusFilter : true;

    return matchesSearch && matchesStatus;
  });

  // Handler functions for edit and delete operations
  const handleDeleteClick = (id: string, type: 'thread' | 'report' | 'comment') => {
    setItemToDelete({ id, type });
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (item: Thread | Report | Comment, type: 'thread' | 'report' | 'comment') => {
    if (type === 'thread') {
      setEditingThread(item as Thread);
    } else if (type === 'report') {
      setEditingReport(item as Report);
    } else {
      setEditingComment(item as Comment);
    }
    setEditDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    try {
      setIsLoading(true);
      const supabase = createBrowserSupabaseClient();
      
      if (itemToDelete.type === 'thread') {
        // Delete thread
        const { error } = await supabase
          .from('threads')
          .delete()
          .eq('id', itemToDelete.id);
          
        if (error) throw error;
        
        // Also delete associated comments, reactions, and reports
        await supabase
          .from('comments')
          .delete()
          .eq('thread_id', itemToDelete.id);
          
        await supabase
          .from('reactions')
          .delete()
          .eq('target_type', 'thread')
          .eq('target_id', itemToDelete.id);
          
        await supabase
          .from('reports')
          .delete()
          .eq('target_type', 'thread')
          .eq('target_id', itemToDelete.id);
          
        toast({
          title: "Thread deleted",
          description: "The thread and all associated content has been removed.",
        });
      } else if (itemToDelete.type === 'report') {
        // Delete report
        const { error } = await supabase
          .from('reports')
          .delete()
          .eq('id', itemToDelete.id);
          
        if (error) throw error;
        
        toast({
          title: "Report deleted",
          description: "The report has been removed.",
        });
      } else {
        // Delete comment
        const { error } = await supabase
          .from('comments')
          .delete()
          .eq('id', itemToDelete.id);
          
        if (error) throw error;
        
        toast({
          title: "Comment deleted",
          description: "The comment has been removed.",
        });
      }
      
      // Refresh data
      fetchThreadData();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      setIsLoading(false);
    }
  };

  const handleEditSave = async () => {
    try {
      setIsLoading(true);
      const supabase = createBrowserSupabaseClient();
      
      if (editingThread) {
        // Update thread
        const { error } = await supabase
          .from('threads')
          .update({
            title: editingThread.title,
            content: editingThread.content,
            status: editingThread.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingThread.id);
          
        if (error) throw error;
        
        toast({
          title: "Thread updated",
          description: "The thread has been successfully updated.",
        });
      } else if (editingReport) {
        // Update report
        const { error } = await supabase
          .from('reports')
          .update({
            status: editingReport.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingReport.id);
          
        if (error) throw error;
        
        toast({
          title: "Report updated",
          description: "The report status has been updated.",
        });
      } else if (editingComment) {
        // Update comment
        const { error } = await supabase
          .from('comments')
          .update({
            content: editingComment.content,
            status: editingComment.status,
            likes_count: editingComment.likes_count,
            dislikes_count: editingComment.dislikes_count,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingComment.id);
          
        if (error) throw error;
        
        toast({
          title: "Comment updated",
          description: "The comment has been successfully updated.",
        });
      }
      
      // Refresh data
      fetchThreadData();
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "Error",
        description: "Failed to update. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEditDialogOpen(false);
      setEditingThread(null);
      setEditingReport(null);
      setEditingComment(null);
      setIsLoading(false);
    }
  };

  // Define columns for the threads table
  const columns: ColumnDef<Thread>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate font-medium">{row.original.title}</div>
      ),
    },
    {
      accessorKey: "user_name",
      header: "Author",
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => format(new Date(row.original.created_at), "MMM dd, yyyy"),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        let color = "bg-gray-500";
        if (status === "published") color = "bg-green-500";
        if (status === "draft") color = "bg-yellow-500";
        if (status === "archived") color = "bg-red-500";
        
        return (
          <Badge variant="outline" className="capitalize">
            <div className={`w-2 h-2 rounded-full ${color} mr-2`} />
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "comment_count",
      header: "Comments",
      cell: ({ row }) => (
        <div className="flex items-center">
          <MessageCircle className="h-4 w-4 mr-1 text-blue-500" />
          {row.original.comment_count}
        </div>
      ),
    },
    {
      accessorKey: "reaction_count",
      header: "Reactions",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <div className="flex items-center">
            <ThumbsUp className="h-4 w-4 mr-1 text-green-500" />
            <span className="mr-2">{row.original.like_count}</span>
            <ThumbsUp className="h-4 w-4 mr-1 text-red-500 rotate-180" />
            <span>{row.original.dislike_count}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Total: {row.original.reaction_count}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "view_count",
      header: "Views",
      cell: ({ row }) => (
        <div className="flex items-center">
          <Eye className="h-4 w-4 mr-1 text-purple-500" />
          {row.original.view_count || 0}
        </div>
      ),
    },
    {
      accessorKey: "report_count",
      header: "Reports",
      cell: ({ row }) => (
        <div className="flex items-center">
          {(row.original.report_count ?? 0) > 0 ? (
            <div className="flex items-center text-red-500">
              <AlertTriangle className="h-4 w-4 mr-1" />
              {row.original.report_count}
            </div>
          ) : (
            <div className="text-gray-400">0</div>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleEditClick(row.original, 'thread')}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleDeleteClick(row.original.id, 'thread')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Define columns for the reports table
  const reportColumns: ColumnDef<Report>[] = [
    {
      accessorKey: "target_title",
      header: "Reported Content",
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate font-medium">
          <Badge variant="outline" className="mr-2">
            {row.original.target_type}
          </Badge>
          {row.original.target_title}
        </div>
      ),
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate">{row.original.reason}</div>
      ),
    },
    {
      accessorKey: "user_name",
      header: "Reported By",
    },
    {
      accessorKey: "created_at",
      header: "Reported On",
      cell: ({ row }) => format(new Date(row.original.created_at), "MMM dd, yyyy"),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        let color = "bg-gray-500";
        if (status === "pending") color = "bg-yellow-500";
        if (status === "reviewed") color = "bg-blue-500";
        if (status === "resolved") color = "bg-green-500";
        
        return (
          <Badge variant="outline" className="capitalize">
            <div className={`w-2 h-2 rounded-full ${color} mr-2`} />
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleEditClick(row.original, 'report')}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleDeleteClick(row.original.id, 'report')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Define columns for the comments table
  const commentColumns: ColumnDef<Comment>[] = [
    {
      accessorKey: "content",
      header: "Content",
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate">
          {row.original.parent_id && (
            <Badge variant="outline" className="mr-2">
              Reply
            </Badge>
          )}
          {row.original.content}
        </div>
      ),
    },
    {
      accessorKey: "user_name",
      header: "Author",
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => format(new Date(row.original.created_at), "MMM dd, yyyy"),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        let color = status === "active" ? "bg-green-500" : "bg-red-500";
        
        return (
          <Badge variant="outline" className="capitalize">
            <div className={`w-2 h-2 rounded-full ${color} mr-2`} />
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "likes_count",
      header: "Reactions",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <div className="flex items-center">
            <ThumbsUp className="h-4 w-4 mr-1 text-green-500" />
            <span className="mr-2">{row.original.likes_count}</span>
            <ThumbsUp className="h-4 w-4 mr-1 text-red-500 rotate-180" />
            <span>{row.original.dislikes_count}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Total: {row.original.likes_count + row.original.dislikes_count}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "replies_count",
      header: "Replies",
      cell: ({ row }) => (
        <div className="flex items-center">
          <MessageCircle className="h-4 w-4 mr-1 text-blue-500" />
          {row.original.replies_count || 0}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleEditClick(row.original, 'comment')}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleDeleteClick(row.original.id, 'comment')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    isLoading ? (
      <Loading />
    ) : (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Thread Tapestry</h1>
        <p className="text-muted-foreground">
          Manage and analyze user-generated threads and discussions
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Threads</CardTitle>
            <Layers className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalThreads.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            <MessageCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComments.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reactions</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReactions.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-red-500">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Thread Activity</CardTitle>
            <CardDescription>Threads created per day over the last week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.threadsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Threads" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thread Status Distribution</CardTitle>
            <CardDescription>Distribution of threads by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.threadsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="status"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.threadsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts for Reactions and Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Reactions by Type</CardTitle>
            <CardDescription>Distribution of likes and dislikes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.reactionsByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="type"
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  >
                    <Cell key="like-cell" fill="#4ade80" />
                    <Cell key="dislike-cell" fill="#f87171" />
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} reactions`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reports by Status</CardTitle>
            <CardDescription>Distribution of reports by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.reportsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="status"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.reportsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Thread and Report Management Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Content Management</CardTitle>
          <CardDescription>Manage threads and reports</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="threads">Threads</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>
            
            <TabsContent value="threads">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search threads..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-sm"
                    />
                    <Button variant="outline" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="border rounded p-2 text-sm"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                    <Button variant="outline" size="icon" onClick={fetchThreadData}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <DataTable columns={columns} data={filteredThreads} />
              </div>
            </TabsContent>
            
            <TabsContent value="reports">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search reports..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-sm"
                    />
                    <Button variant="outline" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="border rounded p-2 text-sm"
                      value={reportStatusFilter}
                      onChange={(e) => setReportStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    <Button variant="outline" size="icon" onClick={fetchThreadData}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <DataTable columns={reportColumns} data={filteredReports} />
              </div>
            </TabsContent>
            
            <TabsContent value="comments">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search comments..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-sm"
                    />
                    <Button variant="outline" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="border rounded p-2 text-sm"
                      value={commentStatusFilter}
                      onChange={(e) => setCommentStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="deleted">Deleted</option>
                    </select>
                    <Button variant="outline" size="icon" onClick={fetchThreadData}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <DataTable columns={commentColumns} data={filteredComments} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Top Threads and Most Active Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Threads</CardTitle>
            <CardDescription>Threads with highest engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topThreads.map((thread, index) => (
                <div key={thread.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                  <div className="flex-none bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{thread.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        {thread.comment_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3 mr-1 text-green-500" />
                        {thread.like_count}
                        <ThumbsUp className="h-3 w-3 ml-1 mr-1 text-red-500 rotate-180" />
                        {thread.dislike_count}
                      </span>
                      {(thread.report_count ?? 0) > 0 && (
                        <span className="flex items-center text-red-500">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 mr-1">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                          </svg>
                          {thread.report_count}
                        </span>
                      )}
                      <span>{format(new Date(thread.created_at), "MMM dd, yyyy")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most Active Users</CardTitle>
            <CardDescription>Users with most thread contributions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.mostActiveUsers.map((user, index) => (
                <div key={user.user_id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                  <div className="flex-none bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium">{user.user_name}</h4>
                    <div className="text-sm text-muted-foreground mt-1">
                      {user.thread_count} threads
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              {itemToDelete?.type === 'thread' 
                ? "Are you sure you want to delete this thread? This will also remove all associated comments, reactions, and reports. This action cannot be undone."
                : itemToDelete?.type === 'report'
                  ? "Are you sure you want to delete this report? This action cannot be undone."
                  : "Are you sure you want to delete this comment? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Thread Dialog */}
      <Dialog open={editDialogOpen && editingThread !== null} onOpenChange={(open) => {
        if (!open) {
          setEditingThread(null);
        }
        setEditDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Thread</DialogTitle>
            <DialogDescription>
              Make changes to the thread. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          {editingThread && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingThread.title}
                  onChange={(e) => setEditingThread({...editingThread, title: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  rows={5}
                  value={editingThread.content}
                  onChange={(e) => setEditingThread({...editingThread, content: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editingThread.status}
                  onValueChange={(value) => setEditingThread({
                    ...editingThread, 
                    status: value as "published" | "draft" | "archived"
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false);
              setEditingThread(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Report Dialog */}
      <Dialog open={editDialogOpen && editingReport !== null} onOpenChange={(open) => {
        if (!open) {
          setEditingReport(null);
        }
        setEditDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Report Status</DialogTitle>
            <DialogDescription>
              Change the status of this report.
            </DialogDescription>
          </DialogHeader>
          {editingReport && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Reported Content</Label>
                <div className="p-2 border rounded-md bg-muted/50">
                  <Badge variant="outline" className="mr-2">
                    {editingReport.target_type}
                  </Badge>
                  {editingReport.target_title}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Reason</Label>
                <div className="p-2 border rounded-md bg-muted/50">
                  {editingReport.reason}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editingReport.status}
                  onValueChange={(value) => setEditingReport({
                    ...editingReport, 
                    status: value as "pending" | "reviewed" | "resolved"
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false);
              setEditingReport(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Comment Dialog */}
      <Dialog open={editDialogOpen && editingComment !== null} onOpenChange={(open) => {
        if (!open) {
          setEditingComment(null);
        }
        setEditDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Comment</DialogTitle>
            <DialogDescription>
              Make changes to the comment content.
            </DialogDescription>
          </DialogHeader>
          {editingComment && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Author</Label>
                <div className="p-2 border rounded-md bg-muted/50">
                  {editingComment.user_name || "Unknown User"}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  rows={5}
                  value={editingComment.content}
                  onChange={(e) => setEditingComment({...editingComment, content: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editingComment.status}
                  onValueChange={(value) => setEditingComment({
                    ...editingComment, 
                    status: value as "active" | "deleted"
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="deleted">Deleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Likes</Label>
                  <div className="flex items-center">
                    <ThumbsUp className="h-4 w-4 mr-2 text-green-500" />
                    <Input
                      type="number"
                      min="0"
                      value={editingComment.likes_count}
                      onChange={(e) => setEditingComment({
                        ...editingComment, 
                        likes_count: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Dislikes</Label>
                  <div className="flex items-center">
                    <ThumbsUp className="h-4 w-4 mr-2 text-red-500 rotate-180" />
                    <Input
                      type="number"
                      min="0"
                      value={editingComment.dislikes_count}
                      onChange={(e) => setEditingComment({
                        ...editingComment, 
                        dislikes_count: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false);
              setEditingComment(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    )
  );
} 