"use client"
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";   
import Image from "next/image";
import { format } from "date-fns";
import { ChevronLeft, MessageSquare, Flag, Check, Trash, Pin, ThumbsUp, ThumbsDown, Reply } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";

interface Comment {
  id: string;
  user_id: string;
  novel_id: string;
  content: string;
  parent_comment_id: string | null;
  likes_count: number;
  dislikes_count: number;
  is_edited: boolean;
  is_deleted: boolean;
  is_approved: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  reported_count: number;
  report_reason: string | null;
  user: {
    user_name: string;
    avatar_url: string;
  };
  replies?: Comment[];
}

interface User {
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  avatar_url: string | null;
  is_active: boolean | null;
  last_seen: string | null;
  created_at: string;
}

async function getUserById(userId: string) {
  const supabase = createBrowserSupabaseClient();
  
  const { data: user, error } = await supabase
    .from("user")
    .select("*")
    .eq("user_id", userId)
    .single();
    
  if (error) {
    console.error("Error fetching user:", error);
    return null;
  }
  
  return user;
}

async function getNovelComments(novelId: string) {
  const supabase = createBrowserSupabaseClient();
  
  // Get novel data to display name
  const { data: novel, error: novelError } = await supabase
    .from("novels")
    .select("title")
    .eq("id", novelId)
    .single();
    
  if (novelError) {
    console.error("Error fetching novel:", novelError);
    return null;
  }
  
  // Get top-level comments (no parent_comment_id)
  const { data: comments, error: commentsError } = await supabase
    .from("novel_comments")
    .select("*")
    .eq("novel_id", novelId)
    .is("parent_comment_id", null)
    .order("created_at", { ascending: false });
    
  if (commentsError) {
    console.error("Error fetching comments:", commentsError);
    return { novel, comments: [] };
  }

  // Fetch user data for each comment
  const commentsWithUser = await Promise.all(
    comments.map(async (comment) => {
      const user = await getUserById(comment.user_id);
      return {
        ...comment,
        user: user ? {
          user_name: user.user_name || "Anonymous User",
          avatar_url: user.avatar_url
        } : {
          user_name: "Anonymous User",
          avatar_url: null
        }
      };
    })
  );
  
  // Get replies for all comments
  const topLevelCommentIds = comments.map(comment => comment.id);
  
  if (topLevelCommentIds.length > 0) {
    const { data: replies, error: repliesError } = await supabase
      .from("novel_comments")
      .select("*")
      .eq("novel_id", novelId)
      .in("parent_comment_id", topLevelCommentIds)
      .order("created_at", { ascending: true });
      
    if (repliesError) {
      console.error("Error fetching replies:", repliesError);
    } else if (replies) {
      // Fetch user data for each reply
      const repliesWithUser = await Promise.all(
        replies.map(async (reply) => {
          const user = await getUserById(reply.user_id);
          return {
            ...reply,
            user: user ? {
              user_name: user.user_name || "Anonymous User",
              avatar_url: user.avatar_url
            } : {
              user_name: "Anonymous User",
              avatar_url: null
            }
          };
        })
      );
      
      // Organize replies by parent comment
      const commentWithReplies = commentsWithUser.map(comment => {
        const commentReplies = repliesWithUser.filter(reply => reply.parent_comment_id === comment.id);
        return {
          ...comment,
          replies: commentReplies
        };
      });
      
      return { novel, comments: commentWithReplies };
    }
  }
  
  return { novel, comments: commentsWithUser.map(comment => ({ ...comment, replies: [] })) };
}

async function updateCommentStatus(commentId: string, updates: any) {
  const supabase = createBrowserSupabaseClient();
  
  const { error } = await supabase
    .from("novel_comments")
    .update(updates)
    .eq("id", commentId);
    
  if (error) {
    console.error("Error updating comment:", error);
    return false;
  }
  
  return true;
}

