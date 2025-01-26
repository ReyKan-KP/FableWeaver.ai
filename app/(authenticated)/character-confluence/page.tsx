"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Loader2, Check, Search, Sparkles } from "lucide-react";
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

export default function CharacterConfluence() {
  const { data: session } = useSession();
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [availableData, setAvailableData] = useState<AvailableData>({
    characters: [],
    users: [],
  });
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const { toast } = useToast();

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
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchData();
    }
  }, [session?.user?.id, fetchData]);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group name",
        variant: "destructive",
      });
      return;
    }

    if (selectedCharacters.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one character",
        variant: "destructive",
      });
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
      toast({
        title: "Success",
        description: "Group created successfully",
      });

      // Reset form and close dialog
      setGroupName("");
      setSelectedCharacters([]);
      setSelectedUsers([]);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create group",
        variant: "destructive",
      });
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
              Character Confluence
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Create and manage your character group chats
            </p>
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
            className="bg-[#bccff1] dark:bg-zinc-900 rounded-xl shadow-md overflow-hidden hover:shadow-xl 
            transition-all duration-300 border border-gray-100 dark:border-gray-700"
          >
            <Link href={`/character-confluence/${group.session_id}`}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      {group.group_name}
                    </div>
                    <span
                      className={cn(
                        "px-2 py-1 text-xs rounded-full",
                        group.is_active
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300"
                      )}
                    >
                      {group.is_active ? "Active" : "Inactive"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {group.character_count} Characters • {group.user_count}{" "}
                      Users
                    </p>
                    {group.character_names && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Characters: {group.character_names.join(", ")}
                      </p>
                    )}
                    {group.user_names && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Users: {group.user_names.join(", ")}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Created {new Date(group.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
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
    </div>
  );
}
