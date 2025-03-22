"use client"
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { format, formatDistance } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  Eye,
  MessagesSquare,
  Users,
  BookOpen,
  ThumbsUp,
  Calendar,
  Check,
  X,
  ChevronLeft,
  BarChart3,
  Edit,
  Bookmark,
  Star,
  Clock,
  ArrowUpRight,
  BookText,
  User,
  Settings,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

async function getNovelData(novelId: string) {
  const supabase = createBrowserSupabaseClient();
  
  try {
    // Get novel details
    const { data: novel, error } = await supabase
      .from("novels")
      .select("*")
      .eq("id", novelId)
      .single();
    
    if (error || !novel) {
      console.error("Error fetching novel:", error);
      return null;
    }
    
    // Get user data separately
    let userData = null;
    if (novel.user_id) {
      const { data: user, error: userError } = await supabase
        .from("user")
        .select("user_name, user_email, avatar_url")
        .eq("user_id", novel.user_id)
        .single();
      
      if (!userError && user) {
        userData = user;
      } else {
        console.error("Error fetching user data:", userError);
      }
    }
    
    // Get view count
    const { count: viewCount } = await supabase
      .from("novel_views")
      .select("id", { count: "exact", head: true })
      .eq("novel_id", novelId);
    
    // Get comments count
    const { count: commentCount } = await supabase
      .from("novel_comments")
      .select("id", { count: "exact", head: true })
      .eq("novel_id", novelId);
    
    // Get collaborators count
    const { count: collaboratorCount } = await supabase
      .from("novel_collaborators")
      .select("id", { count: "exact", head: true })
      .eq("novel_id", novelId);
    
    // Get chapters
    const { data: chapters } = await supabase
      .from("chapters")
      .select("*")
      .eq("novel_id", novelId)
      .order("chapter_number", { ascending: true });
    
    // Get characters
    const { data: characters } = await supabase
      .from("novels_characters")
      .select("*")
      .eq("novel_id", novelId);
    
    return {
      novel: { ...novel, users: userData },
      viewCount: viewCount || 0,
      commentCount: commentCount || 0,
      collaboratorCount: collaboratorCount || 0,
      chapters: chapters || [],
      characters: characters || []
    };
  } catch (error) {
    console.error("Error in getNovelData:", error);
    return null;
  }
}

