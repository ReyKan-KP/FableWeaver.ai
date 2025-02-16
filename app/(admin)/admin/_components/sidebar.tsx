"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  MessageSquare,
  Settings,
  FileText,
  Bot,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { slideIn, springTransition } from "./animation-variants";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
    color: "from-indigo-500 to-blue-500",
  },
  {
    title: "Users",
    icon: Users,
    href: "/admin/users",
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Novels",
    icon: BookOpen,
    href: "/admin/novels",
    color: "from-cyan-500 to-teal-500",
  },
  {
    title: "Characters",
    icon: Bot,
    href: "/admin/characters",
    color: "from-teal-500 to-emerald-500",
  },
  {
    title: "Chat Groups",
    icon: MessageSquare,
    href: "/admin/chat-groups",
    color: "from-emerald-500 to-green-500",
  },
  {
    title: "Chapter Revisions",
    icon: FileText,
    href: "/admin/revisions",
    color: "from-green-500 to-lime-500",
  },
  {
    title: "AI Settings",
    icon: Sparkles,
    href: "/admin/ai-settings",
    color: "from-lime-500 to-yellow-500",
  },
  {
    title: "System Settings",
    icon: Settings,
    href: "/admin/settings",
    color: "from-yellow-500 to-orange-500",
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={springTransition}
      className={cn(
        "h-screen sticky top-0 bg-background border-r border-border flex flex-col z-30",
        "bg-gradient-to-b from-background via-background/80 to-background/50",
        "backdrop-blur-xl"
      )}
    >
      <div className="p-4 pb-2 flex flex-col gap-2">
        <div className="flex items-center justify-between h-16">
          {!collapsed && (
            <motion.div
              variants={slideIn}
              initial="initial"
              animate="animate"
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-violet-500 to-blue-500 bg-clip-text text-transparent">
                FableWeaver
              </span>
            </motion.div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <nav className="flex-1 w-full px-3 space-y-1 py-3">
        <AnimatePresence mode="wait">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ ...springTransition }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                    "hover:bg-accent group relative",
                    isActive && "bg-accent"
                  )}
                >
                  <motion.div
                    className={cn(
                      "absolute inset-0 rounded-lg opacity-0 bg-gradient-to-r",
                      item.color,
                      isActive ? "opacity-10" : "group-hover:opacity-5"
                    )}
                  />
                  <motion.div
                    whileHover={{ rotate: 15 }}
                    transition={springTransition}
                    className={cn(
                      "w-5 h-5 bg-gradient-to-br",
                      item.color,
                      "rounded-md flex items-center justify-center"
                    )}
                  >
                    <item.icon className="w-3 h-3 text-white" />
                  </motion.div>
                  {!collapsed && (
                    <span className={cn("flex-1", isActive && "font-medium")}>
                      {item.title}
                    </span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </AnimatePresence>
      </nav>

      <div className="p-4 mt-auto">
        <motion.div
          initial={false}
          animate={{ height: collapsed ? 40 : "auto" }}
          transition={springTransition}
        >
          <div
            className={cn(
              "p-3 rounded-lg",
              "bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-teal-500/10",
              "border border-border/50"
            )}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback>
                  {session?.user?.name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session?.user?.email}
                  </p>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 hover:bg-red-500/10 hover:text-red-500"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
