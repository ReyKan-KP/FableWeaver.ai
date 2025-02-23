"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CalendarDays,
  Activity,
  BookOpen,
  Settings,
  Star,
  Book,
  Users,
  Type,
  BarChart,
  TrendingUp,
  Clock,
  Target,
  Edit,
  Plus,
  Info,
  BookmarkIcon,
  MessageSquare,
  BarChart2,
} from "lucide-react";
import { ProfileForm } from "./profile-form";
import { formatDistanceToNow } from "date-fns";
import {
  BarChart as BarChartComponent,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip as TooltipComponent,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

interface Story {
  id: string;
  title: string;
  created_at: string;
  genre: string;
  status: string;
  coverImage?: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  created_at: string;
}

interface UserPreferences {
  theme: string;
  email_notifications: boolean;
  writing_goals: {
    daily_words: number;
    weekly_stories: number;
  };
}

interface WordCountData {
  date: string;
  count: number;
}

interface GenreData {
  genre: string;
  count: number;
}

interface Statistics {
  storiesCreated: number;
  chaptersWritten: number;
  charactersCreated: number;
  totalWords: number;
  publishedStories: number;
  wordCountHistory: WordCountData[];
  genreDistribution: GenreData[];
  averageWordsPerDay: number;
  longestWritingStreak: number;
  currentWritingStreak: number;
  completionRate: number;
  lastWritingDate: string | null;
}

interface GroupChat {
  id: string;
  group_name: string;
  created_at: string;
  is_active: boolean;
  is_auto_chatting: boolean;
  users_count: number;
  characters_count: number;
  last_message_at: string;
}

interface ReadingAnalytics {
  totalBooksRead: number;
  inProgressBooks: number;
  totalBookmarks: number;
  totalComments: number;
  averageProgress: number;
  readingHistory: Array<{
    date: string;
    progress: number;
  }>;
  commentActivity: Array<{
    date: string;
    comments: number;
    reactions: number;
    likes: number;
    dislikes: number;
  }>;
  readingStatusDistribution: {
    completed: number;
    reading: number;
    onHold: number;
    dropped: number;
    planToRead: number;
  };
  bookmarkActivity: Array<{
    date: string;
    count: number;
    withNotes: number;
  }>;
  lastReadAt: string | null;
}

interface AnimatedContentProps {
  user: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
  statistics: Statistics;
  readingAnalytics: ReadingAnalytics;
  recentStories: Story[];
  recentActivity: Activity[];
  preferences: UserPreferences;
  createdGroups: GroupChat[];
  joinedGroups: GroupChat[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--muted))",
];

const THEME = {
  colors: {
    primary: "from-violet-600 via-blue-600 to-teal-500",
    secondary: "from-purple-600 to-blue-600",
    accent: "from-teal-500 to-blue-500",
    text: {
      primary: "text-gray-900 dark:text-white",
      secondary: "text-gray-600 dark:text-gray-300",
    },
  },
  animation: {
    duration: 0.5,
    delay: 0.1,
  },
};

interface WritingGoalsFormProps {
  goals: {
    daily_words: number;
    weekly_stories: number;
  };
  onSave: (goals: {
    daily_words: number;
    weekly_stories: number;
  }) => Promise<void>;
}

