"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreVertical,
  MessageSquare,
  Edit,
  Trash,
  Sparkles,
  Loader2,
  Plus,
  Info,
  Lock,
  Unlock,
  Shield,
  Clock,
  Users,
} from "lucide-react";
import { formatDistance } from "date-fns";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { toast } from "sonner";

interface Character {
  id: string;
  name: string;
  description: string;
  content_source: string;
  image_url: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  creator_id: string;
  dialogue_examples: string[];
  content_types?: string[];
  fandom_url?: string;
  pending_approval?: boolean;
  requested_public?: boolean;
  creator_name?: string;
  creator_avatar?: string;
}

interface CharacterAnalytics {
  totalChats: number;
  totalMessages: number;
  averageMessagesPerChat: number;
  uniqueUsers: number;
  messagesByDay: { date: string; count: number }[];
  messagesByUser: {
    user_id: string;
    user_name: string;
    user_email: string;
    avatar_url: string;
    count: number;
    lastActive: string;
    totalChats: number;
    averageMessagesPerChat: number;
    is_active: boolean;
  }[];
  lastActive: string | null;
}

const COLORS = {
  primary: "#0ea5e9",
  secondary: "#6366f1",
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  gray: "#94a3b8",
  chart: ["#0ea5e9", "#6366f1", "#22c55e", "#f59e0b", "#ef4444"],
};

