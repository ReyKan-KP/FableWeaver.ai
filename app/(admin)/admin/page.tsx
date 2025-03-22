"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  BookOpen,
  MessageSquare,
  Bot,
  Activity,
  Layers,
  Search,
  UserPlus,
  ThumbsUp,
  MessageCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { StatsCard } from "./_components/stats-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Globe,
  Monitor,
  MousePointer,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { PieChart, Pie, Cell, Legend } from "recharts";
import AdminDashboardLoading from "./loading";
import { toast } from "sonner";

interface DashboardStats {
  totalUsers: number;
  totalNovels: number;
  totalCharacters: number;
  totalChapters: number;
  activeGroups: number;
  dailyActiveUsers: number;
  totalThreads: number;
  totalThreadComments: number;
  totalThreadReactions: number;
  totalContentInteractions: number;
  avgContentRating: number;
  totalFriendships: number;
  totalFriendMessages: number;
  pendingFriendRequests: number;
  userGrowth: Array<{
    date: string;
    count: number;
    growth: number;
  }>;
  contentCreation: Array<{
    date: string;
    novels: number;
    chapters: number;
  }>;
  activityMetrics: Array<{
    date: string;
    messages: number;
    interactions: number;
  }>;
  threadMetrics: Array<{
    date: string;
    threads: number;
    comments: number;
    reactions: number;
  }>;
  socialMetrics: Array<{
    date: string;
    friendships: number;
    messages: number;
    requests: number;
  }>;
  monthlyGrowth: {
    users: number;
    novels: number;
    characters: number;
    chapters: number;
    groups: number;
    threads: number;
    friendships: number;
  };
  analytics: {
    pageViews: number;
    visitors: number;
    bounceRate: number;
    avgDuration: number;
    topPages: Array<{
      path: string;
      views: number;
      visitors: number;
    }>;
    devices: Array<{
      device: string;
      sessions: number;
      percentage: number;
    }>;
    countries: Array<{
      country: string;
      visitors: number;
      percentage: number;
    }>;
    traffic: Array<{
      source: string;
      visitors: number;
      conversion: number;
    }>;
  };
}

interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

interface Novel {
  id: number;
  title: string;
  authorId: number;
  createdAt: string;
}

interface Character {
  id: number;
  name: string;
  novelId: number;
  createdAt: string;
}

interface Chapter {
  id: number;
  novelId: number;
  title: string;
  createdAt: string;
}

interface Group {
  id: number;
  name: string;
  createdAt: string;
}

