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
    description: "A powerful novel writing and management system",
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
      "Create and organize multiple novels with chapters",
      "Real-time progress tracking and word count",
      "Export novels in multiple formats (PDF, EPUB)",
      "Collaborative writing with team management",
      "Auto-save and version history",
      "Rich text editor with formatting tools",
    ],
  },
  {
    title: "Fable Trail",
    description:
      "Immerse yourself in a world of stories with our novel reading platform",
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
      "Discover and read captivating stories",
      "Smart filtering and search capabilities",
      "Track reading progress across novels",
      "Personalized reading statistics",
      "Bookmark favorite chapters",
      "Offline reading support",
    ],
  },
  {
    title: "Character Realm",
    description: "Create and manage detailed character profiles",
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
      "Create detailed character profiles with rich metadata",
      "Public and private character sharing",
      "Character relationships and connections",
      "Trait and ability management",
      "Character development tracking",
      "Import/export character data",
    ],
  },
  {
    title: "Character Confluence",
    description:
      "Collaborate in real-time with AI-enhanced story development tools",
    icon: <MessageSquare className="h-8 w-8 text-green-500" />,
    color: "green",
    demo: (
      <div className="h-full w-full bg-white/5 backdrop-blur-sm rounded-xl p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Story Development Hub</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">Crystal Chronicles Team</Badge>
              <Badge variant="secondary">Live Session</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Analysis
            </Button>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Invite
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1 w-full rounded-lg border border-white/10 p-4 mb-4">
          <div className="space-y-4">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div className="flex-1 p-3 rounded-lg bg-violet-500/10">
                <p className="text-sm font-medium">Story Analysis</p>
                <p className="text-sm text-muted-foreground mt-1">
                  The crystal artifact discovery could create an interesting
                  parallel with Elena&apos;s inner conflict. Consider exploring
                  how its power mirrors her own untapped potential.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>SL</AvatarFallback>
              </Avatar>
              <div className="flex-1 p-3 rounded-lg bg-white/5">
                <p className="text-sm font-medium">Plot Development</p>
                <p className="text-sm text-muted-foreground mt-1">
                  That&apos;s brilliant! We could use this to foreshadow her
                  role in the prophecy.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div className="flex-1 p-3 rounded-lg bg-violet-500/10">
                <p className="text-sm font-medium">Suggested Plot Points</p>
                <div className="mt-2 space-y-1">
                  <Badge variant="outline" className="mr-2">
                    Crystal Resonance
                  </Badge>
                  <Badge variant="outline" className="mr-2">
                    Hidden Powers
                  </Badge>
                  <Badge variant="outline">Ancient Prophecy</Badge>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="flex gap-2">
          <Input placeholder="Share your ideas..." className="flex-1" />
          <Button size="icon" variant="secondary">
            <Sparkles className="h-4 w-4" />
          </Button>
          <Button size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    ),
    features: [
      "AI-powered story development suggestions",
      "Real-time collaborative brainstorming",
      "Intelligent plot analysis and recommendations",
      "Character interaction simulations",
      "Automated plot consistency checking",
      "Smart scene planning assistance",
    ],
  },
  {
    title: "Weave Anime",
    description:
      "Create stunning anime-style art with our advanced AI generation system",
    icon: <Palette className="h-8 w-8 text-pink-500" />,
    color: "pink",
    demo: (
      <div className="h-full w-full bg-white/5 backdrop-blur-sm rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Character Visualization</h3>
            <p className="text-sm text-muted-foreground">
              AI Art Generation Studio
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Sparkles className="w-4 h-4 mr-2" />
              Enhance
            </Button>
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Character Description
              </label>
              <ScrollArea className="h-[80px] w-full rounded-lg border border-white/10 p-3 mt-2">
                <p className="text-sm text-muted-foreground">
                  Elena Blackwood, a young mage with flowing silver hair and
                  ethereal violet eyes. Her elegant robes feature intricate
                  crystal patterns that shimmer with magical energy.
                </p>
              </ScrollArea>
            </div>
            <div>
              <label className="text-sm font-medium">Style Settings</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Badge variant="secondary">Anime</Badge>
                <Badge variant="secondary">Magical</Badge>
                <Badge variant="outline">Detailed</Badge>
                <Badge variant="outline">Dynamic</Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Generation Progress</label>
              <div className="mt-2 space-y-2">
                <div className="h-2 rounded bg-pink-500/20">
                  <div className="h-full w-2/3 rounded bg-pink-500 animate-pulse" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Generating variations...
                </p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/30 via-pink-500/30 to-blue-500/30 rounded-lg animate-pulse" />
            <div className="relative h-full border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-pink-500 animate-pulse" />
                <p className="text-sm text-muted-foreground">
                  AI Processing...
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-4 border-t border-white/10">
          <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Variations
          </Button>
        </div>
      </div>
    ),
    features: [
      "Advanced AI art generation engine",
      "Natural language character description",
      "Multiple style and mood options",
      "Real-time art generation preview",
      "Batch processing and variations",
      "High-resolution export options",
    ],
  },
  {
    title: "Profile Dashboard",
    description:
      "Track your creative journey with AI-powered analytics and insights",
    icon: <Settings className="h-8 w-8 text-orange-500" />,
    color: "orange",
    demo: (
      <div className="h-full w-full bg-white/5 backdrop-blur-sm rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-orange-500/20">
              <AvatarImage src="/placeholder.jpg" />
              <AvatarFallback>SL</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">Creative Analytics</h3>
              <p className="text-sm text-muted-foreground">
                AI Writing Insights • Premium Member
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Report
          </Button>
        </div>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 p-4 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Writing Analysis</p>
                  <p className="text-2xl font-bold">Exceptional Progress</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white/5">
              <p className="text-sm font-medium">Writing Stats</p>
              <p className="text-2xl font-bold">157,000</p>
              <p className="text-xs text-muted-foreground mt-1">
                Words this month • +15% vs last month
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white/5">
              <p className="text-sm font-medium">AI Insights</p>
              <p className="text-2xl font-bold">94%</p>
              <p className="text-xs text-muted-foreground mt-1">
                Story Coherence Score
              </p>
            </div>
          </div>
          <div className="p-4 rounded-lg border border-white/10">
            <h4 className="text-sm font-medium mb-3">AI Writing Assistant</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Style consistency improved by 23%</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Character development is trending upward</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <span>3 new plot enhancement suggestions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    features: [
      "AI-powered writing analytics",
      "Personal progress tracking",
      "Style and consistency analysis",
      "Character development insights",
      "Plot strength evaluation",
      "Customized improvement suggestions",
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
              Powerful Features for Creative Writers
            </h1>
            <p className="text-xl text-muted-foreground">
              Discover the tools and features that will help you bring your
              stories to life
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
          <h2 className="text-3xl font-bold">Ready to Start Your Journey?</h2>
          <p className="text-lg text-muted-foreground">
            Join our community of creative writers and bring your stories to
            life
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600"
            >
              Get Started
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
