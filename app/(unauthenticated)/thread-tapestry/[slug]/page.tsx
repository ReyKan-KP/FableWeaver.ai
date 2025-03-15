"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { threadService } from "@/lib/services/threads"
import ThreadCard from "../_components/thread-card"
import Comments from "../_components/comments"
import type { Thread } from "@/types/threads"
import { toast } from "sonner"
import { createBrowserSupabaseClient } from "@/lib/supabase"

export default function ThreadPage({ params }: { params: { slug: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [thread, setThread] = useState<Thread | null>(null)
  const [loading, setLoading] = useState(true)
  const [userReaction, setUserReaction] = useState<"like" | "dislike" | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null)
  const isAuthenticated = status === "authenticated"
  const userId = session?.user?.id
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    const fetchThread = async () => {
      try {
        setLoading(true)
        const threadData = await threadService.getThread(params.slug)
        setThread(threadData)
        
        // Increment view count
        if (threadData) {
          await threadService.updateThread(threadData.id, {
            views_count: (threadData.views_count || 0) + 1
          })
        }
      } catch (error) {
        console.error("Error fetching thread:", error)
        toast.error("Error loading thread", {
          description: "The thread could not be loaded. It may have been deleted or doesn't exist."
        })
        router.push("/thread-tapestry")
      } finally {
        setLoading(false)
      }
    }

    fetchThread()
  }, [params.slug, router])

  useEffect(() => {
    const fetchUserReactionAndSaveStatus = async () => {
      if (!userId || !thread) return
      
      try {
        // Fetch user reaction
        const { data, error } = await supabase
          .from('reactions')
          .select('reaction_type')
          .eq('user_id', String(userId))
          .eq('target_type', 'thread')
          .eq('target_id', thread.id)
          .single()
        
        if (error) {
          console.error('Error fetching reaction:', error)
          setUserReaction(null)
        } else if (data) {
          setUserReaction(data.reaction_type as 'like' | 'dislike')
        }
        
        // Check if thread is saved
        const savedStatus = await threadService.isThreadSaved(userId, thread.id)
        setIsSaved(savedStatus)
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }

    fetchUserReactionAndSaveStatus()
  }, [userId, thread, supabase])

  const handleReaction = async (threadId: string, type: "like" | "dislike") => {
    if (!isAuthenticated) {
      toast.error("Authentication required", {
        description: "Please sign in to react to threads."
      })
      return
    }

    try {
      if (userReaction === type) {
        // Remove reaction if clicking the same one
        await threadService.removeReaction(userId!, "thread", threadId)
        setUserReaction(null)
        
        // Update thread in state
        if (thread) {
          const updatedThread = { ...thread }
          if (type === "like") {
            updatedThread.likes_count = Math.max(0, updatedThread.likes_count - 1)
          } else {
            updatedThread.dislikes_count = Math.max(0, updatedThread.dislikes_count - 1)
          }
          setThread(updatedThread)
        }
      } else {
        // Add or change reaction
        await threadService.addReaction({
          user_id: userId!,
          target_type: "thread",
          target_id: threadId,
          reaction_type: type
        })
        
        // Update thread in state
        if (thread) {
          const updatedThread = { ...thread }
          
          // If changing reaction
          if (userReaction) {
            if (type === "like") {
              updatedThread.likes_count += 1
              updatedThread.dislikes_count = Math.max(0, updatedThread.dislikes_count - 1)
            } else {
              updatedThread.dislikes_count += 1
              updatedThread.likes_count = Math.max(0, updatedThread.likes_count - 1)
            }
          } else {
            // If adding new reaction
            if (type === "like") {
              updatedThread.likes_count += 1
            } else {
              updatedThread.dislikes_count += 1
            }
          }
          
          setThread(updatedThread)
        }
        
        setUserReaction(type)
      }
    } catch (error) {
      console.error("Error handling reaction:", error)
      toast.error("Error with reaction", {
        description: "Something went wrong. Please try again."
      })
    }
  }

  const handleSave = async (threadId: string) => {
    if (!isAuthenticated) {
      toast.error("Authentication required", {
        description: "Please sign in to save threads."
      })
      return
    }

    try {
      if (isSaved) {
        await threadService.unsaveThread(userId!, threadId)
        setIsSaved(false)
        toast.success("Thread removed from saved")
      } else {
        await threadService.saveThread(userId!, threadId)
        setIsSaved(true)
        toast.success("Thread saved successfully")
      }
    } catch (error) {
      console.error("Error saving thread:", error)
      toast.error("Error saving thread", {
        description: "Something went wrong. Please try again."
      })
    }
  }

  const handleReport = async (threadId: string) => {
    if (!isAuthenticated) {
      toast.error("Authentication required", {
        description: "Please sign in to report threads."
      })
      return
    }

    try {
      await threadService.createReport({
        user_id: userId!,
        target_type: "thread",
        target_id: threadId,
        reason: "Inappropriate content"
      })
      toast.success("Thread reported", {
        description: "Thank you for helping us maintain a safe community."
      })
    } catch (error) {
      console.error("Error reporting thread:", error)
      toast.error("Error reporting thread", {
        description: "Something went wrong. Please try again."
      })
    }
  }

  const handleDelete = async (threadId: string) => {
    if (!isAuthenticated) {
      toast.error("Authentication required", {
        description: "Please sign in to delete threads."
      })
      return
    }

    try {
      await threadService.deleteThread(threadId)
      toast.success("Thread deleted", {
        description: "Your thread has been deleted."
      })
      router.push("/thread-tapestry")
    } catch (error) {
      console.error("Error deleting thread:", error)
      toast.error("Error deleting thread", {
        description: "Something went wrong. Please try again."
      })
    }
  }

  const handleThreadSelect = (threadId: string) => {
    // In the single thread view, we don't need to navigate to the thread
    // Instead, we'll just expand the comments section
    setExpandedThreadId(expandedThreadId === threadId ? null : threadId)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p className="text-lg text-gray-600 dark:text-gray-300">Loading thread...</p>
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-bold mb-4">Thread not found</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          The thread you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <Button onClick={() => router.push("/thread-tapestry")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Thread Tapestry
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        className="mb-6 hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={() => router.push("/thread-tapestry")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Thread Tapestry
      </Button>
      
      <div className="space-y-6">
        {/* Thread Card */}
        <ThreadCard
          thread={thread}
          onThreadSelect={handleThreadSelect}
          userReaction={userReaction}
          isSaved={isSaved}
          expandedThreadId={expandedThreadId}
          setExpandedThreadId={setExpandedThreadId}
          onReaction={handleReaction}
          onSave={handleSave}
          onReport={handleReport}
          onDelete={userId === thread.user_id ? handleDelete : undefined}
          className="max-w-none"
        />
        
        {/* Comments Section - Always visible on the thread page */}
        <Card className="p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
          <h3 className="text-xl font-semibold mb-4">Comments</h3>
          <Comments threadId={thread.id} />
        </Card>
      </div>
    </div>
  )
}
