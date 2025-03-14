import { createServerSupabaseClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserProfile } from "./_components/user-profile";

interface UserProfilePageProps {
  params: {
    slug: string;
  };
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const supabase = createServerSupabaseClient();
  const session = await getServerSession(authOptions);
  
  // Extract user ID from the slug format "username-userId"
  const slugParts = params.slug.split('-');
  const userId = slugParts[slugParts.length - 1];
  
  // Check if the last part is a valid UUID
  const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
  
  // Fetch user data by ID if valid UUID, otherwise try by username
  let userData;
  let userError;
  
  if (isValidUuid) {
    // Fetch by user ID
    const result = await supabase
      .from("user")
      .select(
        `
        user_id,
        user_name,
        user_email,
        avatar_url,
        created_at,
        is_active
      `
      )
      .eq("user_id", userId)
      .single();
      
    userData = result.data;
    userError = result.error;
  } else {
    // Fallback to fetching by username for backward compatibility
    const decodedUsername = decodeURIComponent(params.slug);
    const result = await supabase
      .from("user")
      .select(
        `
        user_id,
        user_name,
        user_email,
        avatar_url,
        created_at,
        is_active
      `
      )
      .eq("user_name", decodedUsername)
      .single();
      
    userData = result.data;
    userError = result.error;
  }

  if (userError || !userData) {
    notFound();
  }

  // Fetch user statistics
  const { data: userStats } = await supabase
    .from("user_statistics")
    .select("*")
    .eq("user_id", userData.user_id)
    .single();

  // Fetch public stories
  const { data: publicStories } = await supabase
    .from("novels")
    .select(
      `
      id,
      title,
      genre,
      cover_image,
      created_at,
      is_published,
      is_public
    `
    )
    .eq("user_id", userData.user_id)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch user's characters
  const { data: userCharacters } = await supabase
    .from("character_profiles")
    .select(
      `
      id,
      name,
      description,
      content_source,
      content_types,
      image_url,
      created_at,
      is_public,
      is_active
    `
    )
    .eq("creator_id", userData.user_id)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(5);

  // Check friendship status if logged in
  let friendshipStatus = null;
  if (session?.user?.id) {
    const { data: friendship } = await supabase
      .from("friendships")
      .select("*")
      .or(
        `and(user_id.eq.${session.user.id},friend_id.eq.${userData.user_id}),and(user_id.eq.${userData.user_id},friend_id.eq.${session.user.id})`
      )
      .single();

    if (friendship) {
      friendshipStatus = friendship.status;
    }
  }

  // Fetch recent activity in public threads
  const { data: recentThreads } = await supabase
    .from("threads")
    .select(`
      id,
      title,
      content,
      created_at,
      category,
      likes_count,
      comments_count
    `)
    .eq("user_id", userData.user_id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(5);

  // Transform thread data to match expected structure
  const formattedThreads = recentThreads ? recentThreads.map(thread => ({
    id: thread.id,
    title: thread.title,
    content: thread.content,
    created_at: thread.created_at,
    category: thread.category,
    likes_count: thread.likes_count,
    comments_count: thread.comments_count,
    user: {
      user_id: userData.user_id,
      user_name: userData.user_name,
      avatar_url: userData.avatar_url
    }
  })) : null;

  return (
    <div className="container mx-auto py-8 px-4">
      <UserProfile
        user={userData}
        statistics={userStats}
        publicStories={publicStories}
        recentThreads={formattedThreads}
        userCharacters={userCharacters}
        friendshipStatus={friendshipStatus}
        isOwnProfile={session?.user?.id === userData.user_id}
      />
    </div>
  );
}
