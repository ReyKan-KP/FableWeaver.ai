"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash,
  Globe,
  Lock,
} from "lucide-react";
import { formatDistance } from "date-fns";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Novel {
  id: string;
  title: string;
  description: string;
  genre: string;
  cover_image: string;
  chapter_count: number;
  total_words: number;
  is_published: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  needs_approval?: boolean;
  creator_name?: string;
  creator_avatar?: string;
}

export default function NovelsPage() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteNovelId, setDeleteNovelId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();

  useEffect(() => {
    fetchNovels();
  }, []);

  const fetchNovels = async () => {
    try {
      // First fetch all novels
      const { data: novelsData, error: novelsError } = await supabase
        .from("novels")
        .select("*")
        .order("created_at", { ascending: false });

      if (novelsError) throw novelsError;

      // Get unique creator IDs
      const creatorIds = Array.from(
        new Set(novelsData.map((novel) => novel.user_id))
      );

      // Fetch creators data
      const { data: creatorsData, error: creatorsError } = await supabase
        .from("user")
        .select("user_id, user_name, avatar_url")
        .in("user_id", creatorIds);

      if (creatorsError) throw creatorsError;

      // Create a lookup map for creators
      const creatorMap = new Map(
        creatorsData.map((creator) => [creator.user_id, creator])
      );

      // Combine all the data
      const processedNovels = (novelsData || []).map((novel) => ({
        ...novel,
        creator_name:
          creatorMap.get(novel.user_id)?.user_name || "Unknown User",
        creator_avatar:
          creatorMap.get(novel.user_id)?.avatar_url ||
          "/images/default-avatar.png",
        needs_approval: !novel.is_public && novel.is_published,
      }));

      setNovels(processedNovels);
    } catch (error) {
      console.error("Error fetching novels:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNovels = novels.filter(
    (novel) =>
      (novel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        novel.genre.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (activeTab === "all" || (activeTab === "pending" && novel.needs_approval))
  );

  const handleView = (novelId: string) => {
    router.push(`/admin/novels/${novelId}`);
  };

  const handleEdit = (novelId: string) => {
    router.push(`/admin/novels/${novelId}/edit`);
  };

  const handleDelete = async (novelId: string) => {
    try {
      const { error } = await supabase
        .from("novels")
        .delete()
        .eq("id", novelId);

      if (error) throw error;

      setNovels((prev) => prev.filter((novel) => novel.id !== novelId));
      toast.success("Novel deleted successfully");
      setDeleteNovelId(null);
    } catch (error) {
      console.error("Error deleting novel:", error);
      toast.error("Failed to delete novel");
    }
  };

  const togglePrivacy = async (novel: Novel) => {
    try {
      const { error } = await supabase
        .from("novels")
        .update({ is_public: !novel.is_public })
        .eq("id", novel.id);

      if (error) throw error;

      setNovels((prev) =>
        prev.map((n) =>
          n.id === novel.id ? { ...n, is_public: !n.is_public } : n
        )
      );

      toast.success(`Novel is now ${!novel.is_public ? "public" : "private"}`);
    } catch (error) {
      console.error("Error toggling privacy:", error);
      toast.error("Failed to update privacy settings");
    }
  };

  const handleApproveNovel = async (novel: Novel) => {
    try {
      const { error } = await supabase
        .from("novels")
        .update({ is_public: true })
        .eq("id", novel.id);

      if (error) throw error;

      setNovels((prev) =>
        prev.map((n) =>
          n.id === novel.id
            ? { ...n, is_public: true, needs_approval: false }
            : n
        )
      );

      toast.success("Novel approved and made public");
    } catch (error) {
      console.error("Error approving novel:", error);
      toast.error("Failed to approve novel");
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Novels</h1>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button
              variant={activeTab === "all" ? "default" : "outline"}
              onClick={() => setActiveTab("all")}
            >
              All Novels
            </Button>
            <Button
              variant={activeTab === "pending" ? "default" : "outline"}
              onClick={() => setActiveTab("pending")}
            >
              Pending Approval
              {novels.filter((n) => n.needs_approval).length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded-full text-xs">
                  {novels.filter((n) => n.needs_approval).length}
                </span>
              )}
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search novels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredNovels.map((novel) => (
          <div
            key={novel.id}
            className="bg-white dark:bg-zinc-900 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-800"
          >
            <div className="relative h-48">
              <Image
                src={novel.cover_image || "/images/default-cover.png"}
                alt={novel.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold">{novel.title}</h3>
                  <span className="text-sm text-gray-500">{novel.genre}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleView(novel.id)}>
                      <Eye className="h-4 w-4 mr-2" /> View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(novel.id)}>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    {novel.needs_approval && (
                      <DropdownMenuItem
                        onClick={() => handleApproveNovel(novel)}
                      >
                        <Globe className="h-4 w-4 mr-2" /> Approve & Make Public
                      </DropdownMenuItem>
                    )}
                    {!novel.needs_approval && (
                      <DropdownMenuItem onClick={() => togglePrivacy(novel)}>
                        {novel.is_public ? (
                          <>
                            <Lock className="h-4 w-4 mr-2" /> Make Private
                          </>
                        ) : (
                          <>
                            <Globe className="h-4 w-4 mr-2" /> Make Public
                          </>
                        )}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => setDeleteNovelId(novel.id)}
                    >
                      <Trash className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
                {novel.description}
              </p>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="relative w-6 h-6 rounded-full overflow-hidden">
                    <Image
                      src={novel.creator_avatar || "/images/default-avatar.png"}
                      alt={novel.creator_name || "Creator"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-sm text-gray-500">
                    {novel.creator_name}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div>
                    {novel.chapter_count} chapters • {novel.total_words} words
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500 mb-4">
                Updated{" "}
                {formatDistance(new Date(novel.updated_at), new Date(), {
                  addSuffix: true,
                })}
              </div>
              <div className="mt-4 flex gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    novel.is_published
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {novel.is_published ? "Published" : "Draft"}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    novel.is_public
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {novel.is_public ? "Public" : "Private"}
                </span>
                {novel.needs_approval && (
                  <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                    Needs Approval
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog
        open={!!deleteNovelId}
        onOpenChange={() => setDeleteNovelId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              novel and all its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteNovelId && handleDelete(deleteNovelId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