const CharacterAnalyticsDialog = ({
  character,
  isOpen,
  onClose,
}: {
  character: Character | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [analytics, setAnalytics] = useState<CharacterAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createBrowserSupabaseClient();
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!character) return;

      try {
        // Fetch chat history with user details
        const { data: chatData, error: chatError } = await supabase
          .from("chat_history")
          .select(
            `
            *,
            user:user_id (
              user_id,
              user_name,
              user_email,
              avatar_url,
              is_active,
              last_seen
            )
          `
          )
          .eq("character_id", character.id);

        if (chatError) throw chatError;

        // Calculate metrics...
        const totalChats = chatData?.length || 0;
        const totalMessages =
          chatData?.reduce(
            (acc, chat) => acc + (chat.messages?.length || 0),
            0
          ) || 0;
        const uniqueUsers = new Set(chatData?.map((chat) => chat.user_id)).size;
        const averageMessagesPerChat =
          totalChats > 0 ? totalMessages / totalChats : 0;
        const lastActive = chatData?.length
          ? new Date(
              Math.max(
                ...chatData.map((chat) => new Date(chat.updated_at).getTime())
              )
            ).toISOString()
          : null;

        // Process message data by user with user details
        const messagesByUser = generateMessagesByUser(chatData);

        const analytics: CharacterAnalytics = {
          totalChats,
          totalMessages,
          averageMessagesPerChat,
          uniqueUsers,
          messagesByDay: generateMessagesByDay(chatData),
          messagesByUser,
          lastActive,
        };

        setAnalytics(analytics);
      } catch (error) {
        console.error("Error fetching analytics:", error);
        toast({
          title: "Error",
          description: "Failed to fetch character analytics",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && character) {
      fetchAnalytics();
    }
  }, [character, isOpen]);

  if (!character || !analytics) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4 pb-4 border-b">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
              <Sparkles className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="font-bold">{character?.name}</h2>
              <p className="text-sm text-muted-foreground font-normal">
                Chat Analytics
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
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
                  label: "Total Chats",
                  value: analytics.totalChats.toLocaleString(),
                  icon: MessageSquare,
                  color: COLORS.primary,
                },
                {
                  label: "Total Messages",
                  value: analytics.totalMessages.toLocaleString(),
                  icon: MessageSquare,
                  color: COLORS.secondary,
                },
                {
                  label: "Messages/Chat",
                  value: analytics.averageMessagesPerChat.toFixed(1),
                  icon: MessageSquare,
                  color: COLORS.success,
                },
                {
                  label: "Unique Users",
                  value: analytics.uniqueUsers.toLocaleString(),
                  icon: Users,
                  color: COLORS.warning,
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

            {/* Messages Over Time */}
            <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Message Activity</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS.primary }}
                    />
                    <span>Messages</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={analytics.messagesByDay}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
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
                        stopColor={COLORS.primary}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor={COLORS.primary}
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    opacity={0.1}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(17, 24, 39, 0.8)",
                      border: "none",
                      borderRadius: "8px",
                      padding: "12px",
                    }}
                    labelStyle={{ color: "#fff" }}
                    itemStyle={{ color: "#fff" }}
                    labelFormatter={(label) => {
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
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMessages)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Messages by User */}
              <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
                <h3 className="text-lg font-semibold">Top Active Users</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={analytics.messagesByUser.slice(0, 5)}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#374151"
                      opacity={0.1}
                    />
                    <XAxis
                      dataKey="user"
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(17, 24, 39, 0.8)",
                        border: "none",
                        borderRadius: "8px",
                        padding: "12px",
                      }}
                      labelStyle={{ color: "#fff" }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Bar
                      dataKey="count"
                      fill={COLORS.secondary}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Last Activity Card */}
              <div className="bg-card rounded-xl border shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Activity Status</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <div>
                        <span className="font-medium">Last Active</span>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {analytics.lastActive
                        ? formatDistance(
                            new Date(analytics.lastActive),
                            new Date(),
                            { addSuffix: true }
                          )
                        : "Never"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <div>
                        <span className="font-medium">Chat Engagement</span>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {analytics.averageMessagesPerChat.toFixed(1)} messages per
                      chat
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Chat Statistics Table */}
            <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">User Chat Statistics</h3>
                <Input
                  placeholder="Search users..."
                  className="w-64"
                  onChange={(e) => {
                    // Add search functionality if needed
                  }}
                />
              </div>
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 font-medium">User</th>
                      <th className="px-6 py-3 font-medium">Email</th>
                      <th className="px-6 py-3 font-medium">Total Messages</th>
                      <th className="px-6 py-3 font-medium">Total Chats</th>
                      <th className="px-6 py-3 font-medium">
                        Avg Messages/Chat
                      </th>
                      <th className="px-6 py-3 font-medium">Last Active</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted">
                    {analytics.messagesByUser.map((user, index) => {
                      const lastActiveDate = new Date(user.lastActive);
                      const daysSinceLastActive = Math.floor(
                        (new Date().getTime() - lastActiveDate.getTime()) /
                          (1000 * 60 * 60 * 24)
                      );

                      let statusBadge;
                      if (user.is_active) {
                        if (daysSinceLastActive <= 7) {
                          statusBadge = (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Active
                            </span>
                          );
                        } else if (daysSinceLastActive <= 30) {
                          statusBadge = (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              Regular
                            </span>
                          );
                        } else {
                          statusBadge = (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                              Inactive
                            </span>
                          );
                        }
                      } else {
                        statusBadge = (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            Disabled
                          </span>
                        );
                      }

                      return (
                        <tr
                          key={index}
                          className="bg-card hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                                <Image
                                  src={
                                    user.avatar_url ||
                                    "/images/default-avatar.png"
                                  }
                                  alt={user.user_name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <span className="font-medium">
                                {user.user_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {user.user_email}
                          </td>
                          <td className="px-6 py-4">
                            {user.count.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            {user.totalChats.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            {user.averageMessagesPerChat.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {formatDistance(lastActiveDate, new Date(), {
                              addSuffix: true,
                            })}
                          </td>
                          <td className="px-6 py-4">{statusBadge}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

function generateMessagesByDay(chatData: any[]) {
  const messagesByDay: { [key: string]: number } = {};

  chatData?.forEach((chat) => {
    chat.messages?.forEach((message: any) => {
      const date = new Date(message.timestamp).toLocaleDateString();
      messagesByDay[date] = (messagesByDay[date] || 0) + 1;
    });
  });

  return Object.entries(messagesByDay)
    .map(([date, count]) => ({
      date,
      count,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function generateMessagesByUser(chatData: any[]) {
  const userStats: {
    [key: string]: {
      messageCount: number;
      chatCount: number;
      lastActive: string;
      user_name: string;
      user_email: string;
      avatar_url: string;
      is_active: boolean;
    };
  } = {};

  chatData?.forEach((chat) => {
    const userId = chat.user_id;
    const userData = chat.user;

    if (!userStats[userId]) {
      userStats[userId] = {
        messageCount: 0,
        chatCount: 0,
        lastActive: chat.updated_at,
        user_name: userData?.user_name || `User ${userId.substring(0, 4)}`,
        user_email: userData?.user_email || "N/A",
        avatar_url: userData?.avatar_url || "",
        is_active: userData?.is_active || false,
      };
    }

    userStats[userId].messageCount += chat.messages?.length || 0;
    userStats[userId].chatCount += 1;
    userStats[userId].lastActive = new Date(
      Math.max(
        new Date(userStats[userId].lastActive).getTime(),
        new Date(chat.updated_at).getTime()
      )
    ).toISOString();
  });

  return Object.entries(userStats)
    .map(([user_id, stats]) => ({
      user_id,
      user_name: stats.user_name,
      user_email: stats.user_email,
      avatar_url: stats.avatar_url,
      count: stats.messageCount,
      totalChats: stats.chatCount,
      averageMessagesPerChat:
        stats.chatCount > 0 ? stats.messageCount / stats.chatCount : 0,
      lastActive: stats.lastActive,
      is_active: stats.is_active,
    }))
    .sort((a, b) => b.count - a.count);
}

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );
  const [selectedAnalyticsCharacter, setSelectedAnalyticsCharacter] =
    useState<Character | null>(null);
  const supabase = createBrowserSupabaseClient();
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      // First fetch all characters
      const { data: charactersData, error: charactersError } = await supabase
        .from("character_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (charactersError) throw charactersError;

      // Get unique creator IDs
      const creatorIds = Array.from(
        new Set(charactersData.map((char) => char.creator_id))
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
      const processedCharacters = (charactersData || []).map((character) => ({
        ...character,
        creator_name:
          creatorMap.get(character.creator_id)?.user_name || "Unknown User",
        creator_avatar:
          creatorMap.get(character.creator_id)?.avatar_url ||
          "/images/default-avatar.png",
        pending_approval: !character.is_public && character.requested_public,
      }));

      setCharacters(processedCharacters);
      toast("Characters Loaded", {
        description: `${processedCharacters.length} characters loaded successfully`,
      });
    } catch (error) {
      console.error("Error fetching characters:", error);
      toast.error("Error Loading Characters", {
        description: "Failed to load characters. Please refresh the page.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (character: Character) => {
    setSelectedCharacter(character);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (character: Character) => {
    setSelectedCharacter(character);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCharacter) return;

    try {
      const { error } = await supabase
        .from("character_profiles")
        .delete()
        .eq("id", selectedCharacter.id);

      if (error) throw error;

      setCharacters(characters.filter((c) => c.id !== selectedCharacter.id));
      toast("Character Deleted", {
        description: `${selectedCharacter.name} has been deleted successfully`,
      });
    } catch (error) {
      console.error("Error deleting character:", error);
      toast.error("Error Deleting Character", {
        description: "Failed to delete character. Please try again.",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedCharacter(null);
    }
  };

  const handleTogglePublic = async (character: Character) => {
    try {
      const { error } = await supabase
        .from("character_profiles")
        .update({ is_public: !character.is_public })
        .eq("id", character.id);

      if (error) throw error;

      setCharacters(
        characters.map((c) =>
          c.id === character.id ? { ...c, is_public: !c.is_public } : c
        )
      );

      toast("Character Updated", {
        description: `Character is now ${!character.is_public ? "public" : "private"}`,
      });
    } catch (error) {
      console.error("Error toggling character visibility:", error);
      toast.error("Error Updating Character", {
        description: "Failed to update character visibility. Please try again.",
      });
    }
  };

  const handleChatClick = (character: Character) => {
    router.push(`/chat/${character.id}`);
  };

  const handleApproveCharacter = async (character: Character) => {
    try {
      const { error } = await supabase
        .from("character_profiles")
        .update({
          is_public: true,
          pending_approval: false,
          requested_public: false,
        })
        .eq("id", character.id);

      if (error) throw error;

      setCharacters((prev) =>
        prev.map((c) =>
          c.id === character.id
            ? { ...c, is_public: true, pending_approval: false }
            : c
        )
      );

      toast("Character Approved", {
        description: `${character.name} has been approved and is now public`,
      });
    } catch (error) {
      console.error("Error approving character:", error);
      toast.error("Error Approving Character", {
        description: "Failed to approve character. Please try again.",
      });
    }
  };

  const handleRejectCharacter = async (character: Character) => {
    try {
      const { error } = await supabase
        .from("character_profiles")
        .update({
          is_public: false,
          pending_approval: false,
          requested_public: false,
        })
        .eq("id", character.id);

      if (error) throw error;

      setCharacters((prev) =>
        prev.map((c) =>
          c.id === character.id
            ? { ...c, is_public: false, pending_approval: false }
            : c
        )
      );

      toast("Character visibility request has been rejected");
    } catch (error) {
      console.error("Error rejecting character:", error);
      toast.error("Failed to reject character. Please try again.");
    }
  };

  const handleCardClick = (character: Character) => {
    setSelectedAnalyticsCharacter(character);
  };

  const filteredCharacters = characters.filter((character) => {
    if (filter === "pending") {
      return !character.is_public;
    } else if (filter === "approved") {
      return character.is_public;
    }
    return (
      character.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      character.content_source
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      character.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Characters</h1>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {["all", "pending", "approved"].map((filterType) => (
              <Button
                key={filterType}
                variant={filter === filterType ? "default" : "outline"}
                onClick={() => setFilter(filterType as typeof filter)}
                className={filter === filterType ? "bg-blue-500" : ""}
              >
                {filterType === "pending" && (
                  <Shield className="w-4 h-4 mr-2" />
                )}
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                {filterType === "pending" &&
                  characters.filter((c) => !c.is_public).length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded-full text-xs">
                      {characters.filter((c) => !c.is_public).length}
                    </span>
                  )}
              </Button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search characters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Character
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Character</DialogTitle>
              </DialogHeader>
              <CreateCharacterForm
                onSuccess={() => {
                  setIsCreateDialogOpen(false);
                  fetchCharacters();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {filteredCharacters.map((character) => (
            <motion.div
              key={character.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`bg-white dark:bg-zinc-900 rounded-lg shadow-md overflow-hidden border cursor-pointer
                ${
                  character.pending_approval
                    ? "border-yellow-400 dark:border-yellow-500"
                    : "border-gray-200 dark:border-gray-800"
                }`}
              onClick={() => handleCardClick(character)}
            >
              <div className="relative h-48">
                <Image
                  src={character.image_url || "/images/default-avatar.png"}
                  alt={character.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold">{character.name}</h3>
                    <span className="text-sm text-gray-500">
                      {character.content_source}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleChatClick(character)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" /> Chat
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleEditClick(character)}
                      >
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteClick(character)}
                      >
                        <Trash className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
                  {character.description}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="relative w-6 h-6 rounded-full overflow-hidden">
                      <Image
                        src={
                          character.creator_avatar ||
                          "/images/default-avatar.png"
                        }
                        alt={character.creator_name || "Creator"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-sm text-gray-500">
                      {character.creator_name}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Created{" "}
                    {formatDistance(
                      new Date(character.created_at),
                      new Date(),
                      {
                        addSuffix: true,
                      }
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  {character.pending_approval ? (
                    <div className="flex gap-2 w-full">
                      <Button
                        onClick={() => handleApproveCharacter(character)}
                        className="flex-1 bg-green-500 hover:bg-green-600"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleRejectCharacter(character)}
                        variant="outline"
                        className="flex-1"
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          character.is_public
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {character.is_public ? (
                          <div className="flex items-center gap-1">
                            <Unlock className="w-3 h-3" />
                            Public
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Private
                          </div>
                        )}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePublic(character)}
                        className="text-xs"
                      >
                        Make {character.is_public ? "Private" : "Public"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <CharacterAnalyticsDialog
        character={selectedAnalyticsCharacter}
        isOpen={!!selectedAnalyticsCharacter}
        onClose={() => setSelectedAnalyticsCharacter(null)}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Character</DialogTitle>
          </DialogHeader>
          {selectedCharacter && (
            <CreateCharacterForm
              initialData={selectedCharacter}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setSelectedCharacter(null);
                fetchCharacters();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              character and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface CreateCharacterFormProps {
  initialData?: Character;
  onSuccess: () => void;
}

const CreateCharacterForm = ({
  initialData,
  onSuccess,
}: CreateCharacterFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [characterImage, setCharacterImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(
    initialData?.image_url || ""
  );
  const [formData, setFormData] = useState({
    character_name: initialData?.name || "",
    character_description: initialData?.description || "",
    content_source: initialData?.content_source || "",
    content_types: initialData?.content_types || [""],
    fandom_url: initialData?.fandom_url || "",
    dialogues: initialData?.dialogue_examples || [""],
    is_public: initialData?.is_public ?? false,
    pending_approval: initialData?.pending_approval ?? false,
  });
  const { data: session } = useSession();
  const { toast } = useToast();

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCharacterImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create a character",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const formDataToSend = new FormData();
    formDataToSend.append("character_name", formData.character_name);
    formDataToSend.append(
      "character_description",
      formData.character_description
    );
    formDataToSend.append("content_source", formData.content_source);
    formDataToSend.append(
      "content_types",
      JSON.stringify(formData.content_types.filter(Boolean))
    );
    formDataToSend.append("fandom_url", formData.fandom_url);
    formDataToSend.append(
      "dialogues",
      JSON.stringify(formData.dialogues.filter(Boolean))
    );
    formDataToSend.append("is_public", formData.is_public.toString());
    formDataToSend.append(
      "pending_approval",
      formData.pending_approval.toString()
    );

    if (characterImage) {
      formDataToSend.append("character_image", characterImage);
    }

    try {
      const url = initialData
        ? `/api/characters/${initialData.id}`
        : "/api/create-character";
      const method = initialData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      toast({
        title: "Success",
        description: initialData
          ? "Character updated successfully"
          : "Character created successfully. Waiting for admin approval to make it public.",
      });
      onSuccess();
    } catch (error) {
      console.error("Error saving character:", error);
      toast({
        title: "Error",
        description: "Failed to save character. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-32 h-32">
            <Image
              src={imagePreview || "/images/default-avatar.png"}
              alt="Character preview"
              fill
              className="rounded-full object-cover"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("character-image")?.click()}
          >
            Upload Image
          </Button>
          <input
            id="character-image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Character Name
          </label>
          <Input
            value={formData.character_name}
            onChange={(e) =>
              setFormData({ ...formData, character_name: e.target.value })
            }
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={formData.character_description}
            onChange={(e) =>
              setFormData({
                ...formData,
                character_description: e.target.value,
              })
            }
            className="w-full p-2 border rounded-md"
            rows={4}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Content Source
          </label>
          <Input
            value={formData.content_source}
            onChange={(e) =>
              setFormData({ ...formData, content_source: e.target.value })
            }
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Content Types
          </label>
          {formData.content_types.map((type, index) => (
            <Input
              key={index}
              value={type}
              onChange={(e) => {
                const newTypes = [...formData.content_types];
                newTypes[index] = e.target.value;
                setFormData({ ...formData, content_types: newTypes });
              }}
              className="mb-2"
            />
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setFormData({
                ...formData,
                content_types: [...formData.content_types, ""],
              })
            }
          >
            Add Content Type
          </Button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Fandom URL</label>
          <Input
            type="url"
            value={formData.fandom_url}
            onChange={(e) =>
              setFormData({ ...formData, fandom_url: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Dialogue Examples
          </label>
          {formData.dialogues.map((dialogue, index) => (
            <Input
              key={index}
              value={dialogue}
              onChange={(e) => {
                const newDialogues = [...formData.dialogues];
                newDialogues[index] = e.target.value;
                setFormData({ ...formData, dialogues: newDialogues });
              }}
              className="mb-2"
            />
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setFormData({
                ...formData,
                dialogues: [...formData.dialogues, ""],
              })
            }
          >
            Add Dialogue
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.is_public}
            onChange={(e) =>
              setFormData({
                ...formData,
                is_public: e.target.checked,
                pending_approval: e.target.checked,
              })
            }
            className="rounded border-gray-300"
            disabled={!initialData && !session?.user?.id}
          />
          <label className="flex items-center gap-2">
            Request to make this character public
            <Info className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">
              (Requires admin approval)
            </span>
          </label>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {initialData ? "Updating..." : "Creating..."}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            {initialData ? "Update Character" : "Create Character"}
          </>
        )}
      </Button>
    </form>
  );
};
