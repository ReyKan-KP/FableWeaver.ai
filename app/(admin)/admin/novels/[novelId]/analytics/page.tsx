"use client"
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, BarChart3, Eye, MessagesSquare, ThumbsUp, Users, BookOpen, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { format, formatDistance, subDays } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function getNovelAnalytics(novelId: string) {
  const supabase = createBrowserSupabaseClient();
  
  // Get novel details
  const { data: novel, error } = await supabase
    .from("novels")
    .select("*")
    .eq("id", novelId)
    .single();
    
  if (error || !novel) {
    return null;
  }
  
  // Get view statistics with daily counts
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: viewsData } = await supabase
    .from("novel_views")
    .select("viewed_at")
    .eq("novel_id", novelId)
    .gte("viewed_at", thirtyDaysAgo.toISOString());
    
  // Get chapter data
  const { data: chapters } = await supabase
    .from("chapters")
    .select("*")
    .eq("novel_id", novelId)
    .order("chapter_number", { ascending: true });
    
  // Get comments data
  const { data: comments } = await supabase
    .from("novel_comments")
    .select("*, user(user_name, avatar_url)")
    .eq("novel_id", novelId)
    .order("created_at", { ascending: false })
    .limit(20);
    
  // Get collaborators
  const { data: collaborators } = await supabase
    .from("novel_collaborators")
    .select("*, user(user_name, user_email, avatar_url)")
    .eq("novel_id", novelId);
    
  // Get character count
  const { data: characters } = await supabase
    .from("novels_characters")
    .select("*")
    .eq("novel_id", novelId);
    
  // Process views data for daily chart
  const viewsByDay = new Map();
  const last30Days = [];
  
  for (let i = 0; i < 30; i++) {
    const date = subDays(new Date(), i);
    const formattedDate = format(date, 'yyyy-MM-dd');
    last30Days.unshift(formattedDate);
    viewsByDay.set(formattedDate, 0);
  }
  
  if (viewsData) {
    viewsData.forEach(view => {
      const date = format(new Date(view.viewed_at), 'yyyy-MM-dd');
      if (viewsByDay.has(date)) {
        viewsByDay.set(date, viewsByDay.get(date) + 1);
      }
    });
  }
  
  // Calculate chapter metrics
  const chapterMetrics = chapters ? chapters.map(chapter => ({
    ...chapter,
    wordCountPercent: novel.total_words ? Math.round((chapter.word_count / novel.total_words) * 100) : 0
  })) : [];
  
  return {
    novel,
    viewsData: {
      total: viewsData?.length || 0,
      dailyData: Array.from(viewsByDay).map(([date, count]) => ({ date, count })),
      last30Days
    },
    chapters: chapters || [],
    chapterMetrics,
    comments: comments || [],
    collaborators: collaborators || [],
    characters: characters || []
  };
}