// Define chart colors
const CHART_COLORS = {
  blue: "#3b82f6",
  violet: "#8b5cf6",
  teal: "#14b8a6",
  emerald: "#10b981",
  orange: "#f97316",
  purple: "#a855f7",
  indigo: "#6366f1",
  pink: "#ec4899",
  red: "#ef4444",
  green: "#22c55e",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalNovels: 0,
    totalCharacters: 0,
    totalChapters: 0,
    activeGroups: 0,
    dailyActiveUsers: 0,
    totalThreads: 0,
    totalThreadComments: 0,
    totalThreadReactions: 0,
    totalContentInteractions: 0,
    avgContentRating: 0,
    totalFriendships: 0,
    totalFriendMessages: 0,
    pendingFriendRequests: 0,
    userGrowth: [],
    contentCreation: [],
    activityMetrics: [],
    threadMetrics: [],
    socialMetrics: [],
    monthlyGrowth: {
      users: 0,
      novels: 0,
      characters: 0,
      chapters: 0,
      groups: 0,
      threads: 0,
      friendships: 0,
    },
    analytics: {
      pageViews: 0,
      visitors: 0,
      bounceRate: 0,
      avgDuration: 0,
      topPages: [],
      devices: [],
      countries: [],
      traffic: [],
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const supabase = createBrowserSupabaseClient();

      // Fetch existing data
      const [
        { data: users },
        { data: novels },
        { data: characters },
        { data: chapters },
        { data: groups },
        { data: userTimeSeries },
        { data: novelTimeSeries },
        { data: chapterTimeSeries },
        { data: messageTimeSeries },
        // New data for Thread Tapestry, Lore Lens, and Tale Tethers
        { data: threads },
        { data: threadComments },
        { data: threadReactions },
        { data: contentInteractions },
        { data: friendships },
        { data: friendRequests },
        { data: friendMessages },
        { data: threadTimeSeries },
        { data: friendshipTimeSeries },
        { data: friendMessageTimeSeries },
      ] = await Promise.all([
        supabase.from("user").select("*"),
        supabase.from("novels").select("*"),
        supabase.from("character_profiles").select("*"),
        supabase.from("chapters").select("*"),
        supabase.from("group_chat_history").select("*"),
        supabase.from("user").select("created_at"),
        supabase.from("novels").select("created_at"),
        supabase.from("chapters").select("created_at"),
        supabase.from("chat_history").select("created_at"),
        // New queries
        supabase.from("threads").select("*"),
        supabase.from("comments").select("*"),
        supabase.from("reactions").select("*"),
        supabase.from("user_content_interactions").select("*"),
        supabase.from("friendships").select("*").eq("status", "accepted"),
        supabase.from("friendships").select("*").eq("status", "pending"),
        supabase.from("friend_messages").select("*"),
        supabase.from("threads").select("created_at"),
        supabase.from("friendships").select("created_at"),
        supabase.from("friend_messages").select("created_at"),
      ]);

      // Calculate average content rating
      const avgRating = contentInteractions?.reduce((acc, interaction) => {
        return acc + (interaction.rating || 0);
      }, 0) / (contentInteractions?.filter(i => i.rating).length || 1);

      // Process time series data for threads
      const threadMetricsData = processThreadData(
        threadTimeSeries || [],
        threadComments || [],
        threadReactions || []
      );

      // Process time series data for social features
      const socialMetricsData = processSocialData(
        friendshipTimeSeries || [],
        friendMessageTimeSeries || [],
        friendRequests || []
      );

      // Calculate monthly growth rates
      const calculateGrowthRate = (data: any[]) => {
        if (data.length < 2) return 0;
        const oldestCount = 1; // First user/content
        const newestCount = data.length;
        return ((newestCount - oldestCount) / oldestCount) * 100;
      };

      const userGrowthRate = calculateGrowthRate(userTimeSeries || []);
      const novelGrowthRate = calculateGrowthRate(novelTimeSeries || []);
      const characterGrowthRate = calculateGrowthRate(characters || []);
      const chapterGrowthRate = calculateGrowthRate(chapterTimeSeries || []);
      const groupGrowthRate = calculateGrowthRate(groups || []);
      const threadGrowthRate = calculateGrowthRate(threadTimeSeries || []);
      const friendshipGrowthRate = calculateGrowthRate(friendshipTimeSeries || []);

      // Process time series data
      const userGrowthData = processTimeSeriesData(userTimeSeries || []);
      const contentCreationData = processContentData(
        novelTimeSeries || [],
        chapterTimeSeries || []
      );
      const activityData = processActivityData(messageTimeSeries || []);

      // Set stats
      setStats({
        totalUsers: users?.length || 0,
        totalNovels: novels?.length || 0,
        totalCharacters: characters?.length || 0,
        totalChapters: chapters?.length || 0,
        activeGroups: groups?.filter((g) => g.is_active)?.length || 0,
        dailyActiveUsers: Math.floor(Math.random() * 100) + 50, // Placeholder
        totalThreads: threads?.length || 0,
        totalThreadComments: threadComments?.length || 0,
        totalThreadReactions: threadReactions?.length || 0,
        totalContentInteractions: contentInteractions?.length || 0,
        avgContentRating: parseFloat(avgRating.toFixed(1)),
        totalFriendships: friendships?.length || 0,
        totalFriendMessages: friendMessages?.length || 0,
        pendingFriendRequests: friendRequests?.length || 0,
        userGrowth: userGrowthData,
        contentCreation: contentCreationData,
        activityMetrics: activityData,
        threadMetrics: threadMetricsData,
        socialMetrics: socialMetricsData,
        monthlyGrowth: {
          users: userGrowthRate,
          novels: novelGrowthRate,
          characters: characterGrowthRate,
          chapters: chapterGrowthRate,
          groups: groupGrowthRate,
          threads: threadGrowthRate,
          friendships: friendshipGrowthRate,
        },
        analytics: {
          pageViews: 12500,
          visitors: 4300,
          bounceRate: 42.5,
          avgDuration: 3.2,
          topPages: [
            {
              path: "/",
              views: 3200,
              visitors: 2100,
            },
            {
              path: "/story-weaver",
              views: 1800,
              visitors: 1200,
            },
            {
              path: "/character-confluence",
              views: 1500,
              visitors: 900,
            },
            {
              path: "/thread-tapestry",
              views: 1200,
              visitors: 800,
            },
            {
              path: "/lore-lens",
              views: 1000,
              visitors: 700,
            },
          ],
          devices: [
            {
              device: "Desktop",
              sessions: 2800,
              percentage: 65,
            },
            {
              device: "Mobile",
              sessions: 1200,
              percentage: 28,
            },
            {
              device: "Tablet",
              sessions: 300,
              percentage: 7,
            },
          ],
          countries: [
            {
              country: "United States",
              visitors: 1800,
              percentage: 42,
            },
            {
              country: "United Kingdom",
              visitors: 720,
              percentage: 17,
            },
            {
              country: "Canada",
              visitors: 430,
              percentage: 10,
            },
            {
              country: "Australia",
              visitors: 340,
              percentage: 8,
            },
            {
              country: "Germany",
              visitors: 260,
              percentage: 6,
            },
          ],
          traffic: [
            {
              source: "Direct",
              visitors: 1720,
              conversion: 3.2,
            },
            {
              source: "Organic Search",
              visitors: 1290,
              conversion: 2.8,
            },
            {
              source: "Social Media",
              visitors: 860,
              conversion: 4.1,
            },
            {
              source: "Referral",
              visitors: 430,
              conversion: 5.2,
            },
          ],
        },
      });
      
      toast.success("Dashboard data loaded", {
        description: `Loaded data for ${users?.length || 0} users, ${novels?.length || 0} novels, and ${characters?.length || 0} characters`,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load dashboard data", {
        description: "Please try refreshing the page",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <AdminDashboardLoading />;
  }

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground">
          Monitor your platform&apos;s key metrics and performance indicators
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          trend={stats.monthlyGrowth.users > 0 ? "up" : "down"}
          trendValue={`${Math.abs(stats.monthlyGrowth.users).toFixed(1)}%`}
          color={CHART_COLORS.blue}
          icon={Users}
        />
        <StatsCard
          title="Total Novels"
          value={stats.totalNovels}
          trend={stats.monthlyGrowth.novels > 0 ? "up" : "down"}
          trendValue={`${Math.abs(stats.monthlyGrowth.novels).toFixed(1)}%`}
          color={CHART_COLORS.violet}
          icon={BookOpen}
        />
        <StatsCard
          title="Total Characters"
          value={stats.totalCharacters}
          trend={stats.monthlyGrowth.characters > 0 ? "up" : "down"}
          trendValue={`${Math.abs(stats.monthlyGrowth.characters).toFixed(1)}%`}
          color={CHART_COLORS.teal}
          icon={Bot}
        />
        <StatsCard
          title="Total Chapters"
          value={stats.totalChapters}
          trend={stats.monthlyGrowth.chapters > 0 ? "up" : "down"}
          trendValue={`${Math.abs(stats.monthlyGrowth.chapters).toFixed(1)}%`}
          color={CHART_COLORS.emerald}
          icon={MessageSquare}
        />
        <StatsCard
          title="Active Groups"
          value={stats.activeGroups}
          trend={stats.monthlyGrowth.groups > 0 ? "up" : "down"}
          trendValue={`${Math.abs(stats.monthlyGrowth.groups).toFixed(1)}%`}
          color={CHART_COLORS.orange}
          icon={Activity}
        />
        {/* <StatsCard
          title="Daily Active Users"
          value={stats.dailyActiveUsers}
          trend={stats.monthlyGrowth.users > 0 ? "up" : "down"}
          trendValue={`${Math.abs(stats.monthlyGrowth.users).toFixed(1)}%`}
          color={CHART_COLORS.purple}
          icon={Users}
        /> */}
      </div>

      {/* New stats row for Thread Tapestry, Lore Lens, and Tale Tethers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Threads"
          value={stats.totalThreads}
          trend={stats.monthlyGrowth.threads > 0 ? "up" : "down"}
          trendValue={`${Math.abs(stats.monthlyGrowth.threads).toFixed(1)}%`}
          color={CHART_COLORS.indigo}
          icon={Layers}
        />
        <StatsCard
          title="Thread Interactions"
          value={(stats.totalThreadComments || 0) + (stats.totalThreadReactions || 0)}
          trend="up"
          trendValue="10.5%"
          color={CHART_COLORS.pink}
          icon={MessageCircle}
        />
        <StatsCard
          title="Content Interactions"
          value={stats.totalContentInteractions}
          trend="up"
          trendValue="8.3%"
          color={CHART_COLORS.teal}
          icon={Search}
        />
        <StatsCard
          title="Friendships"
          value={stats.totalFriendships}
          trend={stats.monthlyGrowth.friendships > 0 ? "up" : "down"}
          trendValue={`${Math.abs(stats.monthlyGrowth.friendships).toFixed(1)}%`}
          color={CHART_COLORS.green}
          icon={UserPlus}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Growth
            </CardTitle>
            <CardDescription>User acquisition trend over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={stats.userGrowth}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="date"
                    className="text-sm"
                    tick={{ fill: "currentColor" }}
                  />
                  <YAxis className="text-sm" tick={{ fill: "currentColor" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={CHART_COLORS.blue}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="growth"
                    stroke={CHART_COLORS.emerald}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Overview
            </CardTitle>
            <CardDescription>Recent platform activity metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.activityMetrics?.slice(-7)} // Show last 7 days
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="date"
                    className="text-sm"
                    tick={{ fill: "currentColor" }}
                  />
                  <YAxis className="text-sm" tick={{ fill: "currentColor" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Bar
                    dataKey="messages"
                    fill={CHART_COLORS.violet}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="interactions"
                    fill={CHART_COLORS.teal}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Creation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Content Creation Trends
          </CardTitle>
          <CardDescription>
            Overview of novels and chapters creation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats.contentCreation}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-sm"
                  tick={{ fill: "currentColor" }}
                />
                <YAxis className="text-sm" tick={{ fill: "currentColor" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="novels"
                  stackId="1"
                  stroke={CHART_COLORS.orange}
                  fill={CHART_COLORS.orange}
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="chapters"
                  stackId="1"
                  stroke={CHART_COLORS.purple}
                  fill={CHART_COLORS.purple}
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* New charts for Thread Tapestry and Tale Tethers */}
      <Card>
        <CardHeader>
          <CardTitle>Thread Activity</CardTitle>
          <CardDescription>
            Threads, comments, and reactions over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats.threadMetrics}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="threads"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                />
                <Area
                  type="monotone"
                  dataKey="comments"
                  stackId="1"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                />
                <Area
                  type="monotone"
                  dataKey="reactions"
                  stackId="1"
                  stroke="#ffc658"
                  fill="#ffc658"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Activity</CardTitle>
          <CardDescription>
            Friendships, messages, and requests over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats.socialMetrics}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="friendships"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stackId="1"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stackId="1"
                  stroke="#ffc658"
                  fill="#ffc658"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Add Legend to all charts */}
      <Legend
        wrapperStyle={{
          paddingTop: "20px",
        }}
      />
    </div>
  );
}

