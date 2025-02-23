"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Plus,
  Users,
  Loader2,
  Check,
  Search,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import CharacterConfluenceLoading from "./loading";
import Image from "next/image";
import { createBrowserSupabaseClient } from "@/lib/supabase";

const supabase = createBrowserSupabaseClient();

interface User {
  id: string;
  name: string;
  image?: string;
}

interface Character {
  id: string;
  name: string;
  image?: string;
}

interface GroupChat {
  id: string;
  creator_id: string;
  users_id: string[];
  characters_id: string[];
  session_id: string;
  created_at: string;
  group_name: string;
  is_active: boolean;
  character_names?: string[];
  user_names?: string[];
  character_count: number;
  user_count: number;
}

interface AvailableData {
  characters: Character[];
  users: User[];
}

async function getProfileImageUrl(senderId: string): Promise<string> {
  const { data, error } = await supabase
    .from("character_profiles")
    .select("image_url")
    .eq("id", senderId)
    .single();

  if (error) {
    console.error("Error fetching profile image:", error);
    return "";
  }

  return data?.image_url || "";
}

async function getUserImageUrl(senderId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("user")
      .select("avatar_url")
      .eq("user_id", senderId)
      .single();

    if (error || !data?.avatar_url) {
      return "/images/default-avatar.png";
    }

    return data.avatar_url;
  } catch {
    return "/images/default-avatar.png";
  }
}