export default async function NovelAnalyticsPage({
  params,
}: {
  params: { novelId: string };
}) {
  const analytics = await getNovelAnalytics(params.novelId);
  
  if (!analytics) {
    notFound();
  }
  
  const { novel, viewsData, chapters, chapterMetrics, comments, collaborators, characters } = analytics;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/admin/novels/${params.novelId}`} className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Novel
        </Link>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Analytics: {novel.title}</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 flex items-center">
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-4">
            <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Views</p>
            <h3 className="text-2xl font-bold">{viewsData.total}</h3>
          </div>
        </Card>
        
        <Card className="p-4 flex items-center">
          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mr-4">
            <BookOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Chapters</p>
            <h3 className="text-2xl font-bold">{chapters.length}</h3>
          </div>
        </Card>
        
        <Card className="p-4 flex items-center">
          <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mr-4">
            <MessagesSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Comments</p>
            <h3 className="text-2xl font-bold">{comments.length}</h3>
          </div>
        </Card>
        
        <Card className="p-4 flex items-center">
          <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mr-4">
            <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Collaborators</p>
            <h3 className="text-2xl font-bold">{collaborators.length}</h3>
          </div>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chapters">Chapters Analysis</TabsTrigger>
          <TabsTrigger value="engagement">User Engagement</TabsTrigger>
          <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Views Over Time (Last 30 Days)</h2>
            <div className="w-full h-64 bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-4">
              <div className="h-full flex items-end justify-between">
                {viewsData.dailyData.map((day) => {
                  const heightPercent = Math.max(5, Math.min(100, (day.count / Math.max(1, Math.max(...viewsData.dailyData.map(d => d.count)))) * 100));
                  return (
                    <div key={day.date} className="flex flex-col items-center group" style={{ width: `${100 / viewsData.dailyData.length}%` }}>
                      <div className="relative w-full">
                        <div 
                          className="w-4/5 mx-auto bg-blue-500 rounded-t opacity-80 group-hover:opacity-100 transition-all"
                          style={{ height: `${heightPercent}%` }}
                        ></div>
                        <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 text-xs text-center font-medium bg-black/80 text-white rounded py-1 transition-opacity">
                          {day.count} views<br/>
                          {day.date}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Novel Statistics</h2>
              <div className="space-y-4">
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-muted-foreground">Total Words</span>
                  <span className="font-medium">{novel.total_words ? novel.total_words.toLocaleString() : "0"}</span>
                </div>
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-muted-foreground">Average Words per Chapter</span>
                  <span className="font-medium">
                    {chapters.length > 0 && novel.total_words
                      ? Math.round(novel.total_words / chapters.length).toLocaleString() 
                      : 0} words
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">
                    {novel.created_at 
                      ? format(new Date(novel.created_at), 'PPP')
                      : "Unknown date"}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-muted-foreground">Last Chapter Added</span>
                  <span className="font-medium">
                    {novel.last_chapter_at 
                      ? formatDistance(new Date(novel.last_chapter_at), new Date(), {
                          addSuffix: true,
                        })
                      : "No chapters yet"}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-muted-foreground">Characters</span>
                  <span className="font-medium">{characters.length}</span>
                </div>
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-muted-foreground">Publication Status</span>
                  <span className={`font-medium ${
                    novel.status === "approved" 
                      ? "text-green-600 dark:text-green-400" 
                      : novel.status === "rejected"
                      ? "text-red-600 dark:text-red-400"
                      : novel.status === "pending"
                      ? "text-yellow-600 dark:text-yellow-400"
                      : ""
                  }`}>
                    {novel.status ? novel.status.charAt(0).toUpperCase() + novel.status.slice(1) : "Unknown"}
                    {novel.is_public && novel.status === "approved" && " (Public)"}
                  </span>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Comments</h2>
              {comments.length > 0 ? (
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                  {comments.slice(0, 5).map((comment) => (
                    <div key={comment.id} className="flex items-start gap-3 pb-3 border-b">
                      <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                        {comment.users?.image && (
                          <img 
                            src={comment.users.image} 
                            alt={comment.users.name || "User"} 
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{comment.users?.name || "Anonymous"}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistance(new Date(comment.created_at), new Date(), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  
                  {comments.length > 5 && (
                    <Link 
                      href={`/admin/novels/${params.novelId}/comments`}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline block text-center mt-2"
                    >
                      View all {comments.length} comments
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No comments yet.</p>
              )}
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="chapters" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Chapter Analysis</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2 pr-4 font-medium">Chapter</th>
                    <th className="text-left pb-2 px-4 font-medium">Words</th>
                    <th className="text-left pb-2 px-4 font-medium">% of Novel</th>
                    <th className="text-left pb-2 px-4 font-medium">Published</th>
                    <th className="text-left pb-2 px-4 font-medium">Created</th>
                    <th className="text-left pb-2 pl-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {chapterMetrics.map((chapter) => (
                    <tr key={chapter.id} className="border-b hover:bg-gray-50 dark:hover:bg-zinc-800">
                      <td className="py-3 pr-4">
                        <div className="font-medium">{chapter.title}</div>
                        <div className="text-xs text-muted-foreground">Chapter {chapter.chapter_number}</div>
                      </td>
                      <td className="py-3 px-4">{chapter.word_count.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-16 h-2 bg-gray-200 dark:bg-zinc-700 rounded-full mr-2">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${chapter.wordCountPercent}%` }}
                            ></div>
                          </div>
                          <span>{chapter.wordCountPercent}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          chapter.is_published
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                        }`}>
                          {chapter.is_published ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {format(new Date(chapter.created_at), 'PPP')}
                      </td>
                      <td className="py-3 pl-4">
                        <Link 
                          href={`/admin/novels/${params.novelId}/chapters/${chapter.id}`}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="engagement" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Reader Engagement</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Views Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between pb-2 border-b">
                    <span className="text-muted-foreground">Total Views</span>
                    <span className="font-medium">{viewsData.total}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b">
                    <span className="text-muted-foreground">Last 30 Days</span>
                    <span className="font-medium">{viewsData.total}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b">
                    <span className="text-muted-foreground">Average Views/Day</span>
                    <span className="font-medium">{Math.round(viewsData.total / 30)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3">Comments Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between pb-2 border-b">
                    <span className="text-muted-foreground">Total Comments</span>
                    <span className="font-medium">{comments.length}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b">
                    <span className="text-muted-foreground">Comments/Chapter</span>
                    <span className="font-medium">
                      {chapters.length > 0 
                        ? Math.round((comments.length / chapters.length) * 10) / 10 
                        : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="collaborators" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Collaborators</h2>
            
            {collaborators.length > 0 ? (
              <div className="space-y-4">
                {collaborators.map((collaborator) => (
                  <div key={collaborator.id} className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-4">
                        {collaborator.users?.image && (
                          <img 
                            src={collaborator.users.image} 
                            alt={collaborator.users.name || "User"} 
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{collaborator.users?.name || "Anonymous"}</div>
                        <div className="text-sm text-muted-foreground">{collaborator.users?.email}</div>
                      </div>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        collaborator.role === "editor"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                      }`}>
                        {collaborator.role.charAt(0).toUpperCase() + collaborator.role.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No collaborators yet.</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 