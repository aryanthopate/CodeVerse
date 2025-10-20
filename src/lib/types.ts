import type { Database } from './supabase/database.types';

export interface UserProfile {
  id: string; // Corresponds to Supabase auth.users.id
  full_name: string;
  avatar_url?: string;
  learning_at: string;
  xp: number;
  streak: number;
  role: 'user' | 'admin';
}

// Re-exporting Supabase generated types for convenience
export type Course = Database['public']['Tables']['courses']['Row'];
export type Chapter = Database['public']['Tables']['chapters']['Row'];
export type Topic = Database['public']['Tables']['topics']['Row'];

// Custom combined types for nested data fetching
export type ChapterWithTopics = Chapter & {
  topics: Topic[];
};

export type CourseWithChaptersAndTopics = Course & {
  chapters: ChapterWithTopics[];
};

export interface UserCourseProgress {
    user_id: string;
    course_id: string;
    completed_topics: string[]; // array of topic_ids
    progress_percentage: number;
}