export default function CharacterConfluence() {
  const { data: session } = useSession();
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [availableData, setAvailableData] = useState<AvailableData>({
    characters: [],
    users: [],
  });
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [characterImages, setCharacterImages] = useState<
    Record<string, string>
  >({});
  const [userImages, setUserImages] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch groups
      const groupsRes = await fetch("/api/group-chat");
      if (!groupsRes.ok) throw new Error("Failed to fetch groups");
      const groupsData = await groupsRes.json();
      setGroups(groupsData.groups || []);

      // Fetch available characters and users
      const availableRes = await fetch("/api/group-chat/available");
      if (!availableRes.ok) throw new Error("Failed to fetch available data");
      const data = await availableRes.json();
      setAvailableData({
        characters: data.characters || [],
        users: data.users || [],
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchData();
    }
  }, [session?.user?.id, fetchData]);

  useEffect(() => {
    const loadCharacterImages = async () => {
      const characterIds = groups.flatMap(
        (group) =>
          group.character_names?.map((_, idx) => group.characters_id[idx]) || []
      );
      const uniqueCharacterIds = Array.from(new Set(characterIds));

      for (const id of uniqueCharacterIds) {
        if (id && !characterImages[id]) {
          const imageUrl = await getProfileImageUrl(id);
          setCharacterImages((prev) => ({
            ...prev,
            [id]: imageUrl || "/images/default-character.png",
          }));
        }
      }
    };

    const loadUserImages = async () => {
      const userIds = groups.flatMap(
        (group) => group.user_names?.map((_, idx) => group.users_id[idx]) || []
      );
      const uniqueUserIds = Array.from(new Set(userIds));

      for (const id of uniqueUserIds) {
        if (id && !userImages[id]) {
          const imageUrl = await getUserImageUrl(id);
          setUserImages((prev) => ({ ...prev, [id]: imageUrl }));
        }
      }
    };

    if (groups.length > 0) {
      loadCharacterImages();
      loadUserImages();
    }
  }, [groups]);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    if (selectedCharacters.length === 0) {
      toast.error("Please select at least one character");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/group-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_name: groupName,
          users_id: selectedUsers,
          characters_id: selectedCharacters,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      const data = await res.json();
      setGroups((prev) => [data.group, ...prev]);
      toast.success("Group created successfully");

      // Reset form and close dialog
      setGroupName("");
      setSelectedCharacters([]);
      setSelectedUsers([]);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create group");
    } finally {
      setIsCreating(false);
    }
  };

  const filteredGroups = groups.filter((group) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && group.is_active) ||
      (filter === "inactive" && !group.is_active);

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      group.group_name.toLowerCase().includes(searchLower) ||
      (group.character_names &&
        group.character_names.some((name) =>
          name.toLowerCase().includes(searchLower)
        )) ||
      (group.user_names &&
        group.user_names.some((name) =>
          name.toLowerCase().includes(searchLower)
        ));

    return matchesFilter && matchesSearch;
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  if (loading) {
    return <CharacterConfluenceLoading />;
  }

  return (
    <div className="container mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
                Character Confluence
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Create and manage your character group chats
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsHelpDialogOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <HelpCircle className="w-6 h-6" />
            </motion.button>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="px-6 py-3 bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white rounded-full 
                  hover:shadow-lg transform transition-all duration-300 font-semibold flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Create New Group
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Group Chat</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="group-name" className="text-right">
                      Group Name
                    </Label>
                    <Input
                      id="group-name"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right">Characters</Label>
                    <ScrollArea className="h-[200px] col-span-3 p-2 border rounded-md">
                      {availableData.characters.map((character) => (
                        <div
                          key={character.id}
                          className="flex items-center space-x-2 mb-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg"
                          onClick={() => {
                            setSelectedCharacters((prev) =>
                              prev.includes(character.id)
                                ? prev.filter((id) => id !== character.id)
                                : [...prev, character.id]
                            );
                          }}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              selectedCharacters.includes(character.id)
                                ? "bg-primary text-primary-foreground"
                                : "bg-background"
                            }`}
                          >
                            {selectedCharacters.includes(character.id) && (
                              <Check className="w-4 h-4" />
                            )}
                          </div>
                          <Avatar className="h-8 w-8">
                            {character.image && (
                              <AvatarImage
                                src={character.image}
                                alt={character.name}
                              />
                            )}
                            <AvatarFallback>
                              {character.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{character.name}</span>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right">Users</Label>
                    <ScrollArea className="h-[200px] col-span-3 p-2 border rounded-md">
                      {availableData.users.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center space-x-2 mb-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg"
                          onClick={() => {
                            setSelectedUsers((prev) =>
                              prev.includes(user.id)
                                ? prev.filter((id) => id !== user.id)
                                : [...prev, user.id]
                            );
                          }}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              selectedUsers.includes(user.id)
                                ? "bg-primary text-primary-foreground"
                                : "bg-background"
                            }`}
                          >
                            {selectedUsers.includes(user.id) && (
                              <Check className="w-4 h-4" />
                            )}
                          </div>
                          <Avatar className="h-8 w-8">
                            {user.image && (
                              <AvatarImage src={user.image} alt={user.name} />
                            )}
                            <AvatarFallback>
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{user.name}</span>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </div>
                <Button
                  onClick={handleCreateGroup}
                  className="w-full bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 hover:from-violet-600 hover:via-blue-600 hover:to-teal-600"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create Group
                    </>
                  )}
                </Button>
              </DialogContent>
            </Dialog>
          </motion.div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <motion.div
            className="relative flex-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 
              focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent 
              transition-all duration-300 bg-white dark:bg-gray-800 dark:text-gray-200"
            />
          </motion.div>
          <motion.div
            className="flex gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {["all", "active", "inactive"].map((filterType) => (
              <motion.button
                key={filterType}
                onClick={() => setFilter(filterType as typeof filter)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "px-4 py-2 rounded-full transition-all duration-300",
                  filter === filterType
                    ? "bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                )}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {filteredGroups.map((group) => (
          <motion.div
            key={group.id}
            variants={item}
            whileHover={{ scale: 1.02 }}
            className="rounded-xl shadow-md overflow-hidden hover:shadow-xl 
            transition-all duration-300 border text-primary bg-background"
          >
            <Link href={`/character-confluence/${group.session_id}`}>
              <Card className="h-full bg-transparent border-none p-4">
                <div className="space-y-2">
                  {/* Combined Avatar Stack */}
                  <div className="flex -space-x-3">
                    {[
                      ...(group.character_names || [])
                        .slice(0, 2)
                        .map((name, idx) => ({
                          name,
                          type: "character",
                          id: group.characters_id[idx],
                          idx,
                        })),
                      ...(group.user_names || [])
                        .slice(0, 2)
                        .map((name, idx) => ({
                          name,
                          type: "user",
                          id: group.users_id[idx],
                          idx,
                        })),
                    ].map((item) => (
                      <div
                        key={`${item.type}-${item.idx}`}
                        className="w-8 h-8 rounded-full border-2 border-[#0F0F0F] overflow-hidden"
                      >
                        <Image
                          src={
                            item.type === "character"
                              ? characterImages[item.id] ||
                                "/images/default-character.png"
                              : userImages[item.id] ||
                                "/images/default-avatar.png"
                          }
                          alt={item.name}
                          width={32}
                          height={32}
                          className={cn(
                            "w-full h-full object-cover",
                            item.type === "character"
                              ? "bg-blue-500/20"
                              : "bg-purple-500/20"
                          )}
                        />
                      </div>
                    ))}
                    {(group.character_names?.length || 0) +
                      (group.user_names?.length || 0) >
                      4 && (
                      <div className="w-8 h-8 rounded-full border-2 border-[#0F0F0F] bg-gray-800 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-400">
                          +
                          {(group.character_names?.length || 0) +
                            (group.user_names?.length || 0) -
                            4}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Group Name and Info */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className=" text-base font-medium">
                        {group.group_name}
                      </h3>
                      <div
                        className={cn(
                          "flex items-center gap-1.5 text-xs",
                          group.is_active ? "text-green-400" : "text-gray-500"
                        )}
                      >
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full animate-pulse",
                            group.is_active ? "bg-green-400" : "bg-gray-500"
                          )}
                        />
                        <span className="font-medium">
                          {group.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{group.user_count} Users</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-4 h-4" />
                        <span>{group.character_count} Characters</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {filteredGroups.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
            <p className="text-gray-600 dark:text-gray-300 text-lg mb-4">
              No groups found
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 
                text-white rounded-full hover:shadow-lg transform transition-all duration-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Group
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Help Dialog */}
      <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
              How Character Confluence Works
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                What is Character Confluence?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Character Confluence is a unique feature that allows you to
                create and manage group chats between different characters.
                Think of it as a virtual roundtable where your favorite
                characters can interact with each other!
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Key Features
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Create group chats with multiple characters</li>
                <li>Invite other users to join your character groups</li>
                <li>Engage in dynamic conversations between characters</li>
                <li>Search and filter your group chats</li>
                <li>Track active and inactive group sessions</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                How to Use
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>
                  Click &quot;Create New Group&quot; to start a new character
                  group chat
                </li>
                <li>Select characters and users you want to include</li>
                <li>Give your group a memorable name</li>
                <li>Start the conversation and watch the magic happen!</li>
              </ol>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Tips
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Use the search bar to quickly find specific groups</li>
                <li>Filter between all, active, and inactive groups</li>
                <li>Click on any group card to join the conversation</li>
                <li>Manage your groups easily with the provided controls</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
