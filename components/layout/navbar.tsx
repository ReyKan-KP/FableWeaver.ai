"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Moon,
  Sun,
  LogIn,
  LogOut,
  UserPlus,
  User,
  Menu,
  X,
  ChevronDown,
  Wand2,
  Sparkles,
  Layout,
  CreditCard,
  House,
  MessageSquareQuote,
  UsersRound,
  NotebookPen,
  Info,
  BookOpen,
  Handshake,
  Newspaper
} from "lucide-react";
import { CgFeed } from "react-icons/cg";
import { ThemeToggle } from "./theme-toggle";
import { MobileMenu } from "./mobile-menu";
import { title } from "process";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NotificationPanel } from "./notification-panel";
// import LastSeenUpdater from "@/components/providers/last-seen-updater";
import { updateLastSeen } from "@/lib/supabase";

const navItems = [
  {
    title: "Features",
    href: "/features",
    icon: Sparkles,
    description: "Explore all the features FableWeaver.ai has to offer",
  },
  {
    title: "About",
    href: "/about",
    icon: Info,
    description: "Learn more about FableWeaver.ai and our mission",
  },
  {
    title: "Thread Tapestry",
    href: "/thread-tapestry",
    icon: CgFeed,
    description: "Thread Tapestry is socialhub for storytellers",
  },
  {
    title: "Lore Lens",
    href: "/lore-lens",
    icon: Wand2,
    description: "Lore Lens is a tool for getting recommendations for stories",
  },

  {
    title: "Character Realm",
    href: "/character-realm",
    icon: MessageSquareQuote,
    description: "Create and manage your unique story characters",
  },
  {
    title: "Character Confluence",
    href: "/character-confluence",
    icon: UsersRound,
    description: "Explore character interactions and relationships",
  },
  {
    title: "Fable Sanctum",
    href: "/fable-trail",
    icon: BookOpen,
    description: "Discover and read published stories from our community",
  },
  {
    title: "Story Weaver",
    href: "/story-weaver",
    icon: NotebookPen,
    description: "Write and edit your stories with AI assistance",
  },
  {
    title: "Features",
    href: "#features",
    icon: Sparkles,
    description: "Explore all the features FableWeaver.ai has to offer",
    items: [
      {
        title: "Character Realm",
        href: "/character-realm",
        icon: MessageSquareQuote,
        description: "Create and manage your unique story characters",
      },
      {
        title: "Character Confluence",
        href: "/character-confluence",
        icon: UsersRound,
        description: "Explore character interactions and relationships",
      },
      {
        title: "Story Weaver",
        href: "/story-weaver",
        icon: NotebookPen,
        description: "Write and edit your stories with AI assistance",
      },
      {
        title: "Weaving your story Recommendation",
        href: "/weave-anime",
        icon: Wand2,
        description: "Get personalized story recommendations",
      },

    ],
  },
  {
    title: "Sign In",
    href: "/sign-in",
    icon: LogIn,
    description: "Access your FableWeaver.ai account",
  },
  {
    title: "Sign Up",
    href: "/sign-up",
    icon: UserPlus,
    description: "Create a new FableWeaver.ai account",
  },
];

