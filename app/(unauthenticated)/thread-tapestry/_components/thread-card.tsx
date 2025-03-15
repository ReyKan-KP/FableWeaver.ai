"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share2,
  Flag,
  Trash2,
  Bookmark,
  ExternalLink,
  MoreHorizontal,
  Edit,
  Sparkles
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import type { Thread } from "@/types/threads"
import Comments from "./comments"
import { UserAvatar } from "@/components/user-avatar"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import AIFeatures from "./ai-features"

interface ThreadCardProps {
  thread: Thread
  onThreadSelect: (threadId: string) => void
  userReaction: "like" | "dislike" | null
  isSaved: boolean
  expandedThreadId: string | null
  setExpandedThreadId: (id: string | null) => void
  onReaction: (threadId: string, type: "like" | "dislike") => void
  onSave: (threadId: string) => void
  onReport: (threadId: string) => void
  onDelete?: (threadId: string) => void
  className?: string
}

export default function ThreadCard({
  thread,
  onThreadSelect,
  userReaction,
  isSaved,
  expandedThreadId,
  setExpandedThreadId,
  onReaction,
  onSave,
  onReport,
  onDelete,
  className,
}: ThreadCardProps) {
  const { data: session } = useSession()
  const user = session?.user
  const isExpanded = expandedThreadId === thread.id
  const isOwner = user?.id === thread.user_id
  const router = useRouter()
  const [showFullContent, setShowFullContent] = useState(false)
  const [showAIFeatures, setShowAIFeatures] = useState(false)

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      // Today - show time
      return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    }
  }

  const contentLength = thread.content.length
  const shouldTruncate = contentLength > 300
  const displayContent = shouldTruncate && !showFullContent
    ? thread.content.slice(0, 300) + "..."
    : thread.content

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn("group", className)}
    >
      <Card className="overflow-hidden transition-all duration-300 border-neutral-200 dark:border-neutral-800 hover:shadow-lg">
        {/* Card Header with user info */}
        <CardHeader className="p-4 pb-3 space-y-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href={`/user/${thread.user?.user_name || thread.user_id}`}
                onClick={(e) => e.stopPropagation()}
                className="transition-transform hover:scale-105"
              >
                <UserAvatar
                  userId={thread.user_id}
                  userName={thread.user?.user_name || `User ${thread.user_id.slice(0, 4)}`}
                  avatarUrl={thread.user?.avatar_url || null}
                  size="sm"
                />
              </Link>
              <div>
                <Link
                  href={`/user/${thread.user?.user_name || thread.user_id}`}
                  className="font-medium hover:underline text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  {thread.user?.user_name || `User ${thread.user_id.slice(0, 4)}`}
                </Link>
                <p className="text-xs text-neutral-500">{formatDate(thread.created_at)}</p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4" />
                  <span className="sr-only">Thread options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onSave(thread.id)
                  }}
                  className={cn(isSaved && "text-blue-500")}
                >
                  <Bookmark className="w-4 h-4 mr-2" />
                  {isSaved ? "Unsave thread" : "Save thread"}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onReport(thread.id)
                  }}
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Report thread
                </DropdownMenuItem>

                {isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/thread-tapestry/edit/${thread.id}`)
                      }}
                      className="text-blue-500 focus:text-blue-500"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit thread
                    </DropdownMenuItem>
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(thread.id)
                        }}
                        className="text-red-500 focus:text-red-500"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete thread
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* Categories and Tags */}
          <div className="flex flex-wrap gap-1.5 py-4">
            <Badge variant="outline" className="capitalize bg-neutral-50 dark:bg-neutral-900 text-xs">
              {thread.category}
            </Badge>
            {thread.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardHeader>

        {/* Card Content */}
        <CardContent className="p-4 pt-0 cursor-pointer" onClick={() => router.push(`/thread-tapestry/${thread.id}`)}>
          {/* Thread Title */}
          <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {thread.title}
          </h3>

          {/* Thread Content */}
          <div className="prose dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{displayContent}</p>
            {shouldTruncate && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowFullContent(!showFullContent)
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline mt-2"
              >
                {showFullContent ? "Show less" : "Read more"}
              </button>
            )}
          </div>

          {/* Thread Images */}
          {thread.images.length > 0 && (
            <div
              className={cn(
                "mb-4 rounded-md overflow-hidden grid gap-1",
                thread.images.length === 1 ? "grid-cols-1" : thread.images.length === 2 ? "grid-cols-2" : "grid-cols-3",
              )}
            >
              {thread.images.slice(0, 3).map((image, index) => (
                <div
                  key={index}
                  className={cn(
                    "relative overflow-hidden  rounded-md",
                    thread.images.length === 1 ? "aspect-video" : "aspect-square",
                  )}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`Thread image ${index + 1}`}
                    fill
                    className="object-contain hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
              {thread.images.length > 3 && (
                <div className="relative aspect-square rounded-md overflow-hidden bg-neutral-800/70 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">+{thread.images.length - 3} more</span>
                </div>
              )}
            </div>
          )}

          
        </CardContent>

        <Separator className="mx-4" />

        {/* Thread Actions */}
        <CardFooter className="p-2 flex items-center justify-between">
          <div className="flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-2 gap-1.5 text-xs font-normal rounded-full",
                      userReaction === "like"
                        ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                      userReaction === "dislike" && "opacity-50",
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (userReaction !== "dislike") {
                        onReaction(thread.id, "like")
                      }
                    }}
                    disabled={userReaction === "dislike"}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {thread.likes_count > 0 && <span>{thread.likes_count}</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{userReaction === "like" ? "Remove like" : "Like"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-2 gap-1.5 text-xs font-normal rounded-full",
                      userReaction === "dislike"
                        ? "text-red-500 bg-red-50 dark:bg-red-900/20"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                      userReaction === "like" && "opacity-50",
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (userReaction !== "like") {
                        onReaction(thread.id, "dislike")
                      }
                    }}
                    disabled={userReaction === "like"}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    {thread.dislikes_count > 0 && <span>{thread.dislikes_count}</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{userReaction === "dislike" ? "Remove dislike" : "Dislike"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-2 gap-1.5 text-xs font-normal rounded-full",
                      isExpanded && "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
                      !isExpanded && "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedThreadId(isExpanded ? null : thread.id)
                    }}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {thread.comments_count > 0 && <span>{thread.comments_count}</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isExpanded ? "Hide comments" : "Show comments"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Get the current URL
                      const origin = window.location.origin
                      const shareUrl = `${origin}/thread-tapestry/${thread.id}`
                      
                      // Copy to clipboard
                      navigator.clipboard.writeText(shareUrl)
                        .then(() => {
                          toast.success("Link copied to clipboard", {
                            description: "You can now share this thread with others.",
                            duration: 3000,
                          })
                        })
                        .catch(() => {
                          toast.error("Failed to copy link", {
                            description: "Please try again or copy the URL manually.",
                          })
                        })
                    }}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="sr-only">Share thread</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share thread</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/thread-tapestry/${thread.id}`)
                    }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="sr-only">View full thread</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View full thread</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardFooter>

        {/* AI Features */}
        <div className="py-4 border-t border-gray-200 dark:border-gray-800 flex justify-center items-center">
          <AIFeatures content={thread.content} threadId={thread.id} />
        </div>

        {/* Comments Section */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="pt-4 border-t border-gray-200 dark:border-gray-800"
          >
            <Comments threadId={thread.id} />
          </motion.div>
        )}
      </Card>
    </motion.div>
  )
}

