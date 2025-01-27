export interface Message {
    timestamp: any;
    role: "user" | "assistant" | "system";
    content: string;
}

export interface Character {
    id: string;
    name: string;
    description: string;
    content_source: string;
    content_types: string[];
    fandom_url: string;
    dialogues: string[];
    is_active: boolean;
    is_public: boolean;
    creator_id: string;
    fandom_content?: string;
    personality?: string;
    background?: string;
    notable_quotes?: string;
    created_at: string;
    image_url?: string;
    additional_info?: Record<string, any>;
}

export interface ChatSession {
    id: string;
    character_id: string;
    user_id: string;
    session_id: string;
    messages: Message[];
    created_at: string;
}
export interface GroupChatMessage extends Message {
    sender_id: string
    sender_type: 'user' | 'character' | 'system'
    sender_name: string
}

export interface GroupChat {
    id: string
    creator_id: string
    users_id: string[]
    characters_id: string[]
    messages: GroupChatMessage[]
    session_id: string
    created_at: string
    updated_at: string
    group_name: string
    is_active: boolean
}

export interface CreateGroupChatRequest {
    group_name: string
    users_id: string[]
    characters_id: string[]
}

export interface GroupChatResponse {
    group: GroupChat
    error?: string
}
