import { createBrowserSupabaseClient } from '@/lib/supabase';
import type { Thread, Comment, Reaction, Report, SavedThread } from '@/types/threads';

const supabase = createBrowserSupabaseClient();

export const threadService = {
  // Thread operations
  async createThread(data: Omit<Thread, 'id' | 'created_at' | 'updated_at' | 'likes_count' | 'dislikes_count' | 'comments_count' | 'views_count'>) {
    // Make sure user_id is a string and tags is an array
    const threadData = {
      ...data,
      user_id: String(data.user_id),
      tags: Array.isArray(data.tags) ? data.tags.filter(tag => tag && typeof tag === 'string').map(tag => tag.trim().toLowerCase()) : []
    };

    const { data: thread, error } = await supabase
      .from('threads')
      .insert([threadData])
      .select()
      .single();

    if (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
    return thread;
  },

  async getThreads(options: {
    category?: string;
    search?: string;
    sort?: 'latest' | 'popular' | 'trending';
    limit?: number;
    offset?: number;
  } = {}) {
    let query = supabase
      .from('threads')
      .select('*')
      .eq('status', 'active');

    if (options.category) {
      query = query.eq('category', options.category);
    }

    if (options.search) {
      query = query.or(`title.ilike.%${options.search}%,content.ilike.%${options.search}%`);
    }

    switch (options.sort) {
      case 'popular':
        query = query.order('likes_count', { ascending: false });
        break;
      case 'trending':
        // Simple trending algorithm based on recent engagement
        query = query.order('created_at', { ascending: false })
          .order('likes_count', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    try {
      const { data, error } = await query;

      if (error) throw error;
      
      // Fetch user data separately for each thread
      const threadsWithUsers = await Promise.all(
        data.map(async (thread) => {
          try {
            // Check if the user table is named 'user' or 'users'
            let userData = null;
            
            // Try with 'user' table first
            const { data: userDataResult, error: userError } = await supabase
              .from('user')
              .select('user_id, user_name, avatar_url')
              .eq('user_id', String(thread.user_id))
              .single();
            
            if (userError) {
              console.error('Error fetching from user table:', userError);
              
              // Try with 'users' table as fallback
              const { data: usersDataResult, error: usersError } = await supabase
                .from('users')
                .select('id, name, image')
                .eq('id', String(thread.user_id))
                .single();
              
              if (!usersError && usersDataResult) {
                // Map users table fields to expected format
                userData = {
                  user_id: usersDataResult.id,
                  user_name: usersDataResult.name,
                  avatar_url: usersDataResult.image
                };
              } else {
                console.error('Error fetching from users table:', usersError);
              }
            } else {
              userData = userDataResult;
            }
            
            return { ...thread, user: userData };
          } catch (error) {
            console.error('Error in user data fetch:', error);
            return { ...thread, user: null };
          }
        })
      );
      
      return threadsWithUsers;
    } catch (error) {
      console.error('Error in getThreads:', error);
      throw error;
    }
  },

  async getThread(id: string) {
    try {
      const { data, error } = await supabase
        .from('threads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      try {
        // Check if the user table is named 'user' or 'users'
        let userData = null;
        
        // Try with 'user' table first
        const { data: userDataResult, error: userError } = await supabase
          .from('user')
          .select('user_id, user_name, avatar_url')
          .eq('user_id', String(data.user_id))
          .single();
        
        if (userError) {
          console.error('Error fetching from user table:', userError);
          
          // Try with 'users' table as fallback
          const { data: usersDataResult, error: usersError } = await supabase
            .from('users')
            .select('id, name, image')
            .eq('id', String(data.user_id))
            .single();
          
          if (!usersError && usersDataResult) {
            // Map users table fields to expected format
            userData = {
              user_id: usersDataResult.id,
              user_name: usersDataResult.name,
              avatar_url: usersDataResult.image
            };
          } else {
            console.error('Error fetching from users table:', usersError);
          }
        } else {
          userData = userDataResult;
        }
        
        return { ...data, user: userData };
      } catch (error) {
        console.error('Error in user data fetch:', error);
        return { ...data, user: null };
      }
    } catch (error) {
      console.error('Error in getThread:', error);
      throw error;
    }
  },

  async updateThread(id: string, data: Partial<Thread>) {
    // Ensure tags is an array if provided
    const updateData = {
      ...data,
      tags: data.tags 
        ? Array.isArray(data.tags) 
          ? data.tags.filter(tag => tag && typeof tag === 'string').map(tag => tag.trim().toLowerCase())
          : []
        : undefined
    };

    const { data: thread, error } = await supabase
      .from('threads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating thread:', error);
      throw error;
    }
    return thread;
  },

  async deleteThread(id: string) {
    const { error } = await supabase
      .from('threads')
      .update({ status: 'deleted' })
      .eq('id', id);

    if (error) throw error;
  },

  // Comment operations
  async createComment(data: Omit<Comment, 'id' | 'created_at' | 'updated_at' | 'likes_count' | 'dislikes_count'>) {
    // Make sure user_id is a string
    const commentData = {
      ...data,
      user_id: String(data.user_id)
    };

    const { data: comment, error } = await supabase
      .from('comments')
      .insert([commentData])
      .select()
      .single();

    if (error) throw error;
    return comment;
  },

  async getComments(threadId: string) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('thread_id', threadId)
        .eq('status', 'active')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Fetch user data separately for each comment
      const commentsWithUsers = await Promise.all(
        data.map(async (comment) => {
          try {
            // Check if the user table is named 'user' or 'users'
            let userData = null;
            
            // Try with 'user' table first
            const { data: userDataResult, error: userError } = await supabase
              .from('user')
              .select('user_id, user_name, avatar_url')
              .eq('user_id', String(comment.user_id))
              .single();
            
            if (userError) {
              console.error('Error fetching from user table:', userError);
              
              // Try with 'users' table as fallback
              const { data: usersDataResult, error: usersError } = await supabase
                .from('users')
                .select('id, name, image')
                .eq('id', String(comment.user_id))
                .single();
              
              if (!usersError && usersDataResult) {
                // Map users table fields to expected format
                userData = {
                  user_id: usersDataResult.id,
                  user_name: usersDataResult.name,
                  avatar_url: usersDataResult.image
                };
              } else {
                console.error('Error fetching from users table:', usersError);
              }
            } else {
              userData = userDataResult;
            }
            
            return { ...comment, user: userData };
          } catch (error) {
            console.error('Error in user data fetch:', error);
            return { ...comment, user: null };
          }
        })
      );
      
      return commentsWithUsers;
    } catch (error) {
      console.error('Error in getComments:', error);
      throw error;
    }
  },

  async deleteComment(id: string) {
    // First, get all child comments
    const { data: childComments, error: childError } = await supabase
      .from('comments')
      .select('id')
      .eq('parent_id', id)
      .eq('status', 'active');

    if (childError) throw childError;

    // Delete all child comments first
    if (childComments && childComments.length > 0) {
      const childIds = childComments.map(comment => comment.id);
      const { error: deleteChildrenError } = await supabase
        .from('comments')
        .update({ status: 'deleted' })
        .in('id', childIds);

      if (deleteChildrenError) throw deleteChildrenError;
    }

    // Then delete the parent comment
    const { error } = await supabase
      .from('comments')
      .update({ status: 'deleted' })
      .eq('id', id);

    if (error) throw error;
  },

  // Reaction operations
  async addReaction(data: Omit<Reaction, 'id' | 'created_at'>) {
    // Make sure user_id is a string
    const reactionData = {
      ...data,
      user_id: String(data.user_id)
    };

    const { data: reaction, error } = await supabase
      .from('reactions')
      .upsert([reactionData], {
        onConflict: 'user_id,target_type,target_id'
      })
      .select()
      .single();

    if (error) throw error;
    return reaction;
  },

  async removeReaction(userId: string, targetType: 'thread' | 'comment', targetId: string) {
    const { error } = await supabase
      .from('reactions')
      .delete()
      .match({ user_id: String(userId), target_type: targetType, target_id: targetId });

    if (error) throw error;
  },

  // Report operations
  async createReport(data: Omit<Report, 'id' | 'created_at' | 'updated_at' | 'status'>) {
    // Make sure user_id is a string
    const reportData = {
      ...data,
      user_id: String(data.user_id)
    };

    const { data: report, error } = await supabase
      .from('reports')
      .insert([reportData])
      .select()
      .single();

    if (error) throw error;
    return report;
  },

  // Image upload
  async uploadImage(file: File, path: string) {
    const { data, error } = await supabase.storage
      .from('thread-images')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    return data;
  },

  async getImageUrl(path: string) {
    const { data } = supabase.storage
      .from('thread-images')
      .getPublicUrl(path);

    return data.publicUrl;
  },

  // Saved Threads operations
  async saveThread(userId: string, threadId: string) {
    const { data, error } = await supabase
      .from('saved_threads')
      .insert([{ user_id: String(userId), thread_id: threadId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async unsaveThread(userId: string, threadId: string) {
    const { error } = await supabase
      .from('saved_threads')
      .delete()
      .match({ user_id: String(userId), thread_id: threadId });

    if (error) throw error;
  },

  async getSavedThreads(userId: string) {
    try {
      const { data, error } = await supabase
        .from('saved_threads')
        .select(`
          *,
          thread:threads(*)
        `)
        .eq('user_id', String(userId))
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user data for each thread
      const savedThreadsWithUsers = await Promise.all(
        data.map(async (savedThread) => {
          if (!savedThread.thread) return savedThread;

          try {
            // Check if the user table is named 'user' or 'users'
            let userData = null;
            
            // Try with 'user' table first
            const { data: userDataResult, error: userError } = await supabase
              .from('user')
              .select('user_id, user_name, avatar_url')
              .eq('user_id', String(savedThread.thread.user_id))
              .single();
            
            if (userError) {
              console.error('Error fetching from user table:', userError);
              
              // Try with 'users' table as fallback
              const { data: usersDataResult, error: usersError } = await supabase
                .from('users')
                .select('id, name, image')
                .eq('id', String(savedThread.thread.user_id))
                .single();
              
              if (!usersError && usersDataResult) {
                // Map users table fields to expected format
                userData = {
                  user_id: usersDataResult.id,
                  user_name: usersDataResult.name,
                  avatar_url: usersDataResult.image
                };
              } else {
                console.error('Error fetching from users table:', usersError);
              }
            } else {
              userData = userDataResult;
            }
            
            return {
              ...savedThread,
              thread: { ...savedThread.thread, user: userData }
            };
          } catch (error) {
            console.error('Error in user data fetch:', error);
            return savedThread;
          }
        })
      );

      return savedThreadsWithUsers;
    } catch (error) {
      console.error('Error in getSavedThreads:', error);
      throw error;
    }
  },

  async isThreadSaved(userId: string, threadId: string) {
    const { data, error } = await supabase
      .from('saved_threads')
      .select('id')
      .eq('user_id', String(userId))
      .eq('thread_id', threadId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    return !!data;
  }
}; 