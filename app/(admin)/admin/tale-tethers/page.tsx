"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  UserPlus, 
  Users, 
  MessageSquare, 
  UserCheck, 
  UserX, 
  RefreshCw,
  Search,
  Filter,
  Download,
  BarChart2,
  PieChart as PieChartIcon,
  Activity
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { format } from "date-fns";
import Loading from "./loading";  

// Define interfaces for friendship data
interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  updated_at: string;
  user_name: string;
  friend_name: string;
  message_count: number;
}

interface FriendMessage {
  id: string;
  friendship_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name: string;
}

interface FriendshipStats {
  totalFriendships: number;
  activeFriendships: number;
  pendingRequests: number;
  totalMessages: number;
  friendshipsOverTime: { date: string; count: number }[];
  messagesOverTime: { date: string; count: number }[];
  topConnectors: { user_id: string; user_name: string; friendship_count: number }[];
  mostActiveConversations: { 
    friendship_id: string; 
    user_name: string; 
    friend_name: string; 
    message_count: number 
  }[];
}

// Define chart colors
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe"];

export default function TaleTethersAdmin() {
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [messages, setMessages] = useState<FriendMessage[]>([]);
  const [stats, setStats] = useState<FriendshipStats>({
    totalFriendships: 0,
    activeFriendships: 0,
    pendingRequests: 0,
    totalMessages: 0,
    friendshipsOverTime: [],
    messagesOverTime: [],
    topConnectors: [],
    mostActiveConversations: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("overview");


  useEffect(() => {
    fetchFriendshipData();
  }, []);

  const fetchFriendshipData = async () => {
    try {
      setIsLoading(true);
      const supabase = createBrowserSupabaseClient();

      // Fetch users first
      const { data: userData, error: userError } = await supabase
        .from("user")
        .select("user_id, user_name, avatar_url");

      if (userError) throw userError;

      // Create a map of user IDs to user data for quick lookup
      const userMap = new Map();
      userData?.forEach(user => {
        userMap.set(user.user_id, {
          name: user.user_name || "Unknown User",
          avatar: user.avatar_url
        });
      });

      // Fetch friendships
      const { data: friendshipsData, error: friendshipsError } = await supabase
        .from("friendships")
        .select("*");

      if (friendshipsError) throw friendshipsError;

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("friend_messages")
        .select("*");

      if (messagesError) throw messagesError;

      // Process friendship data with user info from the map
      const processedFriendships = friendshipsData?.map((friendship) => {
        const messageCount = messagesData?.filter(
          (message) => message.friendship_id === friendship.id
        ).length || 0;

        const userData = userMap.get(friendship.user_id) || { name: "Unknown User", avatar: "" };
        const friendData = userMap.get(friendship.friend_id) || { name: "Unknown User", avatar: "" };

        return {
          id: friendship.id,
          user_id: friendship.user_id,
          friend_id: friendship.friend_id,
          status: friendship.status,
          created_at: friendship.created_at,
          updated_at: friendship.updated_at,
          user_name: userData.name,
          friend_name: friendData.name,
          message_count: messageCount,
        };
      }) || [];

      setFriendships(processedFriendships);

      // Process message data with user info from the map
      const processedMessages = messagesData?.map((message) => {
        const senderData = userMap.get(message.sender_id) || { name: "Unknown User", avatar: "" };
        
        return {
          id: message.id,
          friendship_id: message.friendship_id,
          sender_id: message.sender_id,
          content: message.content,
          created_at: message.created_at,
          sender_name: senderData.name,
        };
      }) || [];

      setMessages(processedMessages);

      // Calculate stats
      const now = new Date();
      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - 7);

      // Friendships over time for the last week
      const friendshipsOverTime = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = format(date, "MMM dd");
        const count = processedFriendships.filter((friendship) => {
          const friendshipDate = new Date(friendship.created_at);
          return (
            friendshipDate.getDate() === date.getDate() &&
            friendshipDate.getMonth() === date.getMonth() &&
            friendshipDate.getFullYear() === date.getFullYear()
          );
        }).length;
        return { date: dateStr, count };
      }).reverse();

      // Messages over time for the last week
      const messagesOverTime = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = format(date, "MMM dd");
        const count = processedMessages.filter((message) => {
          const messageDate = new Date(message.created_at);
          return (
            messageDate.getDate() === date.getDate() &&
            messageDate.getMonth() === date.getMonth() &&
            messageDate.getFullYear() === date.getFullYear()
          );
        }).length;
        return { date: dateStr, count };
      }).reverse();

      // Top connectors (users with most friendships)
      const userFriendshipCounts: Record<string, { user_id: string; user_name: string; count: number }> = {};
      processedFriendships.forEach((friendship) => {
        // Count for initiator
        if (!userFriendshipCounts[friendship.user_id]) {
          userFriendshipCounts[friendship.user_id] = {
            user_id: friendship.user_id,
            user_name: friendship.user_name,
            count: 0,
          };
        }
        userFriendshipCounts[friendship.user_id].count += 1;

        // Count for recipient
        if (!userFriendshipCounts[friendship.friend_id]) {
          userFriendshipCounts[friendship.friend_id] = {
            user_id: friendship.friend_id,
            user_name: friendship.friend_name,
            count: 0,
          };
        }
        userFriendshipCounts[friendship.friend_id].count += 1;
      });

      const topConnectors = Object.values(userFriendshipCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((user) => ({
          user_id: user.user_id,
          user_name: user.user_name,
          friendship_count: user.count,
        }));

      // Most active conversations
      const mostActiveConversations = [...processedFriendships]
        .sort((a, b) => b.message_count - a.message_count)
        .slice(0, 5)
        .map((friendship) => ({
          friendship_id: friendship.id,
          user_name: friendship.user_name,
          friend_name: friendship.friend_name,
          message_count: friendship.message_count,
        }));

      setStats({
        totalFriendships: processedFriendships.length,
        activeFriendships: processedFriendships.filter((f) => f.status === "accepted").length,
        pendingRequests: processedFriendships.filter((f) => f.status === "pending").length,
        totalMessages: processedMessages.length,
        friendshipsOverTime,
        messagesOverTime,
        topConnectors,
        mostActiveConversations,
      });
    } catch (error) {
      console.error("Error fetching friendship data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter friendships based on search query and status filter
  const filteredFriendships = friendships.filter((friendship) => {
    const matchesSearch = searchQuery
      ? friendship.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friendship.friend_name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesStatus = statusFilter !== "all" ? friendship.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  return (isLoading ? (
    <Loading />
  ) : (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Tale Tethers</h1>
        <p className="text-muted-foreground">
          Manage and analyze user friendships and social connections
        </p>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="friendships">Friendships</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Friendships</CardTitle>
                <Users className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalFriendships.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Friendships</CardTitle>
                <UserCheck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeFriendships.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <UserPlus className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingRequests.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Friendship Growth</CardTitle>
                <CardDescription>New friendships per day over the last week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.friendshipsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="New Friendships" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Message Activity</CardTitle>
                <CardDescription>Messages sent per day over the last week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.messagesOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="Messages"
                        stroke="#82ca9d"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Connectors and Most Active Conversations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Connectors</CardTitle>
                <CardDescription>Users with most friendship connections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topConnectors.map((user, index) => (
                    <div key={user.user_id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="flex-none bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">{user.user_name}</h4>
                        <div className="text-sm text-muted-foreground mt-1">
                          {user.friendship_count} connections
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Active Conversations</CardTitle>
                <CardDescription>Friendships with most message exchanges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.mostActiveConversations.map((conversation, index) => (
                    <div key={conversation.friendship_id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="flex-none bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">
                          {conversation.user_name} & {conversation.friend_name}
                        </h4>
                        <div className="text-sm text-muted-foreground mt-1">
                          {conversation.message_count} messages
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="friendships" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Friendship Management</CardTitle>
              <CardDescription>View and manage user friendships</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-sm"
                    />
                    <Button variant="outline" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="border rounded p-2 text-sm"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="accepted">Accepted</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <Button variant="outline" size="icon" onClick={fetchFriendshipData}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-medium mb-4">Friendship List</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Initiator</th>
                          <th className="text-left p-2">Recipient</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Messages</th>
                          <th className="text-left p-2">Created</th>
                          <th className="text-left p-2">Last Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFriendships.slice(0, 10).map((friendship) => (
                          <tr key={friendship.id} className="border-b">
                            <td className="p-2">{friendship.user_name}</td>
                            <td className="p-2">{friendship.friend_name}</td>
                            <td className="p-2">
                              <Badge
                                variant={
                                  friendship.status === "accepted"
                                    ? "default"
                                    : friendship.status === "pending"
                                    ? "outline"
                                    : "destructive"
                                }
                                className="capitalize"
                              >
                                {friendship.status}
                              </Badge>
                            </td>
                            <td className="p-2">{friendship.message_count}</td>
                            <td className="p-2">
                              {format(new Date(friendship.created_at), "MMM dd, yyyy")}
                            </td>
                            <td className="p-2">
                              {format(new Date(friendship.updated_at || friendship.created_at), "MMM dd, yyyy")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredFriendships.length > 10 && (
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                      Showing 10 of {filteredFriendships.length} friendships
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Message Analytics</CardTitle>
              <CardDescription>Analyze message patterns and activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-md p-4">
                    <h3 className="text-lg font-medium mb-4">Message Volume by Hour</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={Array.from({ length: 24 }, (_, hour) => {
                            const count = messages.filter((message) => {
                              const messageDate = new Date(message.created_at);
                              return messageDate.getHours() === hour;
                            }).length;
                            return { hour: `${hour}:00`, count };
                          })}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="hour" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" name="Messages" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="border rounded-md p-4">
                    <h3 className="text-lg font-medium mb-4">Message Length Distribution</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "Short (<20 chars)",
                                value: messages.filter((m) => m.content.length < 20).length,
                              },
                              {
                                name: "Medium (20-100 chars)",
                                value: messages.filter(
                                  (m) => m.content.length >= 20 && m.content.length <= 100
                                ).length,
                              },
                              {
                                name: "Long (>100 chars)",
                                value: messages.filter((m) => m.content.length > 100).length,
                              },
                              ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {COLORS.map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-medium mb-4">Recent Messages</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Sender</th>
                          <th className="text-left p-2">Message</th>
                          <th className="text-left p-2">Sent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {messages.slice(0, 10).map((message) => (
                          <tr key={message.id} className="border-b">
                            <td className="p-2">{message.sender_name}</td>
                            <td className="p-2">
                              <div className="max-w-md truncate">{message.content}</div>
                            </td>
                            <td className="p-2">
                              {format(new Date(message.created_at), "MMM dd, yyyy HH:mm")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {messages.length > 10 && (
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                      Showing 10 of {messages.length} messages
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
  );
} 