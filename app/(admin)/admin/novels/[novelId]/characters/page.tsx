"use client"
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Plus, Search, Edit, Trash } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
  personality: string;
  appearance: string;
  background: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  progression: CharacterProgression[];
}

interface CharacterProgression {
  id: string;
  character_id: string;
  chapter_id: string;
  chapter_number: number;
  chapter_title: string;
  progression_note: string;
  created_at: string;
  updated_at: string;
}

interface Novel {
  id: string;
  title: string;
  status: string;
  cover_image: string | null;
}

async function getNovelCharacters(novelId: string) {
    const supabase = createBrowserSupabaseClient();
  
  // Get novel information
  const { data: novel, error: novelError } = await supabase
    .from("novels")
    .select("id, title, status, cover_image")
    .eq("id", novelId)
    .single();
    
  if (novelError) {
    console.error("Error fetching novel:", novelError);
    return null;
  }
  
  // Get characters for the novel
  const { data: characters, error: charactersError } = await supabase
    .from("novels_characters")
    .select("*")
    .eq("novel_id", novelId)
    .order("name", { ascending: true });
    
  if (charactersError) {
    console.error("Error fetching characters:", charactersError);
    return { novel, characters: [] };
  }
  
  // Get character progression for each character
  const characterIds = characters.map(character => character.id);
  let progressionData: Record<string, CharacterProgression[]> = {};
  
  if (characterIds.length > 0) {
    const { data: progressions, error: progressionError } = await supabase
      .from("character_progression")
      .select(`
        *,
        chapter:chapter_id (title, chapter_number)
      `)
      .in("character_id", characterIds)
      .order("created_at", { ascending: true });
      
    if (progressionError) {
      console.error("Error fetching character progressions:", progressionError);
    } else if (progressions) {
      // Organize progressions by character
      characterIds.forEach(id => {
        const characterProgressions = progressions
          .filter(p => p.character_id === id)
          .map(p => ({
            ...p,
            chapter_title: p.chapter.title,
            chapter_number: p.chapter.chapter_number
          }));
        
        progressionData[id] = characterProgressions;
      });
    }
  }
  
  // Combine characters with their progression data
  const charactersWithProgressions = characters.map(character => ({
    ...character,
    progression: progressionData[character.id] || []
  }));
  
  return { novel, characters: charactersWithProgressions };
}

