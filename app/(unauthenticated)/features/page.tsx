"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Users,
  MessageSquare,
  Palette,
  Settings,
  Tag,
  Sparkles,
  ArrowRight,
  Send,
  Plus,
  Image as ImageIcon,
  Download,
  Search,
  Filter,
  Pencil,
  BookText,
  Clock,
  UserPlus,
  Brain,
  History,
  Bot,
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";

const features = [
  {
    title: "Story Weaver",
    description: "Craft epic narratives with AI assistance that enhances your creativity",
    icon: <BookOpen className="h-8 w-8 text-violet-500" />,
    color: "violet",
    demo: (
      <div className="h-full w-full bg-white/5 backdrop-blur-sm rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Novel Management</h3>
            <p className="text-sm text-muted-foreground">
              Your Creative Dashboard
            </p>
          </div>
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            New Novel
          </Button>
        </div>
        <div className="grid gap-4">
          <div className="p-4 rounded-lg bg-white/10">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-medium">The Lost Kingdom</h4>
                <p className="text-sm text-muted-foreground">
                  Fantasy • 24 Chapters
                </p>
              </div>
              <Badge variant="secondary">In Progress</Badge>
            </div>
            <div className="space-y-2">
              <div className="h-2 rounded bg-violet-500/20">
                <div className="h-full w-3/4 rounded bg-violet-500" />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>45,000 words</span>
                <span>Last edited 2h ago</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white/10">
              <h5 className="text-sm font-medium mb-1">Export Options</h5>
              <div className="flex gap-2">
                <Badge variant="outline">PDF</Badge>
                <Badge variant="outline">EPUB</Badge>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/10">
              <h5 className="text-sm font-medium mb-1">Collaborators</h5>
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <Avatar
                    key={i}
                    className="h-6 w-6 border-2 border-background"
                  >
                    <AvatarFallback>U{i}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    features: [
      "Build immersive worlds chapter by chapter with intelligent story generation",
      "Real-time progress tracking and word count statistics",
      "Export novels in multiple formats for sharing or publishing",
      "AI-powered plot and character development suggestions",
      "Auto-save and version history to never lose your creative work",
      "Rich text editor with formatting tools for professional manuscripts",
    ],
  },
  {
    title: "Fable Sanctum",
    description: "Explore a curated collection of published stories from fellow creators",
    icon: <BookOpen className="h-8 w-8 text-emerald-500" />,
    color: "emerald",
    demo: (
      <div className="h-full w-full bg-white/5 backdrop-blur-sm rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Fable Sanctum</h3>
            <p className="text-sm text-muted-foreground">
              The Sacred Space Between Stories
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button size="sm" variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
        <div className="grid gap-4">
          <div className="relative rounded-lg overflow-hidden border-2 border-emerald-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10" />
            <div className="relative p-4">
              <div className="flex gap-4">
                <div className="w-24 h-32 bg-emerald-500/20 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <h4 className="font-medium">Crystal Chronicles</h4>
                  <Badge variant="secondary">Fantasy</Badge>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    A tale of magic, mystery, and self-discovery in a world
                    where crystals hold untold power...
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookText className="w-4 h-4" />
                      <span>12 Chapters</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Updated 2h ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white/10">
              <h5 className="text-sm font-medium mb-2">Reading Progress</h5>
              <div className="h-2 rounded bg-emerald-500/20">
                <div className="h-full w-1/3 rounded bg-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                4/12 chapters read
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white/10">
              <h5 className="text-sm font-medium mb-2">Reading Stats</h5>
              <div className="flex justify-between text-sm">
                <span>Time spent</span>
                <span className="text-emerald-500">2.5 hours</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-white/10">
          <Button variant="outline" size="sm">
            <BookOpen className="w-4 h-4 mr-2" />
            Continue Reading
          </Button>
          <Button variant="ghost" size="sm">
            Add to Library
          </Button>
        </div>
      </div>
    ),
    features: [
      "Discover new worlds and adventures crafted by the community",
      "Advanced filtering and search to find stories matching your interests",
      "Track reading progress and maintain a personal reading history",
      "Personalized recommendations based on your reading preferences",
      "Bookmark favorite chapters and stories for easy access",
      "Engage with authors through comments and ratings",
    ],
  },
  {
    title: "Character Realm",
    description: "Forge unique AI companions with rich personalities and backstories",
    icon: <Users className="h-8 w-8 text-blue-500" />,
    color: "blue",
    demo: (
      <div className="h-full w-full bg-white/5 backdrop-blur-sm rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-16 w-16 border-2 border-blue-500/20">
              <AvatarImage src="/placeholder.jpg" />
              <AvatarFallback>MB</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">Character Profile</h3>
              <div className="flex gap-2 mt-1">
                <Badge>Protagonist</Badge>
                <Badge variant="outline">Public</Badge>
              </div>
            </div>
          </div>
          <Button size="icon" variant="ghost">
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="h-[180px] w-full rounded-lg border border-white/10 p-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Character Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 rounded bg-white/5">
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm">Marcus Blackwood</p>
                </div>
                <div className="p-2 rounded bg-white/5">
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="text-sm">Main Character</p>
                </div>
                <div className="p-2 rounded bg-white/5">
                  <p className="text-xs text-muted-foreground">Age</p>
                  <p className="text-sm">28</p>
                </div>
                <div className="p-2 rounded bg-white/5">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm">Active</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Traits & Abilities</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Skilled Warrior</Badge>
                <Badge variant="secondary">Natural Leader</Badge>
                <Badge variant="secondary">Strategic Mind</Badge>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    ),
    features: [
      "Create and customize unique AI companions with rich personalities",
      "Define detailed backstories and character traits",
      "Watch characters evolve through your interactions",
      "Breathe life into your stories with dynamic characters",
      "Personalize character voices and visual appearances",
      "Track character relationships and development over time",
    ],
  },
  {
    title: "Lore Lens",
    description: "Discover perfect content tailored to your tastes with our AI-powered recommendation engine",
    icon: <Brain className="h-8 w-8 text-purple-500" />,
    color: "purple",
    demo: (
      <div className="h-full w-full bg-white/5 backdrop-blur-sm rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Recommendations</h3>
            <p className="text-sm text-muted-foreground">
              Tailored to Your Preferences
            </p>
          </div>
          <Button size="sm" variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Refine
          </Button>
        </div>
        <div className="grid gap-4">
          <div className="p-4 rounded-lg bg-white/10">
            <div className="flex gap-3 items-start">
              <div className="w-16 h-16 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-purple-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Based on your preferences</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Fantasy stories with strong character development
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Epic Fantasy</Badge>
                  <Badge variant="secondary">Character-Driven</Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white/10">
              <h5 className="text-sm font-medium mb-2">Reading History</h5>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  12 stories this month
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/10">
              <h5 className="text-sm font-medium mb-2">Top Genre</h5>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-500" />
                <span className="text-xs">Fantasy (65%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    features: [
      "AI-powered recommendation engine that learns from your preferences",
      "Find new stories and characters based on your reading history",
      "Explore content matching your interests and style preferences",
      "Discover trending and popular content in your favorite genres",
      "Receive personalized suggestions for new reading material",
      "Track your preferences and reading patterns over time",
    ],
  },
  {
    title: "Thread Tapestry",
    description: "Weave conversations with the community in a vibrant social space",
    icon: <MessageSquare className="h-8 w-8 text-indigo-500" />,
    color: "indigo",
    demo: (
      <div className="h-full w-full bg-white/5 backdrop-blur-sm rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Community Threads</h3>
            <p className="text-sm text-muted-foreground">
              Join the Conversation
            </p>
          </div>
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            New Thread
          </Button>
        </div>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-white/10">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium">Character Development Tips</h4>
              <Badge variant="secondary">Trending</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Share your best practices for creating memorable characters
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <Avatar
                      key={i}
                      className="h-5 w-5 border-2 border-background"
                    >
                      <AvatarFallback>U{i}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span>42 participants</span>
              </div>
              <span>Last reply 5m ago</span>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-white/10">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium">Weekly Writing Prompt</h4>
              <Badge variant="outline">Active</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              &quot;A character discovers a hidden door in their home that wasn&apos;t there yesterday...&quot;
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>28 responses</span>
              </div>
              <span>Ends in 3 days</span>
            </div>
          </div>
        </div>
      </div>
    ),
    features: [
      "Participate in interactive threads for stories, theories, and discussions",
      "Share creative content and receive feedback from the community",
      "Join topic-based conversations about writing and storytelling",
      "Stay updated with real-time notifications on your threads",
      "Create and moderate your own discussion topics",
      "Connect with like-minded creators through shared interests",
    ],
  },
  {
    title: "Tale Tethers",
    description: "Build meaningful connections with fellow storytellers and readers",
    icon: <UserPlus className="h-8 w-8 text-pink-500" />,
    color: "pink",
    demo: (
      <div className="h-full w-full bg-white/5 backdrop-blur-sm rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Connections</h3>
            <p className="text-sm text-muted-foreground">
              Your Creative Network
            </p>
          </div>
          <Button size="sm" variant="outline">
            <Search className="w-4 h-4 mr-2" />
            Find Creators
          </Button>
        </div>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-white/10">
            <div className="flex gap-3 items-center">
              <Avatar className="h-12 w-12 border-2 border-pink-500/20">
                <AvatarFallback>EW</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-medium">Emma Wright</h4>
                <p className="text-sm text-muted-foreground">
                  Fantasy Author • 12 stories published
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    Similar Interests
                  </Badge>
                </div>
              </div>
              <Button size="sm" variant="outline">
                <MessageSquare className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-white/10">
            <div className="flex gap-3 items-center">
              <Avatar className="h-12 w-12 border-2 border-pink-500/20">
                <AvatarFallback>JL</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-medium">James Lee</h4>
                <p className="text-sm text-muted-foreground">
                  Sci-Fi Writer • Collaborative projects
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    Active Now
                  </Badge>
                </div>
              </div>
              <Button size="sm" variant="outline">
                <MessageSquare className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="pt-3 border-t border-white/10">
          <h4 className="text-sm font-medium mb-2">Suggested Connections</h4>
          <div className="flex -space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Avatar
                key={i}
                className="h-8 w-8 border-2 border-background"
              >
                <AvatarFallback>U{i}</AvatarFallback>
              </Avatar>
            ))}
            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs">
              +12
            </div>
          </div>
        </div>
      </div>
    ),
    features: [
      "Share your creative journey through real-time chats with other creators",
      "Engage in collaborative storytelling opportunities",
      "Find like-minded creators through interest-based matching",
      "Build a network of fellow writers and readers",
      "Receive notifications about connection activities and messages",
      "Create writing groups and collaborative projects",
    ],
  },
  {
    title: "Character Confluence",
    description: "Experience magical group interactions where multiple AI characters converse with each other",
    icon: <Palette className="h-8 w-8 text-amber-500" />,
    color: "amber",
    demo: (
      <div className="h-full w-full bg-white/5 backdrop-blur-sm rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Character Confluence</h3>
            <p className="text-sm text-muted-foreground">
              Multi-Character Interactions
            </p>
          </div>
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </div>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-pink-500/10">
            <h4 className="font-medium mb-3">Active Confluence</h4>
            <div className="flex gap-2 mb-3">
              <Avatar className="h-10 w-10 border-2 border-amber-500/20">
                <AvatarFallback>E</AvatarFallback>
              </Avatar>
              <Avatar className="h-10 w-10 border-2 border-pink-500/20">
                <AvatarFallback>L</AvatarFallback>
              </Avatar>
              <Avatar className="h-10 w-10 border-2 border-blue-500/20">
                <AvatarFallback>M</AvatarFallback>
              </Avatar>
              <Avatar className="h-10 w-10 border-2 border-green-500/20">
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>E</AvatarFallback>
                </Avatar>
                <div className="bg-white/10 rounded-lg p-2 text-sm max-w-[80%]">
                  <p>I don&apos;t think we should enter the abandoned castle...</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <div className="bg-amber-500/20 rounded-lg p-2 text-sm max-w-[80%]">
                  <p>But the treasure map clearly points to it!</p>
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarFallback>L</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>M</AvatarFallback>
                </Avatar>
                <div className="bg-white/10 rounded-lg p-2 text-sm max-w-[80%]">
                  <p>I&apos;ve studied the history of this place. The legends say...</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Join the conversation..."
              className="flex-1"
            />
            <Button size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    ),
    features: [
      "Experience magical group interactions with multiple AI characters",
      "Include your friends in character conversations",
      "Create dynamic and unpredictable storytelling moments",
      "Develop complex character relationships in a shared space",
      "Watch how different characters interact with each other",
      "Create unique story scenarios with multiple perspectives",
    ],
  },
];

