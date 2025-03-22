"use client"
import { createBrowserSupabaseClient} from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Eye, MessageSquare, Users, BookText, BarChart3, Grid, Table2, Filter, Search, MoreVertical, ChevronDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface UserData {
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  avatar_url: string | null;
}

interface Chapter {
  id: string;
  is_published: boolean;
}

interface Novel {
  is_published: boolean | undefined;
  id: string;
  title: string;
  description: string;
  cover_image: string | null;
  status: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  userData?: UserData;
  chapters: Chapter[];
  viewCount: number;
  commentCount: number;
  collaboratorCount: number;
  publishedChapters: number;
  totalChapters: number;
}

async function getUserData(userId: string): Promise<UserData | undefined> {
  const supabase = createBrowserSupabaseClient();
  
  const { data, error } = await supabase
    .from("user")
    .select("user_id, user_name, user_email, avatar_url")
    .eq("user_id", userId)
    .single();
    
  if (error || !data) {
    console.error("Error fetching user data:", error);
    return undefined;
  }
  
  return data;
}

async function getNovels(): Promise<Novel[]> {
  const supabase = createBrowserSupabaseClient();
  
  const { data: novels, error } = await supabase
    .from("novels")
    .select(`
      *,
      chapters (id, is_published)
    `)
    .order("created_at", { ascending: false });
    
  if (error || !novels) {
    console.error("Error fetching novels:", error);
    return [];
  }
  
  // For each novel, get view count and user data
  const enrichedNovels = await Promise.all(novels.map(async (novel) => {
    // Get user data
    const userData = await getUserData(novel.user_id);
    
    // Get view count
    const { count: viewCount } = await supabase
      .from("novel_views")
      .select("*", { count: "exact", head: true })
      .eq("novel_id", novel.id);
      
    // Get comment count
    const { count: commentCount } = await supabase
      .from("novel_comments")
      .select("*", { count: "exact", head: true })
      .eq("novel_id", novel.id);
      
    // Get collaborator count
    const { count: collaboratorCount } = await supabase
      .from("novel_collaborators")
      .select("*", { count: "exact", head: true })
      .eq("novel_id", novel.id);
      
    // Calculate published chapters
    const publishedChapters = novel.chapters.filter((chapter: { is_published: boolean }) => chapter.is_published).length;
    
    return {
      id: novel.id,
      title: novel.title,
      description: novel.description,
      cover_image: novel.cover_image,
      status: novel.status,
      is_public: novel.is_public,
      is_published: novel.is_published,
      created_at: novel.created_at,
      updated_at: novel.updated_at,
      user_id: novel.user_id,
      userData,
      chapters: novel.chapters,
      viewCount: viewCount || 0,
      commentCount: commentCount || 0,
      collaboratorCount: collaboratorCount || 0,
      publishedChapters,
      totalChapters: novel.chapters.length
    } as Novel;
  }));
  
  return enrichedNovels;
}

async function updateNovelStatus(novelId: string, status: string) {
  const supabase = createBrowserSupabaseClient();
  
  const { error } = await supabase
    .from("novels")
    .update({ status })
    .eq("id", novelId);
    
  if (error) {
    throw new Error(error.message);
  }
}

async function updateNovelPublicStatus(novelId: string, isPublic: boolean) {
  const supabase = createBrowserSupabaseClient();
  
  const { error } = await supabase
    .from("novels")
    .update({ is_public: isPublic })
    .eq("id", novelId);
    
  if (error) {
    throw new Error(error.message);
  }
}

async function updateNovelPublishedStatus(novelId: string, isPublished: boolean) {
  const supabase = createBrowserSupabaseClient();
  
  const { error } = await supabase
    .from("novels")
    .update({ is_published: isPublished })
    .eq("id", novelId);
    
  if (error) {
    throw new Error(error.message);
  }
}