export default async function NovelCharactersPage({ 
  params 
}: { 
  params: { novelId: string } 
}) {
  const data = await getNovelCharacters(params.novelId);
  
  if (!data) {
    notFound();
  }
  
  const { novel, characters } = data;
  
  // Group characters by role
  const mainCharacters = characters.filter(c => c.role === "main_character");
  const supportingCharacters = characters.filter(c => c.role === "side_character");
  const minorCharacters = characters.filter(c => c.role === "extra");
  const antagonistCharacters = characters.filter(c => c.role === "antagonist");
  const otherCharacters = characters.filter(c => !["main_character", "side_character", "extra", "antagonist"].includes(c.role));
  
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
          <h1 className="text-3xl font-bold">Characters</h1>
          <p className="text-muted-foreground">
            Managing characters for <span className="font-medium">{novel.title}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search characters..."
              className="pl-9 w-[250px]"
            />
          </div>
          
          <Button asChild>
            <Link href={`/admin/novels/${params.novelId}/characters/create`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Character
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">
            All Characters ({characters.length})
          </TabsTrigger>
          <TabsTrigger value="main">
            Main ({mainCharacters.length})
          </TabsTrigger>
          <TabsTrigger value="supporting">
            Supporting ({supportingCharacters.length})
          </TabsTrigger>
          <TabsTrigger value="antagonist">
            Antagonists ({antagonistCharacters.length})
          </TabsTrigger>
          <TabsTrigger value="minor">
            Minor ({minorCharacters.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <CharacterGrid characters={characters} novelId={params.novelId} />
        </TabsContent>
        
        <TabsContent value="main">
          {mainCharacters.length > 0 ? (
            <CharacterGrid characters={mainCharacters} novelId={params.novelId} />
          ) : (
            <EmptyState message="No main characters found" novelId={params.novelId} />
          )}
        </TabsContent>
        
        <TabsContent value="supporting">
          {supportingCharacters.length > 0 ? (
            <CharacterGrid characters={supportingCharacters} novelId={params.novelId} />
          ) : (
            <EmptyState message="No supporting characters found" novelId={params.novelId} />
          )}
        </TabsContent>
        
        <TabsContent value="antagonist">
          {antagonistCharacters.length > 0 ? (
            <CharacterGrid characters={antagonistCharacters} novelId={params.novelId} />
          ) : (
            <EmptyState message="No antagonist characters found" novelId={params.novelId} />
          )}
        </TabsContent>
        
        <TabsContent value="minor">
          {minorCharacters.length > 0 ? (
            <CharacterGrid characters={minorCharacters} novelId={params.novelId} />
          ) : (
            <EmptyState message="No minor characters found" novelId={params.novelId} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CharacterGrid({ characters, novelId }: { characters: Character[], novelId: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {characters.map((character) => (
        <CharacterCard key={character.id} character={character} novelId={novelId} />
      ))}
    </div>
  );
}

function CharacterCard({ character, novelId }: { character: Character, novelId: string }) {
  const progressionCount = character.progression.length;
  const lastProgression = progressionCount > 0 ? character.progression[progressionCount - 1] : null;
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {character.image_url ? (
          <Image
            src={character.image_url}
            alt={character.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary">
            <span className="text-2xl font-semibold text-secondary-foreground/50">
              {character.name.substring(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        
        <div className="absolute top-2 right-2">
          <CharacterMenu character={character} novelId={novelId} />
        </div>
      </div>
      
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{character.name}</CardTitle>
            <CardDescription className="mt-1 line-clamp-1">
              {character.role}
            </CardDescription>
          </div>
          
          <RoleBadge role={character.role} />
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        <p className="text-sm text-muted-foreground line-clamp-3">{character.description}</p>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex-col items-start">
        <div className="w-full flex justify-between items-center">
          <Link
            href={`/admin/novels/${novelId}/characters/${character.id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            View Details
          </Link>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {progressionCount} {progressionCount === 1 ? "appearance" : "appearances"}
            </Badge>
            
            {lastProgression && (
              <Badge variant="secondary" className="text-xs">
                Last: Ch.{lastProgression.chapter_number}
              </Badge>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

function CharacterMenu({ character, novelId }: { character: Character, novelId: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM12.5 8.625C13.1213 8.625 13.625 8.12132 13.625 7.5C13.625 6.87868 13.1213 6.375 12.5 6.375C11.8787 6.375 11.375 6.87868 11.375 7.5C11.375 8.12132 11.8787 8.625 12.5 8.625Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/admin/novels/${novelId}/characters/${character.id}`}>
            View Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/admin/novels/${novelId}/characters/${character.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Character
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/admin/novels/${novelId}/characters/${character.id}/progression`}>
            Track Progression
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="text-destructive">
          <Link href={`/api/admin/novels/${novelId}/characters/${character.id}/delete`}>
            <Trash className="mr-2 h-4 w-4" />
            Delete Character
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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

function EmptyState({ message, novelId }: { message: string, novelId: string }) {
  return (
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
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <h3 className="text-lg font-medium">{message}</h3>
        <p className="text-muted-foreground mt-2 mb-4">
          Add characters to help track their development throughout the novel
        </p>
        <Button asChild>
          <Link href={`/admin/novels/${novelId}/characters/create`}>
            <Plus className="mr-2 h-4 w-4" />
            Add Character
          </Link>
        </Button>
      </div>
    </Card>
  );
} 