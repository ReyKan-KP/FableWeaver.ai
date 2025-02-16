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
import { Users, BookOpen, MessageSquare, Bot, Activity } from "lucide-react";
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

interface DashboardStats {
  totalUsers: number;
  totalNovels: number;
  totalCharacters: number;
  totalChapters: number;
  activeGroups: number;
  dailyActiveUsers: number;
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
  monthlyGrowth: {
    users: number;
    novels: number;
    characters: number;
    chapters: number;
    groups: number;
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

// Add these color constants at the top of the file
const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  // Updated custom colors for a more cohesive palette
  blue: "#3b82f6", // Bright blue
  indigo: "#6366f1", // Indigo
  violet: "#8b5cf6", // Violet
  purple: "#a855f7", // Purple
  teal: "#14b8a6", // Teal
  emerald: "#10b981", // Emerald
  orange: "#f97316", // Orange
  red: "#ef4444", // Red
};

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all data with time series
        const [
          { data: userData, count: userCount },
          { data: novelData, count: novelCount },
          { data: characterData, count: characterCount },
          { data: chapterData, count: chapterCount },
          { data: groupData, count: groupCount },
          { data: activeUserData, count: dailyActiveCount },
        ] = await Promise.all([
          supabase
            .from("user")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: true }),
          supabase
            .from("novels")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: true }),
          supabase
            .from("character_profiles")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: true }),
          supabase
            .from("chapters")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: true }),
          supabase
            .from("group_chat_history")
            .select("*", { count: "exact" })
            .eq("is_active", true)
            .order("created_at", { ascending: true }),
          supabase
            .from("user")
            .select("*", { count: "exact" })
            .eq("is_active", true),
        ]);

        // Process time series data
        const userGrowth = processTimeSeriesData(userData || []);
        const contentCreation = processContentData(
          novelData || [],
          chapterData || []
        );
        const activityMetrics = processActivityData(groupData || []);

        // Calculate growth rates
        const calculateGrowthRate = (data: any[]) => {
          if (data.length < 2) return 0;
          const oldestCount = 1; // First user/content
          const newestCount = data.length;
          return ((newestCount - oldestCount) / oldestCount) * 100;
        };

        const monthlyGrowth = {
          users: calculateGrowthRate(userData || []),
          novels: calculateGrowthRate(novelData || []),
          characters: calculateGrowthRate(characterData || []),
          chapters: calculateGrowthRate(chapterData || []),
          groups: calculateGrowthRate(groupData || []),
        };

        setStats({
          totalUsers: userCount || 0,
          totalNovels: novelCount || 0,
          totalCharacters: characterCount || 0,
          totalChapters: chapterCount || 0,
          activeGroups: groupCount || 0,
          dailyActiveUsers: dailyActiveCount || 0,
          userGrowth,
          contentCreation,
          activityMetrics,
          monthlyGrowth,
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
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [supabase]);

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
          value={stats?.totalUsers || 0}
          icon={Users}
          trend={(stats?.monthlyGrowth?.users ?? 0 > 0) ? "up" : "down"}
          trendValue={`${Math.abs(stats?.monthlyGrowth?.users ?? 0).toFixed(1)}%`}
          color={CHART_COLORS.blue}
          description="Total registered users"
        />
        <StatsCard
          title="Total Novels"
          value={stats?.totalNovels || 0}
          icon={BookOpen}
          trend={(stats?.monthlyGrowth?.novels ?? 0 > 0) ? "up" : "down"}
          trendValue={`${Math.abs(stats?.monthlyGrowth?.novels ?? 0).toFixed(1)}%`}
          color={CHART_COLORS.violet}
          description="Total novels created"
        />
        <StatsCard
          title="Total Characters"
          value={stats?.totalCharacters || 0}
          icon={Bot}
          trend={(stats?.monthlyGrowth?.characters ?? 0 > 0) ? "up" : "down"}
          trendValue={`${Math.abs(stats?.monthlyGrowth?.characters ?? 0).toFixed(1)}%`}
          color={CHART_COLORS.teal}
          description="Total characters created"
        />
        <StatsCard
          title="Total Chapters"
          value={stats?.totalChapters || 0}
          icon={MessageSquare}
          trend={(stats?.monthlyGrowth?.chapters ?? 0 > 0) ? "up" : "down"}
          trendValue={`${Math.abs(stats?.monthlyGrowth?.chapters ?? 0).toFixed(1)}%`}
          color={CHART_COLORS.emerald}
          description="Total chapters created"
        />
        <StatsCard
          title="Active Groups"
          value={stats?.activeGroups || 0}
          icon={Activity}
          trend={(stats?.monthlyGrowth?.groups ?? 0 > 0) ? "up" : "down"}
          trendValue={`${Math.abs(stats?.monthlyGrowth?.groups ?? 0).toFixed(1)}%`}
          color={CHART_COLORS.orange}
          description="Active groups"
        />
        <StatsCard
          title="Daily Active Users"
          value={stats?.dailyActiveUsers || 0}
          icon={Users}
          trend={(stats?.monthlyGrowth?.users ?? 0 > 0) ? "up" : "down"}
          trendValue={`${Math.abs(stats?.monthlyGrowth?.users ?? 0).toFixed(1)}%`}
          color={CHART_COLORS.purple}
          description="Daily active users"
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
                  data={stats?.userGrowth}
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
                  data={stats?.activityMetrics?.slice(-7)} // Show last 7 days
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
                data={stats?.contentCreation}
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
