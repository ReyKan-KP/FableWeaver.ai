"use client"
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ChevronLeft, Edit, Plus, ArrowUpRight, Trash } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Character {
  id: string;
  novel_id: string;
  name: string;
  role: string;
  description: string;
  personality: string;
  appearance: string;
  background: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface CharacterProgression {
  id: string;
  novel_id: string;
  chapter_id: string;
  character_id: string;
  development: string;
  relationships_changes: string | null;
  plot_impact: string | null;
  created_at: string;
  character_name: string | null;
  updated_at: string;
  development_history: Record<string, string> | null;
  chapter: {
    id: string;
    title: string;
    chapter_number: number;
  };
}

interface Novel {
  id: string;
  title: string;
  status: string;
  cover_image: string | null;
}

async function getCharacterDetails(characterId: string) {
  const supabase = createBrowserSupabaseClient();
  
  // Get character information
  const { data: character, error: characterError } = await supabase
    .from("novels_characters")
    .select("*")
    .eq("id", characterId)
    .single();
    
  if (characterError) {
    console.error("Error fetching character:", characterError);
    return null;
  }
  
  // Get novel information
  const { data: novel, error: novelError } = await supabase
    .from("novels")
    .select("id, title, status, cover_image")
    .eq("id", character.novel_id)
    .single();
    
  if (novelError) {
    console.error("Error fetching novel:", novelError);
    return { character, novel: null, progression: [] };
  }
  
  // Get character progression
  const { data: progression, error: progressionError } = await supabase
    .from("character_progression")
    .select(`
      id,
      novel_id,
      chapter_id,
      character_id,
      development,
      relationships_changes,
      plot_impact,
      created_at,
      character_name,
      updated_at,
      development_history,
      chapter:chapter_id (
        id,
        title,
        chapter_number
      )
    `)
    .eq("character_id", characterId)
    .order("chapter(chapter_number)", { ascending: true });
    
  if (progressionError) {
    console.error("Error fetching character progression:", progressionError);
    return { character, novel, progression: [] };
  }
  
  return { character, novel, progression: progression || [] };
}

export default async function CharacterDetailPage({ 
  params 
}: { 
  params: { novelId: string; characterId: string } 
}) {
  const data = await getCharacterDetails(params.characterId);
  
  if (!data) {
    notFound();
  }
  
  const { character, novel, progression } = data;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/admin/novels/${params.novelId}/characters`} className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Characters
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Character Info */}
        <div className="lg:col-span-1 space-y-6">
          <CharacterCard character={character} />
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button asChild variant="outline" className="justify-start">
                <Link href={`/admin/novels/${params.novelId}/characters/${params.characterId}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Character
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href={`/admin/novels/${params.novelId}/characters/${params.characterId}/progression/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Progression Entry
                </Link>
              </Button>
              <Button asChild variant="destructive" className="justify-start">
                <Link href={`/api/admin/novels/${params.novelId}/characters/${params.characterId}/delete`}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Character
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Novel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center">
                <div className="h-16 w-12 relative overflow-hidden rounded">
                  {novel?.cover_image ? (
                    <Image
                      src={novel.cover_image}
                      alt={novel.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">No Cover</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{novel?.title}</h3>
                  <Badge variant={novel?.status === "approved" ? "default" : "outline"}>
                    {novel?.status}
                  </Badge>
                  <div className="mt-2">
                    <Button asChild variant="link" size="sm" className="p-0 h-auto">
                      <Link href={`/admin/novels/${params.novelId}`}>
                        View Novel <ArrowUpRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Character Details & Progression */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Character Details</TabsTrigger>
              <TabsTrigger value="progression">
                Progression ({progression.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6 mt-6">
              <CharacterDetails character={character} />
            </TabsContent>
            
            <TabsContent value="progression" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Character Progression</h2>
                <Button asChild>
                  <Link href={`/admin/novels/${params.novelId}/characters/${params.characterId}/progression/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Entry
                  </Link>
                </Button>
              </div>
              
              {progression.length > 0 ? (
                <ProgressionTimeline 
                  progression={progression as CharacterProgression[]} 
                  novelId={params.novelId} 
                />
              ) : (
                <Card className="p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <svg
                      className="h-12 w-12 text-muted-foreground/20 mb-4"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    <h3 className="text-lg font-medium">No progression entries yet</h3>
                    <p className="text-muted-foreground mt-2 mb-4">
                      Track how this character evolves throughout the novel's chapters
                    </p>
                    <Button asChild>
                      <Link href={`/admin/novels/${params.novelId}/characters/${params.characterId}/progression/new`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Entry
                      </Link>
                    </Button>
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function CharacterCard({ character }: { character: Character }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {character.image_url ? (
          <Image
            src={character.image_url}
            alt={character.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary">
            <span className="text-6xl font-semibold text-secondary-foreground/50">
              {character.name.substring(0, 2).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl">{character.name}</CardTitle>
        <CardDescription>
          <RoleBadge role={character.role} />
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <p className="text-muted-foreground">{character.description}</p>
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground border-t pt-4">
        Last updated: {format(new Date(character.updated_at), "MMM d, yyyy")}
      </CardFooter>
    </Card>
  );
}

function CharacterDetails({ character }: { character: Character }) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Personality</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line">{character.personality || "No personality information provided."}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line">{character.appearance || "No appearance information provided."}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Background</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line">{character.background || "No background information provided."}</p>
        </CardContent>
      </Card>
    </>
  );
}

function ProgressionTimeline({ progression, novelId }: { 
  progression: CharacterProgression[],
  novelId: string 
}) {
  return (
    <div className="relative ml-3 pl-6 border-l">
      {progression.map((entry, index) => (
        <div key={entry.id} className={cn("pb-10", index === progression.length - 1 && "pb-0")}>
          <div className="absolute w-3 h-3 bg-primary rounded-full -left-[6.5px] mt-1.5" />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Chapter {entry.chapter.chapter_number}
              </Badge>
              <h3 className="font-medium text-lg">{entry.chapter.title}</h3>
            </div>
            
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Character Development</h4>
                    <p className="whitespace-pre-line">{entry.development}</p>
                  </div>

                  {entry.relationships_changes && (
                    <div>
                      <h4 className="font-medium mb-2">Relationship Changes</h4>
                      <p className="whitespace-pre-line">{entry.relationships_changes}</p>
                    </div>
                  )}

                  {entry.plot_impact && (
                    <div>
                      <h4 className="font-medium mb-2">Plot Impact</h4>
                      <p className="whitespace-pre-line">{entry.plot_impact}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t text-sm text-muted-foreground">
                  <span>Added: {format(new Date(entry.created_at), "MMM d, yyyy")}</span>
                  
                  <div className="flex gap-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/novels/${novelId}/characters/${entry.character_id}/progression/${entry.id}/edit`}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/novels/${novelId}/chapters/${entry.chapter_id}`}>
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        View Chapter
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  let variant:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | null
    | undefined = "secondary";
  
  switch (role) {
    case "Main":
      variant = "default";
      break;
    case "Antagonist":
      variant = "destructive";
      break;
    case "Supporting":
      variant = "secondary";
      break;
    default:
      variant = "outline";
  }
  
  return (
    <Badge variant={variant} className={cn("rounded-md", role === "Antagonist" && "bg-red-600")}>
      {role}
    </Badge>
  );
} 