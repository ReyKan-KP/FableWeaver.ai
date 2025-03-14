export type User = {
    user_id: string;
    user_name: string;
    user_email?: string;
    avatar_url: string;
    is_active: boolean;
    created_at: string;
    last_seen: string;
  };
  
  export type Thread = {
    id: string;
    user_id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    images: string[];
    likes_count: number;
    dislikes_count: number;
    comments_count: number;
    views_count: number;
    status: 'active' | 'archived' | 'deleted';
    created_at: string;
    updated_at: string;
    user?: User;
  };
  
  export type Comment = {
    id: string;
    thread_id: string;
    user_id: string;
    parent_id?: string;
    content: string;
    likes_count: number;
    dislikes_count: number;
    status: 'active' | 'deleted';
    created_at: string;
    updated_at: string;
    user?: User;
  };
  
  export type Reaction = {
    id: string;
    user_id: string;
    target_type: 'thread' | 'comment';
    target_id: string;
    reaction_type: 'like' | 'dislike';
    created_at: string;
  };
  
  export type Report = {
    id: string;
    user_id: string;
    target_type: 'thread' | 'comment';
    target_id: string;
    reason: string;
    status: 'pending' | 'reviewed' | 'resolved';
    created_at: string;
    updated_at: string;
  };
  
  export type SavedThread = {
    id: string;
    user_id: string;
    thread_id: string;
    created_at: string;
    thread?: Thread;
  }; 