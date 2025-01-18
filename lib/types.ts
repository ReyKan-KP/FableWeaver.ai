import { Database } from './database.types'

export type AnimeRow = Database['public']['Tables']['anime']['Row']
export type UserRow = Database['public']['Tables']['user']['Row']

export interface AnimeRecommendation extends Omit<AnimeRow, 'genres'> {
    genres: string[]
    scores: AnimeScore
}

export interface AnimeScore {
    cosine_similarity: number
    feedback_score: number
    normalized_score: number
    combined_score: number
}

export interface UserProfile extends UserRow { }

export interface RecommendationFormData {
    query: string
    n_results: number
    personalized: boolean
    user_id?: string
}

