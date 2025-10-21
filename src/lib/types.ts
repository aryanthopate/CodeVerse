

import type { Database } from './supabase/database.types';

export interface UserProfile {
  id: string; // Corresponds to Supabase auth.users.id
  email?: string;
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
export type Quiz = Database['public']['Tables']['quizzes']['Row'];
export type Question = Database['public']['Tables']['questions']['Row'];
export type QuestionOption = Database['public']['Tables']['question_options']['Row'] & {
    explanation?: string | null;
};
export type UserEnrollment = Database['public']['Tables']['user_enrollments']['Row'];
export type CourseReview = Database['public']['Tables']['course_reviews']['Row'] & {
    profiles: Pick<UserProfile, 'full_name' | 'avatar_url'> | null;
};


// Custom combined types for nested data fetching
export type QuestionWithOptions = Question & {
    question_options: QuestionOption[];
}
export type QuizWithQuestions = Quiz & {
    questions: QuestionWithOptions[];
}
export type TopicWithContent = Topic & {
    quizzes: QuizWithQuestions[] | null; // A topic can have one quiz, represented as an array of 1
    explanation?: string | null;
}
export type ChapterWithTopics = Chapter & {
  topics: TopicWithContent[];
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