// Updated helper functions for processing all-time data
function processTimeSeriesData(data: any[]) {
  const timelineData = data.reduce((acc: any, item) => {
    const date = new Date(item.created_at).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = { count: 0, total: 0 };
    }
    acc[date].count++;
    acc[date].total = (acc[date].total || 0) + 1;
    return acc;
  }, {});

  let runningTotal = 0;
  return Object.entries(timelineData).map(([date, values]: [string, any]) => {
    runningTotal += values.count;
    return {
      date,
      count: runningTotal,
      growth: values.count,
    };
  });
}

function processContentData(novelData: any[], chapterData: any[]) {
  // Create a map of dates for both novels and chapters
  const timelineData = new Map();

  // Process novels
  novelData.forEach((novel) => {
    const date = new Date(novel.created_at).toLocaleDateString();
    if (!timelineData.has(date)) {
      timelineData.set(date, { novels: 0, chapters: 0 });
    }
    const data = timelineData.get(date);
    data.novels++;
    timelineData.set(date, data);
  });

  // Process chapters
  chapterData.forEach((chapter) => {
    const date = new Date(chapter.created_at).toLocaleDateString();
    if (!timelineData.has(date)) {
      timelineData.set(date, { novels: 0, chapters: 0 });
    }
    const data = timelineData.get(date);
    data.chapters++;
    timelineData.set(date, data);
  });

  // Convert to array and sort by date
  const sortedDates = Array.from(timelineData.entries()).sort(
    (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()
  );

  // Calculate running totals
  let novelTotal = 0;
  let chapterTotal = 0;

  return sortedDates.map(([date, counts]) => {
    novelTotal += counts.novels;
    chapterTotal += counts.chapters;
    return {
      date,
      novels: novelTotal,
      chapters: chapterTotal,
    };
  });
}

function processActivityData(data: any[]) {
  const timelineData = data.reduce((acc: any, item) => {
    const date = new Date(item.created_at).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = { messages: 0, interactions: 0 };
    }
    const messageCount = Array.isArray(item.messages)
      ? item.messages.length
      : 0;
    acc[date].messages += messageCount;
    acc[date].interactions += messageCount * 2;
    return acc;
  }, {});

  let messageTotal = 0;
  let interactionTotal = 0;
  return Object.entries(timelineData).map(([date, counts]: [string, any]) => {
    messageTotal += counts.messages;
    interactionTotal += counts.interactions;
    return {
      date,
      messages: messageTotal,
      interactions: interactionTotal,
    };
  });
}

