"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ChevronLeft,
  Plus,
  Search,
  MessageSquare,
  Eye,
  MoreVertical,
  Edit,
  Trash,
  Pin,
  Flag,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createBrowserSupabaseClient } from "@/lib/supabase";

interface Chapter {
  id: string;
  title: string;
  chapter_number: number;
  word_count: number;
  version: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  likes_count: number;
  dislikes_count: number;
  is_pinned: boolean;
  is_approved: boolean;
  is_edited: boolean;
  reported_count: number;
  report_reason: string | null;
  user: {
    user_name: string;
    avatar_url: string;
  };
  parent_comment_id: string | null;
  replies?: Comment[];
}

interface Novel {
  id: string;
  title: string;
  status: string;
}

export default function ChaptersPage({ 
  params 
}: { 
  params: { novelId: string } 
}) {
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("chapters");
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    loadNovelData();
    loadChapters();
  }, []);

  useEffect(() => {
    if (selectedChapter) {
      loadComments(selectedChapter);
    }
  }, [selectedChapter]);

  const loadNovelData = async () => {
    const { data: novelData, error } = await supabase
      .from('novels')
      .select('id, title, status')
      .eq('id', params.novelId)
      .single();

    if (error) {
      console.error('Error loading novel:', error);
      return;
    }

    setNovel(novelData);
  };

  const loadChapters = async () => {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('novel_id', params.novelId)
      .order('chapter_number', { ascending: true });

    if (error) {
      console.error('Error loading chapters:', error);
      return;
    }

    setChapters(data);
  };

  const loadComments = async (chapterId: string) => {
    const { data, error } = await supabase
      .from('chapter_comments')
      .select(`
        *,
        user:user_id (
          user_name,
          avatar_url
        )
      `)
      .eq('chapter_id', chapterId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading comments:', error);
      return;
    }

    // Load replies for each comment
    const commentsWithReplies = await Promise.all(
      data.map(async (comment) => {
        const { data: replies, error: repliesError } = await supabase
          .from('chapter_comments')
          .select(`
            *,
            user:user_id (
              user_name,
              avatar_url
            )
          `)
          .eq('parent_comment_id', comment.id)
          .order('created_at', { ascending: true });

        if (repliesError) {
          console.error('Error loading replies:', repliesError);
          return comment;
        }

        return {
          ...comment,
          replies: replies || [],
        };
      })
    );

    setComments(commentsWithReplies);
  };

  const handleCommentAction = async (commentId: string, action: 'approve' | 'reject' | 'pin' | 'delete') => {
    try {
      switch (action) {
        case 'approve':
          await supabase
            .from('chapter_comments')
            .update({ is_approved: true })
            .eq('id', commentId);
          break;
        case 'reject':
          await supabase
            .from('chapter_comments')
            .update({ is_approved: false })
            .eq('id', commentId);
          break;
        case 'pin':
          await supabase
            .from('chapter_comments')
            .update({ is_pinned: true })
            .eq('id', commentId);
          break;
        case 'delete':
          await supabase
            .from('chapter_comments')
            .delete()
            .eq('id', commentId);
          break;
      }

      if (selectedChapter) {
        loadComments(selectedChapter);
      }
    } catch (error) {
      console.error('Error handling comment action:', error);
    }
  };

  const filteredChapters = chapters.filter(chapter =>
    chapter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chapter.chapter_number.toString().includes(searchQuery)
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href={`/admin/novels/${params.novelId}`} className="text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Novel</span>
          </Link>
          <h1 className="text-3xl font-bold">Chapters</h1>
          <p className="text-muted-foreground">
            Managing chapters for {novel?.title}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search chapters..."
              className="pl-9 w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button asChild>
            <Link href={`/admin/novels/${params.novelId}/chapters/create`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Chapter
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="chapters">Chapters</TabsTrigger>
          <TabsTrigger value="comments" disabled={!selectedChapter}>
            Comments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chapters" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chapter</TableHead>
                    <TableHead>Words</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChapters.map((chapter) => (
                    <TableRow key={chapter.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">Chapter {chapter.chapter_number}</div>
                          <div className="text-sm text-muted-foreground">{chapter.title}</div>
                        </div>
                      </TableCell>
                      <TableCell>{chapter.word_count}</TableCell>
                      <TableCell>v{chapter.version}</TableCell>
                      <TableCell>
                        <Badge variant={chapter.is_published ? "default" : "secondary"}>
                          {chapter.is_published ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(chapter.created_at), 'PP')}</TableCell>
                      <TableCell>{format(new Date(chapter.updated_at), 'PP')}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedChapter(chapter.id)}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              View Comments
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/novels/${params.novelId}/chapters/${chapter.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Chapter
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/novels/${params.novelId}/chapters/${chapter.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Chapter
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash className="h-4 w-4 mr-2" />
                              Delete Chapter
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          {selectedChapter && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Comments</CardTitle>
                  <CardDescription>
                    Managing comments for Chapter {
                      chapters.find(c => c.id === selectedChapter)?.chapter_number
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="space-y-4">
                      <div className="flex items-start gap-4 p-4 rounded-lg border">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{comment.user.user_name}</span>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(comment.created_at), 'PP')}
                            </span>
                            {comment.is_edited && (
                              <span className="text-sm text-muted-foreground">(edited)</span>
                            )}
                            {comment.is_pinned && (
                              <Badge variant="outline">Pinned</Badge>
                            )}
                            {!comment.is_approved && (
                              <Badge variant="destructive">Rejected</Badge>
                            )}
                          </div>
                          <p className="text-sm">{comment.content}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>{comment.likes_count} likes</span>
                            <span>{comment.dislikes_count} dislikes</span>
                            {comment.reported_count > 0 && (
                              <span className="text-destructive">
                                {comment.reported_count} reports
                              </span>
                            )}
                          </div>
                          {comment.report_reason && (
                            <div className="mt-2 text-sm text-destructive">
                              Report reason: {comment.report_reason}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCommentAction(comment.id, 'approve')}
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCommentAction(comment.id, 'reject')}
                          >
                            <XCircle className="h-4 w-4 text-red-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCommentAction(comment.id, 'pin')}
                          >
                            <Pin className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCommentAction(comment.id, 'delete')}
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-8 space-y-4">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start gap-4 p-4 rounded-lg border">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{reply.user.user_name}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {format(new Date(reply.created_at), 'PP')}
                                  </span>
                                  {reply.is_edited && (
                                    <span className="text-sm text-muted-foreground">(edited)</span>
                                  )}
                                </div>
                                <p className="text-sm">{reply.content}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  <span>{reply.likes_count} likes</span>
                                  <span>{reply.dislikes_count} dislikes</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCommentAction(reply.id, 'delete')}
                                >
                                  <Trash className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