export default function FeaturesPage() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-blue-500/20 to-teal-500/20 blur-3xl" />
        <div className="container mx-auto px-4 py-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl sm:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 mb-6">
              Craft Your Narrative Universe
            </h1>
            <p className="text-xl text-muted-foreground">
              Discover the magical tools that bring your stories to life through AI-powered creativity and community
            </p>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="space-y-32">
          {features.map((feature, index) => (
            <motion.section
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Background Gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br opacity-10 blur-3xl -z-10
                  ${
                    index % 2 === 0
                      ? "from-violet-500/20 via-blue-500/20 to-teal-500/20"
                      : "from-pink-500/20 via-purple-500/20 to-blue-500/20"
                  }`}
              />

              <div
                className={`grid lg:grid-cols-2 gap-8 items-center ${index % 2 === 0 ? "" : "lg:flex-row-reverse"}`}
              >
                {/* Content */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-xl bg-${feature.color}-500/10`}
                    >
                      {feature.icon}
                    </div>
                    <h2 className="text-3xl font-bold">{feature.title}</h2>
                  </div>

                  <p className="text-lg text-muted-foreground">
                    {feature.description}
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {feature.features.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-2"
                      >
                        <Sparkles
                          className={`w-5 h-5 mt-1 text-${feature.color}-500`}
                        />
                        <span className="text-muted-foreground">{item}</span>
                      </motion.div>
                    ))}
                  </div>

                  <Button
                    onClick={() =>
                      router.push(
                        feature.title === "Story Weaver"
                          ? "/story-weaver"
                          : feature.title === "Character Realm"
                            ? "/character-realm"
                            : feature.title === "Character Confluence"
                              ? "/story-weaver"
                              : feature.title === "Weave Anime"
                                ? "/weave-anime"
                                : "/profile"
                      )
                    }
                    variant="outline"
                    className="group"
                  >
                    Try our feature
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>

                {/* Demo */}
                <div className="lg:order-last">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="relative rounded-xl overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-blue-500/20 to-teal-500/20" />
                    <motion.div
                      animate={{
                        scale: activeDemo === feature.title ? 1 : 0.97,
                        opacity: activeDemo === feature.title ? 1 : 0.7,
                      }}
                      transition={{ duration: 0.2 }}
                      className="relative rounded-lg overflow-hidden shadow-2xl"
                    >
                      {feature.demo}
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </motion.section>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="container mx-auto px-4 py-24 text-center"
      >
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold">Begin Your Storytelling Adventure</h2>
          <p className="text-lg text-muted-foreground">
            Join our community of creators and breathe life into characters, worlds, and stories that captivate the imagination
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600"
            >
              Start Creating
            </Button>
            <Button size="lg" variant="outline">
              Explore Stories
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