// New function to process thread data
function processThreadData(
  threadData: any[],
  commentData: any[],
  reactionData: any[]
) {
  const dateMap: Record<
    string,
    { date: string; threads: number; comments: number; reactions: number }
  > = {};

  // Process thread creation dates
  threadData.forEach((thread) => {
    const date = new Date(thread.created_at);
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    if (!dateMap[dateStr]) {
      dateMap[dateStr] = {
        date: dateStr,
        threads: 0,
        comments: 0,
        reactions: 0,
      };
    }

    dateMap[dateStr].threads += 1;
  });

  // Process comment creation dates
  commentData.forEach((comment) => {
    const date = new Date(comment.created_at);
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    if (!dateMap[dateStr]) {
      dateMap[dateStr] = {
        date: dateStr,
        threads: 0,
        comments: 0,
        reactions: 0,
      };
    }

    dateMap[dateStr].comments += 1;
  });

  // Process reaction creation dates
  reactionData.forEach((reaction) => {
    const date = new Date(reaction.created_at);
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    if (!dateMap[dateStr]) {
      dateMap[dateStr] = {
        date: dateStr,
        threads: 0,
        comments: 0,
        reactions: 0,
      };
    }

    dateMap[dateStr].reactions += 1;
  });

  // Convert to array and sort by date
  return Object.values(dateMap).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

// New function to process social data
function processSocialData(
  friendshipData: any[],
  messageData: any[],
  requestData: any[]
) {
  const dateMap: Record<
    string,
    { date: string; friendships: number; messages: number; requests: number }
  > = {};

  // Process friendship creation dates
  friendshipData.forEach((friendship) => {
    const date = new Date(friendship.created_at);
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    if (!dateMap[dateStr]) {
      dateMap[dateStr] = {
        date: dateStr,
        friendships: 0,
        messages: 0,
        requests: 0,
      };
    }

    dateMap[dateStr].friendships += 1;
  });

  // Process message creation dates
  messageData.forEach((message) => {
    const date = new Date(message.created_at);
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    if (!dateMap[dateStr]) {
      dateMap[dateStr] = {
        date: dateStr,
        friendships: 0,
        messages: 0,
        requests: 0,
      };
    }

    dateMap[dateStr].messages += 1;
  });

  // Process request creation dates
  requestData.forEach((request) => {
    const date = new Date(request.created_at);
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    if (!dateMap[dateStr]) {
      dateMap[dateStr] = {
        date: dateStr,
        friendships: 0,
        messages: 0,
        requests: 0,
      };
    }

    dateMap[dateStr].requests += 1;
  });

  // Convert to array and sort by date
  return Object.values(dateMap).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}
