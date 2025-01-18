import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, UserPlus, User } from "lucide-react";

interface MobileMenuProps {
  navItems: Array<{
    title: string;
    href: string;
    items?: Array<{ title: string; href: string }>;
  }>;
  session: any;
  handleSignOut: () => void;
}

export function MobileMenu({
  navItems,
  session,
  handleSignOut,
}: MobileMenuProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-x-0 top-16 z-50 border-b bg-background md:hidden"
    >
      <div className="container mx-auto space-y-4 p-4">
        {navItems.map((item, index) => (
          <div key={item.title}>
            <Link
              href={item.href}
              className="flex items-center justify-between py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {item.title}
            </Link>
            {item.items && (
              <div className="ml-4 space-y-2 pt-2">
                {item.items.map((subItem) => (
                  <Link
                    key={subItem.title}
                    href={subItem.href}
                    className="block py-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {subItem.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
        <div className="space-y-4 pt-4">
          {session ? (
            <>
              <Link
                href="/profile"
                className="flex items-center py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
              <Button
                onClick={handleSignOut}
                className="w-full justify-start text-red-600 dark:text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                className="w-full justify-start hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="w-full justify-start hover:bg-green-100 dark:hover:bg-green-900"
              >
                <Link href="/signup">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign Up
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
