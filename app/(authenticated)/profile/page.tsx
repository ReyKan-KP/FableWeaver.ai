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
