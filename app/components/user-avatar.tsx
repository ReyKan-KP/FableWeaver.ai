"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UserAvatarProps {
  userId: string;
  userName: string;
  avatarUrl: string | null;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
  isActive?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

export function UserAvatar({
  userId,
  userName,
  avatarUrl,
  size = "md",
  showStatus = false,
  isActive = false,
}: UserAvatarProps) {
  // Create a URL-friendly slug with both username and ID
  const createUserSlug = () => {
    // First encode the username to handle spaces and special characters
    const encodedUserName = encodeURIComponent(userName);
    
    // Create a slug that includes both username (for readability) and ID (for lookups)
    // Format: username-userId
    return `${encodedUserName}-${userId}`;
  };
  
  const userSlug = createUserSlug();
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={`/user/${userSlug}`} className="block">
            <div className="relative">
              <Avatar className={sizeClasses[size]}>
                <AvatarImage
                  src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`}
                  alt={userName}
                />
                <AvatarFallback>
                  <UserIcon className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              {showStatus && (
                <span
                  className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-white dark:border-gray-800 ${
                    isActive ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
              )}
            </div>
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isActive ? "Online" : "Offline"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 