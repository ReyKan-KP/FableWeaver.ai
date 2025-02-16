"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Image from "next/image";

interface Novel {
  id: string;
  title: string;
  description: string;
  genre: string;
  cover_image: string;
  is_published: boolean;
  is_public: boolean;
}

const genres = [
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Romance",
  "Horror",
  "Adventure",
  "Historical Fiction",
  "Contemporary",
  "Other",
];

export default function EditNovelPage({
  params,
}: {
  params: { novelId: string };
}) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [novel, setNovel] = useState<Novel | null>(null);

  useEffect(() => {
    fetchNovel();
  }, []);

  const fetchNovel = async () => {
    try {
      const { data, error } = await supabase
        .from("novels")
        .select("*")
        .eq("id", params.novelId)
        .single();

      if (error) throw error;
      setNovel(data);
    } catch (error) {
      console.error("Error fetching novel:", error);
      toast.error("Failed to fetch novel");
      router.push("/admin");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novel) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("novels")
        .update({
          title: novel.title,
          description: novel.description,
          genre: novel.genre,
          is_published: novel.is_published,
          is_public: novel.is_public,
        })
        .eq("id", novel.id);

      if (error) throw error;

      toast.success("Novel updated successfully");
      router.push("/admin");
    } catch (error) {
      console.error("Error updating novel:", error);
      toast.error("Failed to update novel");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!novel) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Novel</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative h-48 mb-6">
            <Image
              src={novel.cover_image || "/images/default-cover.png"}
              alt={novel.title}
              fill
              className="object-cover rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={novel.title}
              onChange={(e) =>
                setNovel((prev) => ({ ...prev!, title: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={novel.description}
              onChange={(e) =>
                setNovel((prev) => ({ ...prev!, description: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="genre">Genre</Label>
            <Select
              value={novel.genre}
              onValueChange={(value) =>
                setNovel((prev) => ({ ...prev!, genre: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a genre" />
              </SelectTrigger>
              <SelectContent>
                {genres.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Label htmlFor="is_published">Published</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={novel.is_published}
                  onCheckedChange={(checked) =>
                    setNovel((prev) => ({ ...prev!, is_published: checked }))
                  }
                />
                <Label htmlFor="is_published">
                  {novel.is_published ? "Published" : "Draft"}
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="is_public">Visibility</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_public"
                  checked={novel.is_public}
                  onCheckedChange={(checked) =>
                    setNovel((prev) => ({ ...prev!, is_public: checked }))
                  }
                />
                <Label htmlFor="is_public">
                  {novel.is_public ? "Public" : "Private"}
                </Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
