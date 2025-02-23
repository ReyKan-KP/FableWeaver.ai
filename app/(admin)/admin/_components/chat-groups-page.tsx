"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  MoreVertical,
  Eye,
  Archive,
  Trash,
  MessageSquare,
  Users,
  Bot,
  Loader2,
} from "lucide-react";
import { formatDistance } from "date-fns";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
} from "recharts";

interface ChatGroup {
  id: string;
  group_name: string;
  creator_id: string;
  users_id: string[];
  characters_id: string[];
  created_at: string;
  is_active: boolean;
  is_auto_chatting: boolean;
  character_names: string[];
  user_names: string[];
  creator_name?: string;
  creator_avatar?: string;
  messages: any[];
  user_avatars: string[];
  character_images: string[];
}

interface GroupAnalytics {
  totalMessages: number;
  averageMessagesPerUser: number;
  messagesByUser: {
    user_id: string;
    user_name: string;
    count: number;
    lastActive: string;
    avatar_url: string;
  }[];
  messagesByCharacter: {
    character_id: string;
    character_name: string;
    count: number;
    image_url: string;
  }[];
  messagesByDay: {
    date: string;
    count: number;
  }[];
  lastActive: string;
  mostActiveHours: {
    hour: number;
    count: number;
  }[];
}

export default function ChatGroupsPage() {
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [groupAnalytics, setGroupAnalytics] = useState<GroupAnalytics | null>(
    null
  );
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      // First fetch all groups
      const { data: groupsData, error: groupsError } = await supabase
        .from("group_chat_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (groupsError) throw groupsError;

      // Get unique IDs for creators and participants
      const creatorIds = groupsData.map((group) => group.creator_id);
      const userIds = Array.from(
        new Set(groupsData.flatMap((group) => group.users_id))
      );
      const characterIds = Array.from(
        new Set(groupsData.flatMap((group) => group.characters_id))
      );

      // Fetch creators and participants data in parallel
      const [
        { data: creatorsData, error: creatorsError },
        { data: usersData, error: usersError },
        { data: charactersData, error: charactersError },
      ] = await Promise.all([
        supabase
          .from("user")
          .select("user_id, user_name, avatar_url")
          .in("user_id", creatorIds),
        supabase
          .from("user")
          .select("user_id, user_name, avatar_url")
          .in("user_id", userIds),
        supabase
          .from("character_profiles")
          .select("id, name, image_url")
          .in("id", characterIds),
      ]);

      if (creatorsError) throw creatorsError;
      if (usersError) throw usersError;
      if (charactersError) throw charactersError;

      // Create lookup maps for faster access
      const userMap = new Map(usersData.map((user) => [user.user_id, user]));
      const characterMap = new Map(
        charactersData.map((char) => [char.id, char])
      );

      // Combine all the data
      const enrichedGroups = groupsData.map((group) => ({
        ...group,
        creator_name: creatorsData.find(
          (creator) => creator.user_id === group.creator_id
        )?.user_name,
        creator_avatar: creatorsData.find(
          (creator) => creator.user_id === group.creator_id
        )?.avatar_url,
        user_names: group.users_id.map(
          (userId: string) => userMap.get(userId)?.user_name || "Unknown User"
        ),
        character_names: group.characters_id.map(
          (charId: string) =>
            characterMap.get(charId)?.name || "Unknown Character"
        ),
        // Add avatar URLs for users and characters
        user_avatars: group.users_id.map(
          (userId: string) =>
            userMap.get(userId)?.avatar_url || "/images/default-avatar.png"
        ),
        character_images: group.characters_id.map(
          (charId: string) =>
            characterMap.get(charId)?.image_url ||
            "/images/default-character.png"
        ),
      }));

      setGroups(enrichedGroups || []);
      toast("Groups Loaded", {
        description: `${enrichedGroups?.length || 0} groups loaded successfully`,
      });
    } catch (error) {
      console.error("Error fetching chat groups:", error);
      toast.error("Error Loading Groups", {
        description: "Failed to load groups. Please refresh the page.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroupAnalytics = async (group: ChatGroup) => {
    setIsAnalyticsLoading(true);
    try {
      // Process messages to generate analytics
      const messages = group.messages || [];
      const analytics: GroupAnalytics = {
        totalMessages: messages.length,
        averageMessagesPerUser: messages.length / (group.users_id.length || 1),
        messagesByUser: group.user_names.map((name, idx) => ({
          user_id: group.users_id[idx],
          user_name: name,
          count: messages.filter((m) => m.sender_id === group.users_id[idx])
            .length,
          lastActive:
            messages
              .filter((m) => m.sender_id === group.users_id[idx])
              .sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime()
              )[0]?.timestamp || group.created_at,
          avatar_url: group.user_avatars[idx],
        })),
        messagesByCharacter: group.character_names.map((name, idx) => ({
          character_id: group.characters_id[idx],
          character_name: name,
          count: messages.filter(
            (m) => m.sender_id === group.characters_id[idx]
          ).length,
          image_url: group.character_images[idx],
        })),
        messagesByDay: Object.entries(
          messages.reduce((acc: any, msg) => {
            const date = new Date(msg.timestamp).toISOString().split("T")[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
          }, {})
        ).map(([date, count]) => ({ date, count: count as number })),
        lastActive:
          messages[messages.length - 1]?.timestamp || group.created_at,
        mostActiveHours: Object.entries(
          messages.reduce((acc: any, msg) => {
            const hour = new Date(msg.timestamp).getHours();
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
          }, {})
        ).map(([hour, count]) => ({
          hour: parseInt(hour),
          count: count as number,
        })),
      };

      setGroupAnalytics(analytics);
    } catch (error) {
      console.error("Error generating analytics:", error);
      toast.error("Error Generating Analytics", {
        description: "Failed to generate group analytics. Please try again later.",
      });
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const handleDelete = async (group: ChatGroup) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${group.group_name}? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from("group_chat_history")
        .delete()
        .eq("id", group.id);

      if (error) throw error;

      setGroups((prev) => prev.filter((g) => g.id !== group.id));
      toast("Group Deleted", {
        description: `${group.group_name} has been deleted successfully`,
      });
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Error Deleting Group", {
        description: "Failed to delete group. Please try again.",
      });
    }
  };

  const handleToggleStatus = async (group: ChatGroup) => {
    try {
      const { error } = await supabase
        .from("group_chat_history")
        .update({ is_active: !group.is_active })
        .eq("id", group.id);

      if (error) throw error;

      setGroups((prev) =>
        prev.map((g) =>
          g.id === group.id ? { ...g, is_active: !g.is_active } : g
        )
      );

      toast("Status Updated", {
        description: `${group.group_name} is now ${!group.is_active ? "active" : "inactive"}`,
      });
    } catch (error) {
      console.error("Error updating group status:", error);
      toast.error("Error Updating Status", {
        description: "Failed to update group status. Please try again.",
      });
    }
  };

  const filteredGroups = groups.filter((group) =>
    group.group_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Chat Groups</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group Name</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGroups.map((group) => (
              <TableRow
                key={group.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  setSelectedGroup(group);
                  fetchGroupAnalytics(group);
                }}
              >
                <TableCell>
                  <div className="font-medium">{group.group_name}</div>
                  <div className="text-sm text-gray-500">
                    {group.character_names?.join(", ")}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex -space-x-2">
                    {[
                      ...(group.character_names || [])
                        .slice(0, 2)
                        .map((name, idx) => ({
                          name,
                          type: "character",
                          id: group.characters_id[idx],
                          image: group.character_images[idx],
                        })),
                      ...(group.user_names || [])
                        .slice(0, 2)
                        .map((name, idx) => ({
                          name,
                          type: "user",
                          id: group.users_id[idx],
                          image: group.user_avatars[idx],
                        })),
                    ].map((participant, index) => (
                      <div
                        key={`${participant.type}-${index}`}
                        className="relative w-8 h-8 rounded-full border-2 border-background overflow-hidden"
                      >
                        <Image
                          src={participant.image}
                          alt={participant.name}
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      </div>
                    ))}
                    {(group.character_names?.length || 0) +
                      (group.user_names?.length || 0) >
                      4 && (
                      <div className="relative w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                        <span className="text-xs">
                          +
                          {(group.character_names?.length || 0) +
                            (group.user_names?.length || 0) -
                            4}
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden">
                      <Image
                        src={
                          group.creator_avatar || "/images/default-avatar.png"
                        }
                        alt={group.creator_name || "Creator"}
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    </div>
                    <span className="text-sm">{group.creator_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={group.is_active ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {group.is_active ? "Active" : "Archived"}
                  </Badge>
                  {group.is_auto_chatting && (
                    <Badge variant="outline" className="ml-2">
                      Auto Chat
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {formatDistance(new Date(group.created_at), new Date(), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" /> View Chat
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Archive className="h-4 w-4 mr-2" />
                        {group.is_active ? "Archive" : "Restore"}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Analytics Dialog */}
      <Dialog
        open={!!selectedGroup}
        onOpenChange={(open) => !open && setSelectedGroup(null)}
      >
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                <MessageSquare className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h2 className="font-bold">{selectedGroup?.group_name}</h2>
                <p className="text-sm text-muted-foreground font-normal">
                  Chat Group Analytics
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {isAnalyticsLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-sm text-muted-foreground">
                  Loading analytics...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 py-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-6">
                {[
                  {
                    label: "Total Messages",
                    value: groupAnalytics?.totalMessages.toLocaleString(),
                    icon: MessageSquare,
                    color: "#0ea5e9",
                  },
                  {
                    label: "Avg Messages/User",
                    value: groupAnalytics?.averageMessagesPerUser.toFixed(1),
                    icon: Users,
                    color: "#6366f1",
                  },
                  {
                    label: "Active Users",
                    value: selectedGroup?.user_names.length.toString(),
                    icon: Users,
                    color: "#22c55e",
                  },
                  {
                    label: "Characters",
                    value: selectedGroup?.character_names.length.toString(),
                    icon: Bot,
                    color: "#f59e0b",
                  },
                ].map((metric, i) => (
                  <div
                    key={i}
                    className="bg-card rounded-xl border shadow-sm hover:shadow-md transition-shadow p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${metric.color}15` }}
                      >
                        <metric.icon
                          className="w-5 h-5"
                          style={{ color: metric.color }}
                        />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        {metric.label}
                      </span>
                    </div>
                    <div className="text-3xl font-bold">{metric.value}</div>
                  </div>
                ))}
              </div>

              {/* Message Activity Chart */}
              <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
                <h3 className="text-lg font-semibold">Message Activity</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={groupAnalytics?.messagesByDay}>
                      <defs>
                        <linearGradient
                          id="colorMessages"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#0ea5e9"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#0ea5e9"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "currentColor" }}
                        tickFormatter={(value: string) => {
                          const date = new Date(value);
                          return date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          });
                        }}
                      />
                      <YAxis tick={{ fill: "currentColor" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                        }}
                        labelFormatter={(label: string) => {
                          const date = new Date(label);
                          return date.toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          });
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#0ea5e9"
                        fillOpacity={1}
                        fill="url(#colorMessages)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* User Activity Table */}
              <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
                <h3 className="text-lg font-semibold">User Activity</h3>
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 font-medium">User</th>
                        <th className="px-6 py-3 font-medium">Messages</th>
                        <th className="px-6 py-3 font-medium">Last Active</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted">
                      {groupAnalytics?.messagesByUser.map((user, index) => (
                        <tr key={index} className="bg-card hover:bg-muted/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                                <Image
                                  src={
                                    user.avatar_url ||
                                    "/images/default-avatar.png"
                                  }
                                  alt={user.user_name}
                                  width={32}
                                  height={32}
                                  className="object-cover"
                                />
                              </div>
                              <span className="font-medium">
                                {user.user_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {user.count.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {formatDistance(
                              new Date(user.lastActive),
                              new Date(),
                              {
                                addSuffix: true,
                              }
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Character Activity Table */}
              <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
                <h3 className="text-lg font-semibold">Character Activity</h3>
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 font-medium">Character</th>
                        <th className="px-6 py-3 font-medium">Messages</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted">
                      {groupAnalytics?.messagesByCharacter.map(
                        (character, index) => (
                          <tr key={index} className="bg-card hover:bg-muted/50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="relative w-8 h-8 rounded-full overflow-hidden">
                                  <Image
                                    src={
                                      character.image_url ||
                                      "/images/default-character.png"
                                    }
                                    alt={character.character_name}
                                    width={32}
                                    height={32}
                                    className="object-cover"
                                  />
                                </div>
                                <span className="font-medium">
                                  {character.character_name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {character.count.toLocaleString()}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