export default function NovelsPage() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const { toast } = useToast();
  
  // Load novels on mount
  useEffect(() => {
    loadNovels();
  }, []);
  
  const loadNovels = async () => {
    const loadedNovels = await getNovels();
    setNovels(loadedNovels);
  };
  
  const handleStatusChange = async (novelId: string, newStatus: string) => {
    try {
      await updateNovelStatus(novelId, newStatus);
      toast({
        title: "Status updated",
        description: "The novel's status has been updated successfully.",
      });
      loadNovels(); // Refresh the novels list
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    }
  };
  
  const handlePublicChange = async (novelId: string, isPublic: boolean) => {
    try {
      await updateNovelPublicStatus(novelId, isPublic);
      toast({
        title: "Public status updated",
        description: `The novel is now ${isPublic ? "public" : "private"}.`,
      });
      loadNovels(); // Refresh the novels list
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update public status",
        variant: "destructive",
      });
    }
  };
  const handlePublishedChange = async (novelId: string, isPublished: boolean) => {
    try {
      await updateNovelPublishedStatus(novelId, isPublished);
      toast({
        title: "Published status updated",
        description: `The novel is now ${isPublished ? "published" : "unpublished"}.`,
      });
      loadNovels(); // Refresh the novels list
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update published status",
        variant: "destructive",
      });
    }
  };
  
  // Group novels by status for tabs
  const pendingNovels = novels.filter(novel => novel.status === "pending");
  const approvedNovels = novels.filter(novel => novel.status === "approved");
  const rejectedNovels = novels.filter(novel => novel.status === "rejected");
  const draftNovels = novels.filter(novel => novel.status === "draft");
  
  // Prepare data for charts
  const statusData = [
    { name: "Pending", value: pendingNovels.length, color: "#FFA500" },
    { name: "Approved", value: approvedNovels.length, color: "#10B981" },
    { name: "Rejected", value: rejectedNovels.length, color: "#EF4444" },
    { name: "Draft", value: draftNovels.length, color: "#6B7280" },
  ];
  
  const viewsData = novels.map(novel => ({
    name: novel.title.substring(0, 20) + (novel.title.length > 20 ? "..." : ""),
    views: novel.viewCount,
  })).sort((a, b) => b.views - a.views).slice(0, 10);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Novels</h1>
          <p className="text-muted-foreground">Manage and monitor all novels on the platform</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Select defaultValue="grid">
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">
                <div className="flex items-center">
                  <Grid className="h-4 w-4 mr-2" />
                  Grid View
                </div>
              </SelectItem>
              <SelectItem value="table">
                <div className="flex items-center">
                  <Table2 className="h-4 w-4 mr-2" />
                  Table View
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Novels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{novels.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingNovels.length} pending review
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {novels.reduce((sum, novel) => sum + novel.viewCount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all novels
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {novels.reduce((sum, novel) => sum + novel.commentCount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all novels
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Published Chapters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {novels.reduce((sum, novel) => sum + novel.publishedChapters, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {novels.reduce((sum, novel) => sum + novel.totalChapters, 0)} total
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Novel Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Most Viewed Novels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={viewsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="views" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All ({novels.length})</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending Review
            {pendingNovels.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingNovels.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedNovels.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedNovels.length})</TabsTrigger>
          <TabsTrigger value="draft">Drafts ({draftNovels.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Chapters</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead>Public</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {novels.map((novel) => (
                    <TableRow key={novel.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {novel.cover_image && (
                            <Image
                              src={novel.cover_image}
                              alt={novel.title}
                              width={40}
                              height={60}
                              className="rounded object-cover"
                            />
                          )}
                          <div>
                            <Link
                              href={`/admin/novels/${novel.id}`}
                              className="font-medium hover:underline"
                            >
                              {novel.title}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              Created {format(new Date(novel.created_at), 'PP')}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {novel.userData?.user_name || "Unknown Author"}
                      </TableCell>
                      <TableCell>
                        <Select 
                          defaultValue={novel.status}
                          onValueChange={(value) => handleStatusChange(novel.id, value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <BookText className="h-4 w-4 text-muted-foreground" />
                          <span>{novel.publishedChapters}/{novel.totalChapters}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span>{novel.viewCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span>{novel.commentCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch 
                          checked={novel.is_public}
                          onCheckedChange={(checked) => handlePublicChange(novel.id, checked)}
                          disabled={novel.status !== "approved"}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch 
                          checked={novel.is_published}
                          onCheckedChange={(checked) => handlePublishedChange(novel.id, checked)}
                          disabled={novel.status !== "approved"}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/novels/${novel.id}`}>
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/novels/${novel.id}/edit`}>
                                Edit Novel
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/novels/${novel.id}/chapters`}>
                                Manage Chapters
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/novels/${novel.id}/comments`}>
                                View Comments
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              Delete Novel
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {novels.map((novel) => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="pending">
          {pendingNovels.length > 0 ? (
            <NovelGrid novels={pendingNovels} />
          ) : (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">No novels pending review.</p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="approved">
          {approvedNovels.length > 0 ? (
            <NovelGrid novels={approvedNovels} />
          ) : (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">No approved novels.</p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="rejected">
          {rejectedNovels.length > 0 ? (
            <NovelGrid novels={rejectedNovels} />
          ) : (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">No rejected novels.</p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="draft">
          {draftNovels.length > 0 ? (
            <NovelGrid novels={draftNovels} />
          ) : (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">No draft novels.</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NovelGrid({ novels }: { novels: Novel[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {novels.map((novel) => (
        <NovelCard key={novel.id} novel={novel} />
      ))}
    </div>
  );
}

function NovelCard({ novel }: { novel: Novel }) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="line-clamp-1">{novel.title}</CardTitle>
            <CardDescription className="line-clamp-1">
              By {novel.userData?.user_name || "Unknown Author"}
            </CardDescription>
          </div>
          <StatusBadge status={novel.status} isPublic={novel.is_public} />
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {novel.description || "No description provided."}
        </p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex items-center gap-1">
            <BookText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{novel.publishedChapters}/{novel.totalChapters} chapters</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{novel.viewCount} views</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{novel.commentCount} comments</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{novel.collaboratorCount} collaborators</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Created: {format(new Date(novel.created_at), 'PP')}
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex gap-2">
        <Button asChild variant="default" size="sm" className="flex-1">
          <Link href={novel.id ? `/admin/novels/${encodeURIComponent(novel.id)}` : '#'}>Manage</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link href={novel.id ? `/admin/novels/${encodeURIComponent(novel.id)}/analytics` : '#'}>
            <BarChart3 className="h-4 w-4 mr-1" />
            Analytics
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function StatusBadge({ status, isPublic }: { status: string, isPublic: boolean }) {
  let badgeVariant: "default" | "destructive" | "outline" | "secondary" = "outline";
  let label = "Draft";
  
  switch (status) {
    case "pending":
      badgeVariant = "secondary";
      label = "Pending Review";
      break;
    case "approved":
      badgeVariant = isPublic ? "default" : "secondary";
      label = isPublic ? "Published" : "Approved";
      break;
    case "rejected":
      badgeVariant = "destructive";
      label = "Rejected";
      break;
    case "draft":
    default:
      badgeVariant = "outline";
      label = "Draft";
      break;
  }
  
  return <Badge variant={badgeVariant}>{label}</Badge>;
} 