function WritingGoalsForm({ goals, onSave }: WritingGoalsFormProps) {
  const [dailyWords, setDailyWords] = useState(goals.daily_words);
  const [weeklyStories, setWeeklyStories] = useState(goals.weekly_stories);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({ daily_words: dailyWords, weekly_stories: weeklyStories });
    } catch (error) {
      console.error("Failed to save goals:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="daily-words">Daily Word Goal</Label>
        <Input
          id="daily-words"
          type="number"
          min="1"
          value={dailyWords}
          onChange={(e) => setDailyWords(parseInt(e.target.value))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="weekly-stories">Weekly Stories Goal</Label>
        <Input
          id="weekly-stories"
          type="number"
          min="1"
          value={weeklyStories}
          onChange={(e) => setWeeklyStories(parseInt(e.target.value))}
        />
      </div>
      <Button type="submit" disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Goals"}
      </Button>
    </form>
  );
}

function StatTooltip({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="w-4 h-4 text-muted-foreground/50 hover:text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2 max-w-xs">
            <p className="font-medium">{label}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function WritingRadar({ statistics }: { statistics: Statistics }) {
  const data = [
    {
      subject: "Stories",
      value: statistics.storiesCreated,
      fullMark: Math.max(statistics.storiesCreated, 10),
    },
    {
      subject: "Characters",
      value: statistics.charactersCreated,
      fullMark: Math.max(statistics.charactersCreated, 10),
    },
    {
      subject: "Chapters",
      value: statistics.chaptersWritten,
      fullMark: Math.max(statistics.chaptersWritten, 20),
    },
    {
      subject: "Published",
      value: statistics.publishedStories,
      fullMark: Math.max(statistics.publishedStories, 5),
    },
    {
      subject: "Writing Streak",
      value: statistics.currentWritingStreak,
      fullMark: Math.max(statistics.longestWritingStreak, 7),
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis />
        <Radar
          name="Writing Stats"
          dataKey="value"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function WordsProgressChart({ statistics }: { statistics: Statistics }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={statistics.wordCountHistory}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
        <XAxis dataKey="date" />
        <YAxis />
        <RechartsTooltip
          contentStyle={{
            background: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
          }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ReadingProgressChart({
  readingAnalytics,
}: {
  readingAnalytics: ReadingAnalytics;
}) {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <AreaChart data={readingAnalytics.readingHistory}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <RechartsTooltip />
          <Area
            type="monotone"
            dataKey="progress"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ReadingStatusChart({
  readingAnalytics,
}: {
  readingAnalytics: ReadingAnalytics;
}) {
  const data = [
    {
      name: "Completed",
      value: readingAnalytics.readingStatusDistribution.completed,
    },
    {
      name: "Reading",
      value: readingAnalytics.readingStatusDistribution.reading,
    },
    {
      name: "On Hold",
      value: readingAnalytics.readingStatusDistribution.onHold,
    },
    {
      name: "Dropped",
      value: readingAnalytics.readingStatusDistribution.dropped,
    },
    {
      name: "Plan to Read",
      value: readingAnalytics.readingStatusDistribution.planToRead,
    },
  ];

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend />
          <RechartsTooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function BookmarkActivityChart({
  readingAnalytics,
}: {
  readingAnalytics: ReadingAnalytics;
}) {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <BarChartComponent data={readingAnalytics.bookmarkActivity}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
          <XAxis dataKey="date" />
          <YAxis />
          <RechartsTooltip
            contentStyle={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
            }}
          />
          <Legend />
          <Bar
            dataKey="count"
            fill="hsl(var(--primary))"
            name="Total Bookmarks"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="withNotes"
            fill="hsl(var(--secondary))"
            name="With Notes"
            radius={[4, 4, 0, 0]}
          />
        </BarChartComponent>
      </ResponsiveContainer>
    </div>
  );
}

function CommentActivityChart({
  readingAnalytics,
}: {
  readingAnalytics: ReadingAnalytics;
}) {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <BarChartComponent data={readingAnalytics.commentActivity}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
          <XAxis dataKey="date" />
          <YAxis />
          <RechartsTooltip
            contentStyle={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
            }}
          />
          <Legend />
          <Bar
            dataKey="comments"
            fill="hsl(var(--primary))"
            name="Comments"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="likes"
            fill="hsl(var(--secondary))"
            name="Likes"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="dislikes"
            fill="hsl(var(--destructive))"
            name="Dislikes"
            radius={[4, 4, 0, 0]}
          />
        </BarChartComponent>
      </ResponsiveContainer>
    </div>
  );
}

export function AnimatedContent({
  user,
  statistics,
  readingAnalytics,
  recentStories,
  recentActivity,
  preferences,
  createdGroups,
  joinedGroups,
}: AnimatedContentProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isEditingGoals, setIsEditingGoals] = useState(false);

  useEffect(() => {
    toast("Welcome to Your Profile", {
      description: `Good to see you, ${user.name}!`,
    });
  }, [user.name]);

  const handleUpdateGoals = async (newGoals: {
    daily_words: number;
    weekly_stories: number;
  }) => {
    try {
      const { error } = await supabase.from("user_preferences").upsert({
        user_id: user.id,
        writing_goals: newGoals,
      });

      if (error) throw error;

      toast("Goals Updated", {
        description: "Your writing goals have been updated successfully",
      });
      setIsEditingGoals(false);
    } catch (error) {
      toast.error("Error", {
        description: "Failed to update writing goals. Please try again.",
      });
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const tabNames: { [key: string]: string } = {
      overview: "Overview",
      writing: "Writing Analytics",
      reading: "Reading Analytics",
      groups: "Group Chats",
      settings: "Settings",
    };
    
    if (tabNames[value]) {
      toast(`Viewing ${tabNames[value]}`, {
        description: `Switched to ${tabNames[value].toLowerCase()} section`,
      });
    }
  };

  useEffect(() => {
    if (statistics.currentWritingStreak > 5) {
      toast("Writing Streak! 🔥", {
        description: `You're on a ${statistics.currentWritingStreak}-day writing streak!`,
      });
    }
  }, [statistics.currentWritingStreak]);

  useEffect(() => {
    if (readingAnalytics.totalBooksRead > 0 && readingAnalytics.totalBooksRead % 10 === 0) {
      toast("Reading Milestone! 📚", {
        description: `Congratulations! You've completed ${readingAnalytics.totalBooksRead} books!`,
      });
    }
  }, [readingAnalytics.totalBooksRead]);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="container max-w-7xl space-y-8"
    >
      {/* Profile Header */}
      <motion.div
        variants={fadeInUp}
        className="relative bg-gradient-to-r from-primary/5 via-primary/10 to-background p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border border-border"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Avatar className="w-24 h-24 border-4 border-background shadow-xl ring-2 ring-violet-500/20">
              <AvatarImage src={user.image} alt={user.name} />
              <AvatarFallback className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white">
                {user.name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
              {user.name}
            </h1>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="flex gap-4 mt-4">
              <Badge
                variant="secondary"
                className="px-4 py-2 bg-primary/5 hover:bg-primary/10"
              >
                {statistics.storiesCreated} Stories
              </Badge>
              <Badge
                variant="secondary"
                className="px-4 py-2 bg-primary/5 hover:bg-primary/10"
              >
                {statistics.charactersCreated} Characters
              </Badge>
              <Badge
                variant="secondary"
                className="px-4 py-2 bg-primary/5 hover:bg-primary/10"
              >
                {statistics.totalWords.toLocaleString()} Words
              </Badge>
            </div>
          </div>
          <div className="flex gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-primary/5 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here. Click save when
                    you&apos;re done.
                  </DialogDescription>
                </DialogHeader>
                <ProfileForm user={user} />
              </DialogContent>
            </Dialog>
            <Button
              size="sm"
              onClick={() => router.push("/story-weaver")}
              className="bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 text-white hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Story
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Writing Goals Card */}
      <motion.div variants={fadeInUp}>
        <Card className="bg-gradient-to-r from-primary/5 to-background hover:shadow-lg transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center justify-between w-full">
                <div>
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
                    Writing Goals
                  </h3>
                  <p className="text-muted-foreground">
                    Track your writing progress
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingGoals(!isEditingGoals)}
                  className="hover:bg-primary/5 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {isEditingGoals ? "Cancel" : "Edit Goals"}
                </Button>
              </div>
            </div>

            {isEditingGoals ? (
              <div className="mt-4">
                <WritingGoalsForm
                  goals={preferences.writing_goals}
                  onSave={handleUpdateGoals}
                />
              </div>
            ) : (
              <div className="flex gap-6 mt-4">
                <motion.div
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <p className="text-sm text-muted-foreground">
                    Today&apos;s Goal
                  </p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                    {preferences.writing_goals.daily_words}
                  </p>
                  <p className="text-xs text-muted-foreground">words</p>
                </motion.div>
                <motion.div
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <p className="text-sm text-muted-foreground">Weekly Goal</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                    {preferences.writing_goals.weekly_stories}
                  </p>
                  <p className="text-xs text-muted-foreground">stories</p>
                </motion.div>
                <motion.div
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <p className="text-sm text-muted-foreground">
                    Completion Rate
                  </p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-teal-500 bg-clip-text text-transparent">
                    {statistics.completionRate}%
                  </p>
                  <p className="text-xs text-muted-foreground">overall</p>
                </motion.div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md p-1 text-muted-foreground mb-6 bg-primary/5">
          <TabsTrigger
            value="overview"
            className="px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:via-blue-600 data-[state=active]:to-teal-500 data-[state=active]:text-white"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="statistics"
            className="px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:via-blue-600 data-[state=active]:to-teal-500 data-[state=active]:text-white"
          >
            Statistics
          </TabsTrigger>
          <TabsTrigger
            value="stories"
            className="px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:via-blue-600 data-[state=active]:to-teal-500 data-[state=active]:text-white"
          >
            Stories
          </TabsTrigger>
          <TabsTrigger
            value="groups"
            className="px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:via-blue-600 data-[state=active]:to-teal-500 data-[state=active]:text-white"
          >
            Groups
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:via-blue-600 data-[state=active]:to-teal-500 data-[state=active]:text-white"
          >
            Activity
          </TabsTrigger>
          <TabsTrigger
            value="reading"
            className="px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:via-blue-600 data-[state=active]:to-teal-500 data-[state=active]:text-white"
          >
            Reading
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2 lg:col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      <CardTitle>Quick Stats</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <StatsCard
                      icon={<Book />}
                      label="Stories"
                      value={statistics.storiesCreated}
                      subtext={`${statistics.publishedStories} published`}
                    />
                    <StatsCard
                      icon={<Type />}
                      label="Total Words"
                      value={statistics.totalWords.toLocaleString()}
                      subtext={`${statistics.averageWordsPerDay} per day`}
                    />
                    <StatsCard
                      icon={<Users />}
                      label="Characters"
                      value={statistics.charactersCreated}
                    />
                    <StatsCard
                      icon={<Target />}
                      label="Completion"
                      value={`${statistics.completionRate}%`}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <CardTitle>Writing Progress</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Last 30 Days</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={statistics.wordCountHistory}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="opacity-50"
                        />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip
                          contentStyle={{
                            background: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <CardTitle>Writing Overview</CardTitle>
                  </div>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Info className="w-4 h-4" />
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-medium">Writing Statistics</h4>
                        <p className="text-sm text-muted-foreground">
                          This radar chart shows your overall writing progress
                          across different metrics. Each axis represents a
                          different aspect of your writing journey.
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
              </CardHeader>
              <CardContent>
                <WritingRadar statistics={statistics} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart className="w-5 h-5 text-primary" />
                    <CardTitle>Genre Distribution</CardTitle>
                  </div>
                  <StatTooltip
                    label="Genre Distribution"
                    description="Shows the distribution of your stories across different genres. Helps you track your writing diversity."
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statistics.genreDistribution}
                        dataKey="count"
                        nameKey="genre"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {statistics.genreDistribution.map((entry, index) => (
                          <Cell
                            key={entry.genre}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          background: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <CardTitle>Writing Progress</CardTitle>
                  </div>
                  <StatTooltip
                    label="Writing Progress"
                    description="Shows your daily word count progress over the last 30 days. The area chart helps visualize your writing consistency."
                  />
                </div>
              </CardHeader>
              <CardContent>
                <WordsProgressChart statistics={statistics} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <CardTitle>Writing Achievements</CardTitle>
                  </div>
                  <StatTooltip
                    label="Writing Achievements"
                    description="Track your writing streaks, completion rates, and recent milestones. Streaks are calculated based on consecutive days of writing."
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="space-y-2 cursor-help">
                          <p className="text-sm font-medium">Current Streak</p>
                          <div className="flex items-center gap-2">
                            <div className="text-2xl font-bold">
                              {statistics.currentWritingStreak}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              days
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {statistics.lastWritingDate
                              ? `Last wrote ${formatDistanceToNow(
                                  new Date(statistics.lastWritingDate),
                                  { addSuffix: true }
                                )}`
                              : "No recent writing"}
                          </p>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium">Writing Streak</h4>
                          <p className="text-sm text-muted-foreground">
                            Your current streak is calculated based on
                            consecutive days of writing. Write something every
                            day to maintain your streak!
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>

                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="space-y-2 cursor-help">
                          <p className="text-sm font-medium">Longest Streak</p>
                          <div className="flex items-center gap-2">
                            <div className="text-2xl font-bold">
                              {statistics.longestWritingStreak}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              days
                            </div>
                          </div>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium">Record Streak</h4>
                          <p className="text-sm text-muted-foreground">
                            This is your longest writing streak ever. Can you
                            beat it?
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        Story Completion Rate
                        <StatTooltip
                          label="Completion Rate"
                          description="Percentage of your stories that have been completed and published."
                        />
                      </span>
                      <span className="font-medium">
                        {statistics.completionRate}%
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${statistics.completionRate}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-3">
                      Recent Milestones
                    </h4>
                    <div className="space-y-2">
                      <motion.div
                        className="flex items-center gap-2 text-sm"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Badge variant="outline">🎉</Badge>
                        <span>
                          Reached {statistics.totalWords.toLocaleString()} words
                        </span>
                      </motion.div>
                      <motion.div
                        className="flex items-center gap-2 text-sm"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                      >
                        <Badge variant="outline">📚</Badge>
                        <span>
                          Published {statistics.publishedStories} stories
                        </span>
                      </motion.div>
                      {statistics.currentWritingStreak > 0 && (
                        <motion.div
                          className="flex items-center gap-2 text-sm"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                        >
                          <Badge variant="outline">🔥</Badge>
                          <span>
                            {statistics.currentWritingStreak} day writing streak
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stories" className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">Your Stories</h2>
              <p className="text-muted-foreground">
                Manage and track your story collection
              </p>
            </div>
            <Button
              onClick={() => router.push("/story-weaver")}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Story
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recentStories.map((story) => (
              <Card
                key={story.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-4">
                  <div className="aspect-video relative rounded-md overflow-hidden mb-4">
                    {story.coverImage ? (
                      <Image
                        src={story.coverImage}
                        alt={story.title}
                        className="w-full h-full object-contain"
                        width={100}
                        height={100}
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary/20 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{story.title}</CardTitle>
                      <CardDescription>
                        {formatDistanceToNow(new Date(story.created_at), {
                          addSuffix: true,
                        })}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        story.status === "published" ? "default" : "secondary"
                      }
                    >
                      {story.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{story.genre}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <CardTitle>Created Groups</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/character-confluence")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Group
                  </Button>
                </div>
                <CardDescription>Groups you&apos;ve created</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {createdGroups.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/groups/${group.id}`)}
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{group.group_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{group.users_count} members</span>
                          <span>•</span>
                          <span>{group.characters_count} characters</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {group.is_active && (
                          <Badge variant="default">Active</Badge>
                        )}
                        {group.is_auto_chatting && (
                          <Badge variant="secondary">Auto-chat</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {createdGroups.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>You haven&apos;t created any groups yet</p>
                      <Button
                        variant="link"
                        onClick={() => router.push("/groups/create")}
                        className="mt-2"
                      >
                        Create your first group
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <CardTitle>Joined Groups</CardTitle>
                </div>
                <CardDescription>
                  Groups you&apos;re participating in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {joinedGroups.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/groups/${group.id}`)}
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{group.group_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{group.users_count} members</span>
                          <span>•</span>
                          <span>
                            Last active{" "}
                            {formatDistanceToNow(
                              new Date(group.last_message_at),
                              {
                                addSuffix: true,
                              }
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {group.is_active && (
                          <Badge variant="default">Active</Badge>
                        )}
                        {group.is_auto_chatting && (
                          <Badge variant="secondary">Auto-chat</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {joinedGroups.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>You haven&apos;t joined any groups yet</p>
                      <Button
                        variant="link"
                        onClick={() => router.push("/groups/explore")}
                        className="mt-2"
                      >
                        Explore groups
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  <CardTitle>Activity Timeline</CardTitle>
                </div>
                <Badge variant="outline">Recent</Badge>
              </div>
              <CardDescription>Track your writing journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-6 pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="relative pl-6 before:absolute before:left-[-5px] before:top-2 before:w-3 before:h-3 before:bg-background before:border-2 before:border-primary before:rounded-full"
                  >
                    <div className="flex flex-col space-y-1.5">
                      <p className="text-sm font-medium leading-none">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reading" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              icon={<BookOpen className="h-4 w-4" />}
              label="Total Books Read"
              value={readingAnalytics.totalBooksRead}
            />
            <StatsCard
              icon={<BarChart2 className="h-4 w-4" />}
              label="In Progress"
              value={readingAnalytics.inProgressBooks}
            />
            <StatsCard
              icon={<BookmarkIcon className="h-4 w-4" />}
              label="Bookmarks"
              value={readingAnalytics.totalBookmarks}
            />
            <StatsCard
              icon={<MessageSquare className="h-4 w-4" />}
              label="Comments"
              value={readingAnalytics.totalComments}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Reading Status Distribution</CardTitle>
                <CardDescription>
                  Overview of your reading status across books
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReadingStatusChart readingAnalytics={readingAnalytics} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reading Progress</CardTitle>
                <CardDescription>
                  Your reading progress over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReadingProgressChart readingAnalytics={readingAnalytics} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bookmark Activity</CardTitle>
                <CardDescription>Your bookmarks and notes</CardDescription>
              </CardHeader>
              <CardContent>
                <BookmarkActivityChart readingAnalytics={readingAnalytics} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comment Activity</CardTitle>
                <CardDescription>
                  Your comments and interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CommentActivityChart readingAnalytics={readingAnalytics} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function StatsCard({
  icon,
  label,
  value,
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <motion.div
      className="p-4 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors duration-300"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 text-primary">{icon}</div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <h3 className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
        {value}
      </h3>
      {subtext && (
        <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
      )}
    </motion.div>
  );
}
