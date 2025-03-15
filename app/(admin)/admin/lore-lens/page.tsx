"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Star, 
  BarChart2, 
  TrendingUp, 
  Eye, 
  ThumbsUp, 
  MessageSquare,
  RefreshCw,
  Download,
  Filter,
  Sliders
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

// Define interfaces for content interaction data
interface ContentInteraction {
  id: string;
  user_id: string;
  content_id: string;
  content_type: string;
  interaction_type: string;
  rating?: number;
  review?: string;
  created_at: string;
  user_email?: string;
  content_name: string;
}

interface ContentStats {
  totalInteractions: number;
  totalViews: number;
  totalRatings: number;
  totalLikes: number;
  totalComments: number;
  avgRating: number;
  interactionsOverTime: { date: string; count: number }[];
  interactionsByType: { type: string; count: number }[];
  interactionsByContentType: { type: string; count: number }[];
  topRatedContent: {
    id: string;
    name: string;
    type: string;
    rating: number;
    interactions: number;
  }[];
  mostActiveUsers: {
    user_id: string;
    user_email?: string;
    interaction_count: number;
  }[];
}

// Define chart colors
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe"];

export default function LoreLensAdmin() {
  const [interactions, setInteractions] = useState<ContentInteraction[]>([]);
  const [stats, setStats] = useState<ContentStats>({
    totalInteractions: 0,
    totalViews: 0,
    totalRatings: 0,
    totalLikes: 0,
    totalComments: 0,
    avgRating: 0,
    interactionsOverTime: [],
    interactionsByType: [],
    interactionsByContentType: [],
    topRatedContent: [],
    mostActiveUsers: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [contentTypeFilter, setContentTypeFilter] = useState<string>("all");
  const [interactionTypeFilter, setInteractionTypeFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("overview");
 
  useEffect(() => {
    fetchInteractionData();
  }, []);



  const fetchInteractionData = async () => {
    try {
      setIsLoading(true);
      const supabase = createBrowserSupabaseClient();

      // Fetch users first
      const { data: userData, error: userError } = await supabase
        .from("user")
        .select("user_id, user_name, user_email");

      if (userError && userError.code !== "PGRST116") {
        // Try to get users from a different approach if the direct query fails
        console.error("Error fetching users:", userError);
      }

      // Create a map of user IDs to user data for quick lookup
      const userMap = new Map();
      userData?.forEach(user => {
        userMap.set(user.user_id, {
          email: user.user_name || "Unknown User"
        });
      });

      // Fetch content data
      const { data: contentData, error: contentError } = await supabase
        .from("content_metadata")
        .select("id, name, type, rating");

      if (contentError) {
        throw contentError;
      }

      // Create a map of content IDs to content data
      const contentMap = new Map();
      contentData?.forEach(content => {
        contentMap.set(content.id, {
          name: content.name || "Unknown Content",
          type: content.type || "unknown",
          rating: content.rating || 0
        });
      });

      // Fetch content interactions
      const { data: interactionsData, error } = await supabase
        .from("user_content_interactions")
        .select("*");

      if (error) throw error;

      // Process interaction data with user and content info from the maps
      const processedInteractions = interactionsData?.map((interaction) => {
        const userData = userMap.get(interaction.user_id) || { email: "Unknown User" };
        const contentData = contentMap.get(interaction.content_id) || { 
          name: "Unknown Content", 
          type: "unknown" 
        };

        return {
          id: interaction.id,
          user_id: interaction.user_id,
          content_id: interaction.content_id,
          content_type: contentData.type,
          interaction_type: interaction.interaction_type,
          rating: interaction.rating,
          review: interaction.review,
          created_at: interaction.created_at,
          user_email: userData.email,
          content_name: contentData.name,
        };
      }) || [];

      setInteractions(processedInteractions);

      // Calculate stats
      const now = new Date();
      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - 7);

      // Interactions over time for the last week
      const interactionsOverTime = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = format(date, "MMM dd");
        const count = processedInteractions.filter((interaction) => {
          const interactionDate = new Date(interaction.created_at);
          return (
            interactionDate.getDate() === date.getDate() &&
            interactionDate.getMonth() === date.getMonth() &&
            interactionDate.getFullYear() === date.getFullYear()
          );
        }).length;
        return { date: dateStr, count };
      }).reverse();

      // Interactions by type
      const interactionTypeCounts: Record<string, number> = {};
      processedInteractions.forEach((interaction) => {
        const type = interaction.interaction_type;
        interactionTypeCounts[type] = (interactionTypeCounts[type] || 0) + 1;
      });

      const interactionsByType = Object.entries(interactionTypeCounts).map(([type, count]) => ({
        type,
        count,
      }));

      // Interactions by content type
      const contentTypeCounts: Record<string, number> = {};
      processedInteractions.forEach((interaction) => {
        const type = interaction.content_type;
        contentTypeCounts[type] = (contentTypeCounts[type] || 0) + 1;
      });

      const interactionsByContentType = Object.entries(contentTypeCounts).map(([type, count]) => ({
        type,
        count,
      }));

      // Calculate average rating
      const ratings = processedInteractions.filter((i) => i.rating !== undefined && i.rating !== null);
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, i) => sum + (i.rating || 0), 0) / ratings.length
        : 0;

      // Top rated content
      const contentRatings: Record<string, { sum: number; count: number; name: string; type: string; interactions: number }> = {};
      processedInteractions.forEach((interaction) => {
        if (interaction.rating) {
          if (!contentRatings[interaction.content_id]) {
            contentRatings[interaction.content_id] = {
              sum: 0,
              count: 0,
              name: interaction.content_name,
              type: interaction.content_type,
              interactions: 0,
            };
          }
          contentRatings[interaction.content_id].sum += interaction.rating;
          contentRatings[interaction.content_id].count += 1;
          contentRatings[interaction.content_id].interactions += 1;
        }
      });

      const topRatedContent = Object.entries(contentRatings)
        .map(([id, data]) => ({
          id,
          name: data.name,
          type: data.type,
          rating: data.sum / data.count,
          interactions: data.interactions,
        }))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);

      // Most active users
      const userInteractionCounts: Record<string, { user_id: string; user_email?: string; count: number }> = {};
      processedInteractions.forEach((interaction) => {
        if (!userInteractionCounts[interaction.user_id]) {
          userInteractionCounts[interaction.user_id] = {
            user_id: interaction.user_id,
            user_email: interaction.user_email,
            count: 0,
          };
        }
        userInteractionCounts[interaction.user_id].count += 1;
      });

      const mostActiveUsers = Object.values(userInteractionCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((user) => ({
          user_id: user.user_id,
          user_email: user.user_email,
          interaction_count: user.count,
        }));

      // Get interaction counts by type
      const viewsCount = processedInteractions.filter((i) => i.interaction_type === "view").length;
      const ratingsCount = processedInteractions.filter((i) => i.interaction_type === "rating").length;
      const likesCount = processedInteractions.filter((i) => i.interaction_type === "like").length;
      const commentsCount = processedInteractions.filter((i) => i.interaction_type === "comment").length;

      setStats({
        totalInteractions: processedInteractions.length,
        totalViews: viewsCount,
        totalRatings: ratingsCount,
        totalLikes: likesCount,
        totalComments: commentsCount,
        avgRating,
        interactionsOverTime,
        interactionsByType,
        interactionsByContentType,
        topRatedContent,
        mostActiveUsers,
      });
    } catch (error) {
      console.error("Error fetching interaction data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter interactions based on search query and filters
  const filteredInteractions = interactions.filter((interaction) => {
    const matchesSearch = searchQuery
      ? interaction.content_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (interaction.user_email && interaction.user_email.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    const matchesContentType = contentTypeFilter !== "all" 
      ? interaction.content_type === contentTypeFilter 
      : true;

    const matchesInteractionType = interactionTypeFilter !== "all" 
      ? interaction.interaction_type === interactionTypeFilter 
      : true;

    return matchesSearch && matchesContentType && matchesInteractionType;
  });

  return (
    isLoading ? (
      <Loading />
    ) : ( 
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Lore Lens</h1>
        <p className="text-muted-foreground">
          Analyze user interactions with content across the platform
        </p>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content-analysis">Content Analysis</TabsTrigger>
          <TabsTrigger value="user-engagement">User Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
                <BarChart2 className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalInteractions.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Views</CardTitle>
                <Eye className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ratings</CardTitle>
                <Star className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRatings.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Likes</CardTitle>
                <ThumbsUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalLikes.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</div>
                <div className="flex mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < Math.round(stats.avgRating)
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Interaction Activity</CardTitle>
                <CardDescription>Interactions per day over the last week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.interactionsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="Interactions"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interaction Types</CardTitle>
                <CardDescription>Distribution of interactions by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.interactionsByType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="type"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {stats.interactionsByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Rated Content and Most Active Users */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Rated Content</CardTitle>
                <CardDescription>Content with highest average ratings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topRatedContent.map((content, index) => (
                    <div key={content.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="flex-none bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{content.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <Badge variant="outline" className="capitalize">
                            {content.type}
                          </Badge>
                          <span className="flex items-center">
                            <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                            {content.rating.toFixed(1)}
                          </span>
                          <span>{content.interactions} ratings</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Active Users</CardTitle>
                <CardDescription>Users with most content interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.mostActiveUsers.map((user, index) => (
                    <div key={user.user_id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="flex-none bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">{user.user_email || "Unknown User"}</h4>
                        <div className="text-sm text-muted-foreground mt-1">
                          {user.interaction_count} interactions
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content-analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Interaction Analysis</CardTitle>
              <CardDescription>Analyze how users interact with different types of content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search content..."
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
                      value={contentTypeFilter}
                      onChange={(e) => setContentTypeFilter(e.target.value)}
                    >
                      <option value="all">All Content Types</option>
                      <option value="movie">Movies</option>
                      <option value="series">Series</option>
                      <option value="book">Books</option>
                      <option value="game">Games</option>
                    </select>
                    <select
                      className="border rounded p-2 text-sm"
                      value={interactionTypeFilter}
                      onChange={(e) => setInteractionTypeFilter(e.target.value)}
                    >
                      <option value="all">All Interaction Types</option>
                      <option value="view">Views</option>
                      <option value="rating">Ratings</option>
                      <option value="like">Likes</option>
                      <option value="comment">Comments</option>
                    </select>
                    <Button variant="outline" size="icon" onClick={fetchInteractionData}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.interactionsByContentType}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Interactions" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-medium mb-4">Content Interactions</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Content</th>
                          <th className="text-left p-2">Type</th>
                          <th className="text-left p-2">User</th>
                          <th className="text-left p-2">Interaction</th>
                          <th className="text-left p-2">Rating</th>
                          <th className="text-left p-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInteractions.slice(0, 10).map((interaction) => (
                          <tr key={interaction.id} className="border-b">
                            <td className="p-2">{interaction.content_name}</td>
                            <td className="p-2 capitalize">{interaction.content_type}</td>
                            <td className="p-2">{interaction.user_email || "Unknown User"}</td>
                            <td className="p-2 capitalize">{interaction.interaction_type}</td>
                            <td className="p-2">
                              {interaction.rating ? (
                                <div className="flex">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 ${
                                        i < Math.floor(interaction.rating!)
                                          ? "text-yellow-500 fill-yellow-500"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="p-2">
                              {format(new Date(interaction.created_at), "MMM dd, yyyy")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredInteractions.length > 10 && (
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                      Showing 10 of {filteredInteractions.length} interactions
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user-engagement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Engagement Metrics</CardTitle>
              <CardDescription>Analyze how users engage with content across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-md p-4">
                    <h3 className="text-lg font-medium mb-4">Engagement by User</h3>
                    <div className="space-y-4">
                      {stats.mostActiveUsers.map((user, index) => (
                        <div key={user.user_id} className="flex items-center gap-4">
                          <div className="flex-none bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">{user.user_email || "Unknown User"}</h4>
                              <span className="text-sm">{user.interaction_count} interactions</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{
                                  width: `${(user.interaction_count / (stats.mostActiveUsers[0]?.interaction_count || 1)) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-md p-4">
                    <h3 className="text-lg font-medium mb-4">Engagement by Content Type</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.interactionsByContentType}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                            nameKey="type"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {stats.interactionsByContentType.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-medium mb-4">User Engagement Over Time</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.interactionsOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="count"
                          name="Interactions"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
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