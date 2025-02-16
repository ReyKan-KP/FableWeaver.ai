import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Session } from "next-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronDown, LogOut } from "lucide-react";

interface MobileMenuProps {
  navItems: {
    title: string;
    href: string;
    icon: React.ElementType;
    items?: { title: string; href: string; icon: React.ElementType }[];
  }[];
  session: Session | null;
  handleSignOut: () => Promise<void>;
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  navItems,
  session,
  handleSignOut,
  setIsMenuOpen,
}) => {
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(
    null
  );

  const menuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut",
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2,
        ease: "easeIn",
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  const handleDropdownToggle = (title: string) => {
    setActiveDropdown((prev) => (prev === title ? null : title));
  };

  return (
    <motion.div
      className="lg:hidden fixed top-[3.5rem] rounded-lg sm:top-[4rem] md:top-[4.5rem] inset-x-0 min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#d6d5df]/80 to-white/90 dark:from-[#1e1e1f]/90 dark:to-black/80 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800 overflow-y-auto pb-safe-area-inset-bottom"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={menuVariants}
    >
      <div className="rounded-lg mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 max-w-lg">
        <motion.div className="space-y-2 sm:space-y-3 md:space-y-4">
          {navItems.map((item, index) => (
            <motion.div
              key={item.title}
              variants={itemVariants}
              custom={index}
              className="group"
            >
              {item.items ? (
                <div className="rounded-xl hover:bg-white/50 dark:hover:bg-black/20 transition-colors duration-200">
                  <button
                    onClick={() => handleDropdownToggle(item.title)}
                    className="flex items-center justify-between w-full text-left p-3 sm:p-4"
                  >
                    <span className="flex items-center space-x-3 sm:space-x-4">
                      <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                      <span className="text-sm sm:text-base md:text-lg font-medium">
                        {item.title}
                      </span>
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground transition-transform duration-200 ${
                        activeDropdown === item.title ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: activeDropdown === item.title ? "auto" : 0,
                      opacity: activeDropdown === item.title ? 1 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-4 sm:ml-6 md:ml-8 mr-2 sm:mr-4 space-y-1 sm:space-y-2 pb-2 sm:pb-3">
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.title}
                          href={subItem.href}
                          className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg hover:bg-white/80 dark:hover:bg-black/40 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <subItem.icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                          <span className="text-sm sm:text-base">
                            {subItem.title}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                </div>
              ) : (
                <Link
                  href={item.href}
                  className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-xl hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                  <span className="text-sm sm:text-base md:text-lg font-medium">
                    {item.title}
                  </span>
                </Link>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* User Section */}
        <motion.div
          variants={itemVariants}
          className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-neutral-200 dark:border-neutral-800"
        >
          {session ? (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                  <AvatarImage
                    src={session.user?.image || undefined}
                    alt={session.user?.name || ""}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white text-sm sm:text-base">
                    {session.user?.name?.charAt(0).toUpperCase() ||
                      session.user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm sm:text-base md:text-lg">
                    {session.user?.name}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {session.user?.email}
                  </p>
                </div>
              </div>
              <Link
                href={session?.user?.role === "admin" ? "/admin" : "/profile"}
                onClick={() => setIsMenuOpen(false)}
                className="block"
              >
                <Button
                  variant="outline"
                  className="w-full h-10 sm:h-11 md:h-12 text-sm sm:text-base"
                >
                  {session?.user?.role === "admin"
                    ? "Admin Dashboard"
                    : "Profile"}
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full h-10 sm:h-11 md:h-12 text-sm sm:text-base"
                onClick={() => {
                  handleSignOut();
                  setIsMenuOpen(false);
                }}
              >
                <LogOut className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <Link
                href="/sign-in"
                onClick={() => setIsMenuOpen(false)}
                className="block"
              >
                <Button
                  variant="outline"
                  className="w-full h-10 sm:h-11 md:h-12 text-sm sm:text-base"
                >
                  Sign In
                </Button>
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setIsMenuOpen(false)}
                className="block"
              >
                <Button className="w-full h-10 sm:h-11 md:h-12 text-sm sm:text-base bg-gradient-to-r from-purple-600 via-blue-600 to-teal-500 hover:from-purple-700 hover:via-blue-700 hover:to-teal-600">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};
