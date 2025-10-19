export interface UserProfile {
  id: string; // Corresponds to Supabase auth.users.id
  full_name: string;
  avatar_url?: string;
  learning_at: string;
  xp: number;
  streak: number;
}

export interface Topic {
  id: string;
  slug: string;
  title: string;
  isFree: boolean;
  videoUrl: string;
  problemStatement?: string;
  initialCode?: string;
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[];
}

export interface Chapter {
  id: string;
  title: string;
  topics: Topic[];
}

export interface Course {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  chapters: Chapter[];
  freeTopicsCount: number;
  imageUrl: string;
}

export interface UserCourseProgress {
    user_id: string;
    course_id: string;
    completed_topics: string[]; // array of topic_ids
    progress_percentage: number;
}
