export interface Message {
    role: "user" | "assistant"
    content: string
    timestamp: string
}

export interface Character {
    id: string
    name: string
    description: string
    content_source: string
    content_types: string[]
    fandom_url?: string
    dialogues: string[]
    is_active: boolean
    is_public: boolean
    creator_id: string
    fandom_content?: string
    personality?: string
    background?: string
    notable_quotes?: string
    created_at: string
    additional_info?: Record<string, any>
}

export interface ChatSession {
    id: string
    character_id: string
    user_id: string
    session_id: string
    messages: Message[]
    created_at: string
    updated_at: string
}

export interface ChatResponse {
    response: string
    history?: Message[]
    error?: string
}

export interface ChatSessionResponse {
    session_id: string
    messages: Message[]
    continued: boolean
    error?: string
}

