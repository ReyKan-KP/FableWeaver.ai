export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            anime: {
                Row: {
                    id: string
                    title: string
                    description: string
                    rating: number
                    year: string
                    season: string
                    genres: string
                    image_url: string | null
                    num_favorites: number
                    num_list_users: number
                    feedback: number
                    rank: number
                    created_at: string
                }
                Insert: {
                    id: string
                    title: string
                    description: string
                    rating: number
                    year: string
                    season: string
                    genres: string
                    image_url?: string | null
                    num_favorites?: number
                    num_list_users?: number
                    feedback?: number
                    rank?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string
                    rating?: number
                    year?: string
                    season?: string
                    genres?: string
                    image_url?: string | null
                    num_favorites?: number
                    num_list_users?: number
                    feedback?: number
                    rank?: number
                    created_at?: string
                }
            }
            user: {
                Row: {
                    user_id: string
                    user_name: string
                    user_email: string
                    user_watched_list: string[]
                    created_at: string
                }
                Insert: {
                    user_id: string
                    user_name: string
                    user_email: string
                    user_watched_list?: string[]
                    created_at?: string
                }
                Update: {
                    user_id?: string
                    user_name?: string
                    user_email?: string
                    user_watched_list?: string[]
                    created_at?: string
                }
            }
        }
    }
}

