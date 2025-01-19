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

  const handleDropdownToggle = (title: string) => {
    setActiveDropdown((prev) => (prev === title ? null : title));
  };

  return (
    <motion.div
      className="lg:hidden absolute top-full left-0 right-0 bg-[#d6d5df] dark:bg-[#1e1e1f] bg-opacity-30 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800 py-4"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={menuVariants}
    >
      <div className="container mx-auto px-4">
        {navItems.map((item) => (
          <div key={item.title} className="py-2">
            {item.items ? (
              <div>
                <button
                  onClick={() => handleDropdownToggle(item.title)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="flex items-center space-x-2">
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${
                      activeDropdown === item.title ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {activeDropdown === item.title && (
                  <div className="mt-2 ml-6 space-y-2">
                    {item.items.map((subItem) => (
                      <Link
                        key={subItem.title}
                        href={subItem.href}
                        className="flex items-center space-x-2 py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <subItem.icon className="h-4 w-4" />
                        <span>{subItem.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={item.href}
                className="flex items-center space-x-2 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            )}
          </div>
        ))}
        {session ? (
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center space-x-4 mb-4">
              <Avatar>
                <AvatarImage
                  src={session.user?.image || undefined}
                  alt={session.user?.name || ""}
                />
                <AvatarFallback>
                  {session.user?.name?.charAt(0).toUpperCase() ||
                    session.user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{session.user?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {session.user?.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                handleSignOut();
                setIsMenuOpen(false);
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
            <Link href="/login" onClick={() => setIsMenuOpen(false)}>
              <Button variant="outline" className="w-full">
                Log In
              </Button>
            </Link>
            <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
              <Button className="w-full">Sign Up</Button>
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
};