export function Navbar() {
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("Home");
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const user = session?.user;
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      updateLastSeen(user.id);
      setLastSeen(new Date().toISOString());
      console.log("Last seen updated for user:", user.id, "at", lastSeen);
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut({ redirect: true });
    router.push("/");
  };

  const handleDropdownEnter = (title: string) => {
    setActiveDropdown(title);
  };

  const handleDropdownLeave = () => {
    setActiveDropdown(null);
  };

  useEffect(() => {
    const handleRouteChange = () => {
      const currentPath = window.location.pathname;
      const currentItem = navItems.find((item) => item.href === currentPath);
      if (currentItem) {
        setActiveTab(currentItem.title);
      }
    };

    handleRouteChange();
    window.addEventListener("popstate", handleRouteChange);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  return (
    <motion.nav
      className="fixed bg-[#bccff1] dark:bg-[#1e1e1f] top-0 sm:top-2 md:top-5 lg:top-10 left-0 sm:left-2 md:left-5 lg:left-10 right-0 sm:right-2 md:right-5 lg:right-10 px-2 sm:px-4 md:px-8 lg:px-20 py-2 z-50 rounded-full bg-opacity-50 dark:bg-opacity-50 backdrop-blur-lg shadow-lg border border-neutral-200 dark:border-white/[0.2]"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
    >
      <div className=" rounded-full mx-auto h-12 sm:h-14 md:h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-teal-500 text-transparent bg-clip-text pr-2 sm:pr-4 md:pr-6 flex items-center gap-2"
          onClick={() => setActiveTab("Home")}
        >
          <Image
            src="/images/logo.png"
            alt="FableWeaver.ai"
            className="w-45 h-45"
            width={80}
            height={80}
          />
          FableWeaver.ai
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-2 xl:space-x-8">
          {navItems.slice(0, 8).map((item, index) => (
            <div
              key={item.title}
              className="relative"
              onMouseEnter={() => {
                item.items && handleDropdownEnter(item.title);
                setHoveredTab(item.title);
              }}
              onMouseLeave={() => {
                handleDropdownLeave();
                setHoveredTab(null);
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className="flex items-center space-x-1 xl:space-x-2 text-xs xl:text-sm text-muted-foreground transition-colors hover:text-foreground group relative cursor-pointer font-semibold py-2 xl:py-3 rounded-full duration-300 hover:text-gray-900 dark:hover:text-white"
                        onClick={() => setActiveTab(item.title)}
                      >
                        {item.icon && (
                          <motion.div
                            whileHover={{ scale: 1.2, rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                            className="relative"
                          >
                            <motion.div
                              className="absolute inset-0 bg-purple-400/20 dark:bg-purple-600/20 rounded-full blur-md"
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0, 0.2, 0],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            />
                            <item.icon className="h-3 w-3 xl:h-4 xl:w-4 transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                          </motion.div>
                        )}
                        <span className="hidden md:inline">{item.title}</span>
                        {item.items && (
                          <ChevronDown className="h-3 w-3 xl:h-4 xl:w-4 transition-transform duration-200 group-hover:rotate-180" />
                        )}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{item.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.div>

              {/* Anime Mascot - Only show on larger screens */}
              {activeTab === item.title && (
                <motion.div
                  layoutId="anime-mascot"
                  className="absolute hidden xl:-top-12 lg:-top-10 left-1/2 -translate-x-1/2 pointer-events-none lg:block"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="relative w-12 h-12">
                    <motion.div
                      className="absolute w-10 h-10 bg-[#cdbcff] rounded-full left-1/2 -translate-x-1/2"
                      animate={
                        hoveredTab
                          ? {
                              scale: [1, 1.1, 1],
                              rotate: [0, -5, 5, 0],
                              transition: {
                                duration: 0.5,
                                ease: "easeInOut",
                              },
                            }
                          : {
                              y: [0, -3, 0],
                              transition: {
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                              },
                            }
                      }
                    >
                      <motion.div
                        className="absolute w-2 h-2 bg-black rounded-full"
                        animate={
                          hoveredTab
                            ? {
                                scaleY: [1, 0.2, 1],
                                transition: {
                                  duration: 0.2,
                                  times: [0, 0.5, 1],
                                },
                              }
                            : {}
                        }
                        style={{ left: "25%", top: "40%" }}
                      />
                      <motion.div
                        className="absolute w-2 h-2 bg-black rounded-full"
                        animate={
                          hoveredTab
                            ? {
                                scaleY: [1, 0.2, 1],
                                transition: {
                                  duration: 0.2,
                                  times: [0, 0.5, 1],
                                },
                              }
                            : {}
                        }
                        style={{ right: "25%", top: "40%" }}
                      />
                      <motion.div
                        className="absolute w-2 h-1.5 bg-pink-300 rounded-full"
                        animate={{
                          opacity: hoveredTab ? 0.8 : 0.6,
                        }}
                        style={{ left: "15%", top: "55%" }}
                      />
                      <motion.div
                        className="absolute w-2 h-1.5 bg-pink-300 rounded-full"
                        animate={{
                          opacity: hoveredTab ? 0.8 : 0.6,
                        }}
                        style={{ right: "15%", top: "55%" }}
                      />

                      <motion.div
                        className="absolute w-4 h-2 border-b-2 border-black rounded-full"
                        animate={
                          hoveredTab
                            ? {
                                scaleY: 1.5,
                                y: -1,
                              }
                            : {
                                scaleY: 1,
                                y: 0,
                              }
                        }
                        style={{ left: "30%", top: "60%" }}
                      />
                      <AnimatePresence>
                        {hoveredTab && (
                          <>
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0 }}
                              className="absolute -top-1 -right-1 w-2 h-2 text-yellow-300"
                            >
                              ✨
                            </motion.div>
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0 }}
                              transition={{ delay: 0.1 }}
                              className="absolute -top-2 left-0 w-2 h-2 text-yellow-300"
                            >
                              ✨
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </motion.div>
                    <motion.div
                      className="absolute -bottom-1 left-1/2 w-4 h-4 -translate-x-1/2"
                      animate={
                        hoveredTab
                          ? {
                              y: [0, -4, 0],
                              transition: {
                                duration: 0.3,
                                repeat: Infinity,
                                repeatType: "reverse",
                              },
                            }
                          : {
                              y: [0, 2, 0],
                              transition: {
                                duration: 1,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 0.5,
                              },
                            }
                      }
                    >
                      <div className="w-full h-full bg-[#cdbcff] rotate-45 transform origin-center" />
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Dropdown Menu */}
              {item.items && activeDropdown === item.title && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute rounded-full left-0 top-full mt-2 w-36 xl:w-48 border bg-background/80 p-2 backdrop-blur-lg"
                >
                  {item.items.map((subItem) => (
                    <TooltipProvider key={subItem.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={subItem.href}
                            className="flex items-center space-x-2 rounded-md px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground group"
                          >
                            {subItem.icon && (
                              <motion.div
                                whileHover={{ scale: 1.2, rotate: 10 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <subItem.icon className="h-4 w-4 transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                              </motion.div>
                            )}
                            <span>{subItem.title}</span>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{subItem.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </motion.div>
              )}
            </div>
          ))}
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {status === "authenticated" && session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-full"
                >
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10">
                    <AvatarImage
                      src={session.user?.image || undefined}
                      alt={session.user?.name || ""}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400">
                      {session.user?.name?.charAt(0).toUpperCase() ||
                        session.user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 sm:w-56" align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-red-600 dark:text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden lg:flex items-center pl-4 xl:pl-4 space-x-4 xl:space-x-8">
              {navItems.slice(9, 11).map((item, index) => (
                <div key={item.title} className="relative">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            className="flex items-center space-x-1 xl:space-x-2 text-xs xl:text-sm text-muted-foreground transition-colors hover:text-foreground group relative cursor-pointer font-semibold py-2 xl:py-3 rounded-full duration-300 hover:text-gray-900 dark:hover:text-white"
                            onClick={() => setActiveTab(item.title)}
                          >
                            {item.icon && (
                              <motion.div
                                whileHover={{ scale: 1.2, rotate: 10 }}
                                whileTap={{ scale: 0.9 }}
                                className="relative"
                              >
                                <item.icon className="h-3 w-3 xl:h-4 xl:w-4 transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                              </motion.div>
                            )}
                            <span>{item.title}</span>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{item.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </motion.div>
                </div>
              ))}
            </div>
          )}
          <div className="hidden sm:flex flex-row items-center space-x-4">
  <ThemeToggle />
  <NotificationPanel userId={session?.user?.id || ""} />
</div>


          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <MobileMenu
            navItems={navItems}
            session={session}
            handleSignOut={handleSignOut}
            setIsMenuOpen={setIsMenuOpen}
          />
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
