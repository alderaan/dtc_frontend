export type DtcProfileStatus = 'active' | 'pending_review' | 'flagged_for_removal' | 'removed';

export interface IDtcProfileWithDetails {
    id: number;
    username: string;
    profile_url: string;
    status: DtcProfileStatus;
    notes?: string;
    updated_at: string;
    full_name?: string;
    biography?: string;
    followers_count?: number;
    posts_count?: number;
    external_url?: string;
    last_scraped_at?: string;
    search_term?: string;
    search_term_en?: string;
    category?: string;
} 