export default async function NovelCommentsPage({
  params,
  searchParams,
}: {
  params: { novelId: string };
  searchParams: { [key: string]: string | undefined };
}) {
  // Process any actions
  if (searchParams.action && searchParams.commentId) {
    const commentId = searchParams.commentId;
    
    switch (searchParams.action) {
      case "approve":
        await updateCommentStatus(commentId, { is_approved: true });
        break;
      case "disapprove":
        await updateCommentStatus(commentId, { is_approved: false });
        break;
      case "pin":
        await updateCommentStatus(commentId, { is_pinned: true });
        break;
      case "unpin":
        await updateCommentStatus(commentId, { is_pinned: false });
        break;
      case "delete":
        await updateCommentStatus(commentId, { is_deleted: true });
        break;
      case "restore":
        await updateCommentStatus(commentId, { is_deleted: false });
        break;
    }
  }
  
  const data = await getNovelComments(params.novelId);
  
  if (!data) {
    notFound();
  }
  
  const { novel, comments } = data;
  
  // Organize comments by status
  const pendingComments = comments.filter(comment => !comment.is_approved && !comment.is_deleted);
  const approvedComments = comments.filter(comment => comment.is_approved && !comment.is_deleted);
  const reportedComments = comments.filter(comment => comment.reported_count > 0);
  const deletedComments = comments.filter(comment => comment.is_deleted);
  const pinnedComments = comments.filter(comment => comment.is_pinned);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/admin/novels/${params.novelId}`} className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Novel
        </Link>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Comments</h1>
          <p className="text-muted-foreground">
            Managing comments for <span className="font-medium">{novel.title}</span>
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">
            All Comments ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending Review
            {pendingComments.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingComments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="reported" className="relative">
            Reported
            {reportedComments.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {reportedComments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="pinned">
            Pinned ({pinnedComments.length})
          </TabsTrigger>
          <TabsTrigger value="deleted">
            Deleted ({deletedComments.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <CommentsSection comments={comments} novelId={params.novelId} />
        </TabsContent>
        
        <TabsContent value="pending">
          {pendingComments.length > 0 ? (
            <CommentsSection comments={pendingComments} novelId={params.novelId} />
          ) : (
            <EmptyState message="No comments pending review" />
          )}
        </TabsContent>
        
        <TabsContent value="reported">
          {reportedComments.length > 0 ? (
            <CommentsSection comments={reportedComments} novelId={params.novelId} />
          ) : (
            <EmptyState message="No reported comments" />
          )}
        </TabsContent>
        
        <TabsContent value="pinned">
          {pinnedComments.length > 0 ? (
            <CommentsSection comments={pinnedComments} novelId={params.novelId} />
          ) : (
            <EmptyState message="No pinned comments" />
          )}
        </TabsContent>
        
        <TabsContent value="deleted">
          {deletedComments.length > 0 ? (
            <CommentsSection comments={deletedComments} novelId={params.novelId} />
          ) : (
            <EmptyState message="No deleted comments" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CommentsSection({ comments, novelId }: { comments: Comment[], novelId: string }) {
  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <CommentCard key={comment.id} comment={comment} novelId={novelId} isReply={false} />
      ))}
    </div>
  );
}

function CommentCard({ comment, novelId, isReply = false }: { comment: Comment, novelId: string, isReply?: boolean }) {
  return (
    <Card className={isReply ? "ml-12 mt-4" : ""}>
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
              <Image
                src={comment.user?.avatar_url || "/images/default-avatar.png"}
                alt={comment.user?.user_name || "User"}
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
            <div>
              <div className="font-medium">{comment.user?.user_name || "Anonymous User"}</div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(comment.created_at), "MMM d, yyyy 'at' h:mm a")}
                {comment.is_edited && " (edited)"}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {comment.is_pinned && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Pin className="h-3 w-3" />
                <span>Pinned</span>
              </Badge>
            )}
            
            {comment.reported_count > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Flag className="h-3 w-3" />
                <span>Reported {comment.reported_count}x</span>
              </Badge>
            )}
            
            {!comment.is_approved && !comment.is_deleted && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <span>Pending</span>
              </Badge>
            )}
            
            {comment.is_deleted && (
              <Badge variant="outline" className="text-destructive flex items-center gap-1">
                <Trash className="h-3 w-3" />
                <span>Deleted</span>
              </Badge>
            )}
            
            <CommentActions comment={comment} novelId={novelId} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        <div className={`prose prose-sm max-w-none ${comment.is_deleted ? "text-muted-foreground italic" : ""}`}>
          {comment.is_deleted ? (
            <p>[Comment deleted]</p>
          ) : (
            <p>{comment.content}</p>
          )}
        </div>
        
        {comment.report_reason && (
          <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm font-medium text-red-800 dark:text-red-400">Report reason:</p>
            <p className="text-sm text-red-700 dark:text-red-300">{comment.report_reason}</p>
          </div>
        )}
        
        <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4" />
            <span>{comment.likes_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsDown className="h-4 w-4" />
            <span>{comment.dislikes_count}</span>
          </div>
        </div>
      </CardContent>
      
      {!isReply && (
        <CardFooter className="p-0">
          {/* Show replies if they exist */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="w-full space-y-3 py-2">
              {comment.replies.map((reply) => (
                <CommentCard key={reply.id} comment={reply} novelId={novelId} isReply={true} />
              ))}
            </div>
          )}
          
          {/* Add reply form */}
          {!comment.is_deleted && (
            <div className="w-full p-4 border-t">
              <ReplyForm parentCommentId={comment.id} novelId={novelId} />
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

function CommentActions({ comment, novelId }: { comment: Comment, novelId: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM12.5 8.625C13.1213 8.625 13.625 8.12132 13.625 7.5C13.625 6.87868 13.1213 6.375 12.5 6.375C11.8787 6.375 11.375 6.87868 11.375 7.5C11.375 8.12132 11.8787 8.625 12.5 8.625Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {comment.is_deleted ? (
          <DropdownMenuItem asChild>
            <Link href={`/admin/novels/${novelId}/comments?action=restore&commentId=${comment.id}`}>
              Restore Comment
            </Link>
          </DropdownMenuItem>
        ) : (
          <>
            {comment.is_approved ? (
              <DropdownMenuItem asChild>
                <Link href={`/admin/novels/${novelId}/comments?action=disapprove&commentId=${comment.id}`}>
                  Unapprove Comment
                </Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem asChild>
                <Link href={`/admin/novels/${novelId}/comments?action=approve&commentId=${comment.id}`}>
                  Approve Comment
                </Link>
              </DropdownMenuItem>
            )}
            
            {comment.is_pinned ? (
              <DropdownMenuItem asChild>
                <Link href={`/admin/novels/${novelId}/comments?action=unpin&commentId=${comment.id}`}>
                  Unpin Comment
                </Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem asChild>
                <Link href={`/admin/novels/${novelId}/comments?action=pin&commentId=${comment.id}`}>
                  Pin Comment
                </Link>
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem asChild className="text-destructive">
              <Link href={`/admin/novels/${novelId}/comments?action=delete&commentId=${comment.id}`}>
                Delete Comment
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ReplyForm({ parentCommentId, novelId }: { parentCommentId: string, novelId: string }) {
  return (
    <form action={`/api/admin/comments/${parentCommentId}/reply`} method="POST">
      <input type="hidden" name="novelId" value={novelId} />
      
      <div className="space-y-3">
        <Textarea 
          name="content" 
          placeholder="Write a reply as admin..." 
          className="min-h-[100px]"
          required
        />
        
        <div className="flex justify-end">
          <Button type="submit" className="gap-2">
            <Reply className="h-4 w-4" />
            Post Reply
          </Button>
        </div>
      </div>
    </form>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="p-8">
      <div className="flex flex-col items-center justify-center text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <h3 className="text-lg font-medium">{message}</h3>
        <p className="text-muted-foreground mt-2">
          Comments will appear here once they match this filter
        </p>
      </div>
    </Card>
  );
} 