export interface User {
  name: string;
  avatarUrl: string;
  xp: number;
  streak: number;
  progress: {
    language: string;
    percentage: number;
  }[];
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