async function updateNovelStatus(novelId: string, status: string, isPublic: boolean = false) {
    const supabase = createBrowserSupabaseClient();
  
  try {
    const { error } = await supabase
      .from("novels")
      .update({ 
        status,
        is_public: status === "approved" ? isPublic : false
      })
      .eq("id", novelId);
    
    if (error) {
      console.error("Error updating novel status:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateNovelStatus:", error);
    return false;
  }
}

export default async function NovelPage({
  params,
  searchParams,
}: {
  params: { novelId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  try {
    // Handle approval/rejection actions
    const action = searchParams.action;
    const makePublic = searchParams.public === "true";
    
    if (action === "approve") {
      const success = await updateNovelStatus(params.novelId, "approved", makePublic);
      if (success) {
        redirect(`/admin/novels/${params.novelId}?approved=true`);
      }
    } else if (action === "reject") {
      const success = await updateNovelStatus(params.novelId, "rejected");
      if (success) {
        redirect(`/admin/novels/${params.novelId}?rejected=true`);
      }
    }
    
    const novelData = await getNovelData(params.novelId);
    
    if (!novelData || !novelData.novel) {
      console.error("Novel data not found for ID:", params.novelId);
      notFound();
    }
    
    // Destructure the data safely
    const novel = novelData.novel;
    const viewCount = novelData.viewCount;
    const commentCount = novelData.commentCount;
    const collaboratorCount = novelData.collaboratorCount;
    const chapters = novelData.chapters;
    const characters = novelData.characters;
    
    // Get user data from the novel
    const user = novel.users || {};
    
    const isApproved = novel.status === "approved";
    const isRejected = novel.status === "rejected";
    const isPending = novel.status === "pending";
    const isDraft = novel.status === "draft" || !novel.status;
    
    // Prepare data for charts
    const publishedChapters = chapters.filter(chapter => chapter.is_published).length;
    const draftChapters = chapters.length - publishedChapters;
    
    const chapterStatusData = [
      { name: "Published", value: publishedChapters, color: "#10B981" },
      { name: "Draft", value: draftChapters, color: "#6B7280" },
    ];
    
    // Mock data for charts (replace with real data in production)
    const viewsOverTime = Array.from({ length: 7 }, (_, i) => ({
      date: format(new Date(Date.now() - i * 24 * 60 * 60 * 1000), 'MMM dd'),
      views: Math.floor(Math.random() * 100),
    })).reverse();
    
    const engagementData = Array.from({ length: 7 }, (_, i) => ({
      date: format(new Date(Date.now() - i * 24 * 60 * 60 * 1000), 'MMM dd'),
      comments: Math.floor(Math.random() * 20),
      likes: Math.floor(Math.random() * 30),
    })).reverse();

    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link href="/admin/novels" className="text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Novels</span>
            </Link>
            <h1 className="text-3xl font-bold">{novel.title}</h1>
            <p className="text-muted-foreground">
              By {user.user_name || "Unknown Author"}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href={`/admin/novels/${params.novelId}/edit`}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/admin/novels/${params.novelId}/analytics`}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-6">
          <Card className="col-span-4">
            <CardHeader className="pb-2">
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={viewsOverTime}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="#3B82F6"
                      fillOpacity={1}
                      fill="url(#colorViews)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="status">Novel Status</Label>
                    <Badge
                      variant={
                        isApproved ? "default" :
                        isRejected ? "destructive" :
                        isPending ? "secondary" :
                        "outline"
                      }
                    >
                      {novel.status?.charAt(0).toUpperCase() + novel.status?.slice(1) || "Draft"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="public">Public Access</Label>
                    <Switch
                      id="public"
                      checked={novel.is_public}
                      disabled={!isApproved}
                    />
                  </div>
                </div>
                
                {isPending && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="default"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/admin/novels/${params.novelId}?action=approve&public=true`}>
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/admin/novels/${params.novelId}?action=reject`}>
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{viewCount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total Views</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <BookText className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{chapters.length}</p>
                      <p className="text-xs text-muted-foreground">Total Chapters</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <MessagesSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{commentCount}</p>
                      <p className="text-xs text-muted-foreground">Comments</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{collaboratorCount}</p>
                      <p className="text-xs text-muted-foreground">Collaborators</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Chapter Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chapterStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {chapterStatusData.map((entry, index) => (
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
              <CardTitle>Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="comments"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="likes"
                      stroke="#10B981"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Chapters</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/novels/${params.novelId}/chapters`}>
                  View All
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chapters.slice(0, 5).map((chapter) => (
                  <div key={chapter.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <Link
                          href={`/admin/novels/${params.novelId}/chapters/${chapter.id}`}
                          className="font-medium hover:underline"
                        >
                          {chapter.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          Chapter {chapter.chapter_number}
                        </p>
                      </div>
                    </div>
                    <Badge variant={chapter.is_published ? "default" : "outline"}>
                      {chapter.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Characters</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/novels/${params.novelId}/characters`}>
                  View All
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {characters.slice(0, 5).map((character) => (
                  <div key={character.id} className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <Link
                        href={`/admin/novels/${params.novelId}/characters/${character.id}`}
                        className="font-medium hover:underline"
                      >
                        {character.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {character.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in NovelPage:", error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin/novels" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Novels
          </Link>
        </div>
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Error Loading Novel</h2>
          <p>There was an error loading the novel. Please try again later.</p>
        </Card>
      </div>
    );
  }
}
