"use client"
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Clock, BookText, Eye, Edit, BarChart3, Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, formatDistance } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function getChapterData(novelId: string, chapterId: string) {
  const supabase = createBrowserSupabaseClient();
  
  // Get chapter details
  const { data: chapter, error } = await supabase
    .from("chapters")
    .select("*, novels(title)")
    .eq("id", chapterId)
    .eq("novel_id", novelId)
    .single();
    
  if (error || !chapter) {
    return null;
  }
  
  // Get chapter revisions
  const { data: revisions } = await supabase
    .from("chapter_revisions")
    .select("*")
    .eq("chapter_id", chapterId)
    .order("created_at", { ascending: false });
    
  return {
    chapter,
    revisions: revisions || []
  };
}

export default async function ChapterDetailPage({
  params,
}: {
  params: { novelId: string; chapterId: string };
}) {
  const data = await getChapterData(params.novelId, params.chapterId);
  
  if (!data) {
    notFound();
  }
  
  const { chapter, revisions } = data;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/admin/novels/${params.novelId}`} className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Novel
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="text-sm text-muted-foreground mb-1">
            Novel: <Link href={`/admin/novels/${params.novelId}`} className="hover:underline">{chapter.novels.title}</Link>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {chapter.title}
            <Badge variant={chapter.is_published ? "default" : "outline"} className="ml-2">
              {chapter.is_published ? "Published" : "Draft"}
            </Badge>
          </h1>
          <div className="text-muted-foreground mt-1">Chapter {chapter.chapter_number}</div>
        </div>
        
        <div className="flex gap-2">
          <form action={`/api/admin/chapters/${chapter.id}/toggle-publish`} method="POST">
            <Button 
              type="submit"
              variant={chapter.is_published ? "destructive" : "default"}
              size="sm"
              className="flex items-center gap-1"
            >
              {chapter.is_published ? (
                <>
                  <X className="h-4 w-4" />
                  Unpublish
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Publish
                </>
              )}
            </Button>
          </form>
          
          <Button size="sm" className="flex items-center gap-1" asChild>
            <Link href={`/admin/novels/${params.novelId}/analytics`}>
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-4 flex items-center">
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-4">
            <BookText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Word Count</p>
            <h3 className="text-2xl font-bold">{chapter.word_count.toLocaleString()}</h3>
          </div>
        </Card>
        
        <Card className="p-4 flex items-center">
          <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mr-4">
            <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Created</p>
            <h3 className="text-lg font-bold">
              {formatDistance(new Date(chapter.created_at), new Date(), {
                addSuffix: true,
              })}
            </h3>
          </div>
        </Card>
        
        <Card className="p-4 flex items-center">
          <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mr-4">
            <Edit className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Updated</p>
            <h3 className="text-lg font-bold">
              {formatDistance(new Date(chapter.updated_at), new Date(), {
                addSuffix: true,
              })}
            </h3>
          </div>
        </Card>
      </div>
      
      <Tabs defaultValue="content" className="space-y-6">
        <TabsList>
          <TabsTrigger value="content">Chapter Content</TabsTrigger>
          <TabsTrigger value="revisions">Revision History ({revisions.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content">
          <Card className="p-6">
            <article className="prose dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: chapter.content }} />
            </article>
          </Card>
        </TabsContent>
        
        <TabsContent value="revisions">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Revision History</h2>
            
            {revisions.length > 0 ? (
              <div className="space-y-8">
                {revisions.map((revision, index) => (
                  <div key={revision.id} className="border-b pb-6 last:border-0">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium">
                          {index === 0 ? "Current Version" : `Revision ${revisions.length - index}`}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(revision.created_at), 'PPP p')}
                          {" - "}
                          {formatDistance(new Date(revision.created_at), new Date(), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      
                      <div className="text-sm">
                        <span className="text-muted-foreground mr-2">Word count:</span> 
                        <span className="font-medium">{revision.word_count.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {index === 0 ? (
                      <div className="bg-green-50 dark:bg-green-900/10 p-2 rounded text-sm text-muted-foreground">
                        Current active version - content displayed above
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg max-h-60 overflow-y-auto">
                        <article className="prose dark:prose-invert max-w-none text-sm">
                          <div dangerouslySetInnerHTML={{ __html: revision.content }} />
                        </article>
                      </div>
                    )}
                    
                    {index !== 0 && (
                      <div className="mt-4">
                        <form action={`/api/admin/chapters/${chapter.id}/restore-revision/${revision.id}`} method="POST">
                          <Button type="submit" variant="outline" size="sm">
                            Restore this version
                          </Button>
                        </form>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No revision history available.</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 