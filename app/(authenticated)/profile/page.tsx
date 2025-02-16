import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { AnimatedContent } from "./_components/animated-content";
import { subDays, format, startOfDay, endOfDay } from "date-fns";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/sign-in");
  }

  const supabase = createServerSupabaseClient();

  // Fetch user data, preferences, statistics, and group chats
  const [
    { data: userData },
    { data: userPreferences },
    { data: userStats },
    { data: createdGroups },
    { data: joinedGroups },
    { data: readingProgress },
    { data: readingStatus },
    { data: userComments },
    { data: userBookmarks },
  ] = await Promise.all([
    supabase
      .from("user")
      .select(
        `
        user_id,
        user_name,
        user_email,
        avatar_url,
        user_watched_list,
        created_at,
        is_active
      `
      )
      .eq("user_id", session.user.id)
      .single(),
    supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", session.user.id)
      .single(),
    supabase
      .from("user_statistics")
      .select("*")
      .eq("user_id", session.user.id)
      .single(),
    // Fetch groups created by the user
    supabase
      .from("group_chat_history")
      .select(
        `
        id,
        group_name,
        created_at,
        is_active,
        is_auto_chatting,
        users_id,
        characters_id
      `
      )
      .eq("creator_id", session.user.id)
      .order("created_at", { ascending: false }),
    // Fetch groups where user is a participant
    supabase
      .from("group_chat_history")
      .select(
        `
        id,
        group_name,
        created_at,
        is_active,
        is_auto_chatting,
        users_id,
        characters_id,
        messages
      `
      )
      .contains("users_id", [session.user.id])
      .neq("creator_id", session.user.id)
      .order("created_at", { ascending: false }),
    // Fetch reading progress
    supabase
      .from("reading_progress")
      .select("*")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false }),
    // Fetch reading status
    supabase
      .from("reading_status")
      .select("*")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false }),
    // Fetch user comments
    supabase
      .from("chapter_comments")
      .select("*, comment_reactions(*)")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false }),
    // Fetch user bookmarks
    supabase
      .from("novel_bookmarks")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false }),
  ]);

  // Process group data to include counts and last message time
  const processedCreatedGroups =
    createdGroups?.map((group) => ({
      ...group,
      users_count: (group.users_id || []).length,
      characters_count: (group.characters_id || []).length,
      last_message_at: group.created_at, // You might want to get this from messages if available
    })) || [];

  const processedJoinedGroups =
    joinedGroups?.map((group) => {
      const messages = group.messages || [];
      return {
        ...group,
        users_count: (group.users_id || []).length,
        characters_count: (group.characters_id || []).length,
        last_message_at:
          messages.length > 0
            ? messages[messages.length - 1].timestamp
            : group.created_at,
      };
    }) || [];

  // Process reading analytics data
  const commentsByDate =
    userComments?.reduce(
      (
        acc: {
          [key: string]: {
            date: string;
            comments: number;
            reactions: number;
            likes: number;
            dislikes: number;
          };
        },
        comment
      ) => {
        const date = format(new Date(comment.created_at), "MMM dd");
        if (!acc[date]) {
          acc[date] = {
            date,
            comments: 0,
            reactions: 0,
            likes: 0,
            dislikes: 0,
          };
        }
        acc[date].comments += 1;
        acc[date].reactions += comment.comment_reactions?.length || 0;
        acc[date].likes += comment.likes_count || 0;
        acc[date].dislikes += comment.dislikes_count || 0;
        return acc;
      },
      {}
    ) || {};

  // Process reading progress by novel
  const readingProgressByNovel =
    readingProgress?.reduce(
      (
        acc: {
          [key: string]: {
            novel_id: string;
            progress: number;
            last_position: string;
            last_updated: string;
          }[];
        },
        progress
      ) => {
        if (!acc[progress.novel_id]) {
          acc[progress.novel_id] = [];
        }
        acc[progress.novel_id].push({
          novel_id: progress.novel_id,
          progress: progress.progress_percentage,
          last_position: progress.last_position,
          last_updated: progress.updated_at,
        });
        return acc;
      },
      {}
    ) || {};

  // Get reading status statistics
  const readingStatusStats = {
    completed:
      readingStatus?.filter((s) => s.status === "completed").length || 0,
    reading: readingStatus?.filter((s) => s.status === "reading").length || 0,
    onHold: readingStatus?.filter((s) => s.status === "on_hold").length || 0,
    dropped: readingStatus?.filter((s) => s.status === "dropped").length || 0,
    planToRead:
      readingStatus?.filter((s) => s.status === "plan_to_read").length || 0,
  };

  // Process bookmarks with notes
  const bookmarksByDate =
    userBookmarks?.reduce(
      (
        acc: {
          [key: string]: {
            date: string;
            count: number;
            withNotes: number;
          };
        },
        bookmark
      ) => {
        const date = format(new Date(bookmark.created_at), "MMM dd");
        if (!acc[date]) {
          acc[date] = {
            date,
            count: 0,
            withNotes: 0,
          };
        }
        acc[date].count += 1;
        if (bookmark.note) {
          acc[date].withNotes += 1;
        }
        return acc;
      },
      {}
    ) || {};

  const readingAnalytics = {
    totalBooksRead: readingStatusStats.completed,
    inProgressBooks: readingStatusStats.reading,
    totalBookmarks: userBookmarks?.length || 0,
    totalComments: userComments?.length || 0,
    averageProgress: readingProgress
      ? readingProgress.reduce(
          (acc, curr) => acc + (curr.progress_percentage || 0),
          0
        ) / readingProgress.length
      : 0,
    readingHistory:
      readingProgress?.map((progress) => ({
        date: format(new Date(progress.updated_at), "MMM dd"),
        progress: progress.progress_percentage,
      })) || [],
    commentActivity: Object.values(commentsByDate).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    ),
    readingStatusDistribution: readingStatusStats,
    bookmarkActivity: Object.values(bookmarksByDate).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    ),
    lastReadAt: readingStatus?.[0]?.last_read_at || null,
  };

  // Fetch novels for recent stories and genre distribution
  const { data: novelsData } = await supabase
    .from("novels")
    .select(
      `
      id,
      title,
      genre,
      chapter_count,
      total_words,
      cover_image,
      created_at,
      is_published,
      is_public,
      metadata
    `
    )
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch recent chat history with character names
  const { data: recentChats } = await supabase
    .from("chat_history")
    .select(
      `
      id,
      created_at,
      messages,
      character_profiles:character_id (
        name
      )
    `
    )
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Calculate genre distribution from all novels
  const { data: allNovels } = await supabase
    .from("novels")
    .select("genre")
    .eq("user_id", session.user.id);

  const genreDistribution = allNovels
    ? Object.entries(
        allNovels.reduce(
          (acc, novel) => {
            const genre = novel.genre || "Uncategorized";
            acc[genre] = (acc[genre] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        )
      ).map(([genre, count]) => ({ genre, count }))
    : [];

  // Calculate word count history for the last 30 days
  const thirtyDaysAgo = subDays(new Date(), 30);
  const { data: wordHistory } = await supabase
    .from("novels")
    .select("total_words, created_at, updated_at")
    .eq("user_id", session.user.id)
    .gte("updated_at", thirtyDaysAgo.toISOString());

  const wordCountHistory = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), i);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const dayWords =
      wordHistory
        ?.filter((novel) => {
          const updateDate = new Date(novel.updated_at);
          return updateDate >= dayStart && updateDate <= dayEnd;
        })
        .reduce((sum, novel) => sum + (novel.total_words || 0), 0) || 0;

    return {
      date: format(date, "MMM dd"),
      count: dayWords,
    };
  }).reverse();

  // Format recent activity
  const recentActivity = [
    ...(novelsData?.map((novel) => ({
      id: novel.id,
      type: "novel",
      description: `Created story "${novel.title}"`,
      created_at: novel.created_at,
    })) || []),
    ...(recentChats?.map((chat) => ({
      id: chat.id,
      type: "chat",
      description: `Chatted with character "${chat.character_profiles?.[0]?.name || "Unknown Character"}"`,
      created_at: chat.created_at,
    })) || []),
  ]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  // Get writing goals from user preferences
  const writingGoals = userPreferences?.writing_goals || {
    daily_words: 500,
    weekly_stories: 1,
  };

  return (
    <div className=" bg-gradient-to-b from-background to-secondary/10 py-8 sm:px-6 lg:px-8">
      <AnimatedContent
        user={{
          id: session.user.id,
          name: userData?.user_name || session.user.name || "",
          email: userData?.user_email || session.user.email || "",
          image: userData?.avatar_url || session.user.image || "",
        }}
        statistics={{
          storiesCreated: userStats?.stories_count || 0,
          chaptersWritten: userStats?.chapters_count || 0,
          charactersCreated: userStats?.characters_count || 0,
          totalWords: userStats?.total_words || 0,
          publishedStories: userStats?.published_stories || 0,
          wordCountHistory,
          genreDistribution,
          averageWordsPerDay: userStats?.average_words_per_day || 0,
          longestWritingStreak: userStats?.longest_writing_streak || 0,
          currentWritingStreak: userStats?.current_writing_streak || 0,
          completionRate: userStats?.completion_rate || 0,
          lastWritingDate: userStats?.last_writing_date || null,
        }}
        readingAnalytics={readingAnalytics}
        recentStories={
          novelsData?.map((novel) => ({
            id: novel.id,
            title: novel.title,
            created_at: novel.created_at,
            genre: novel.genre,
            status: novel.is_published ? "published" : "draft",
            coverImage: novel.cover_image,
          })) || []
        }
        recentActivity={recentActivity}
        preferences={
          userPreferences || {
            theme: "system",
            email_notifications: true,
            writing_goals: writingGoals,
          }
        }
        createdGroups={processedCreatedGroups}
        joinedGroups={processedJoinedGroups}
      />
    </div>
  );
}
