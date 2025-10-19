import type { Course, User } from './types';

export const mockUser: User = {
  name: 'Aryan',
  avatarUrl: 'https://picsum.photos/seed/avatar/100/100',
  xp: 1250,
  streak: 5,
  progress: [
    { language: 'Java', percentage: 40 },
    { language: 'Python', percentage: 10 },
  ],
};

export const mockCourses: Course[] = [
  {
    id: 'java-101',
    name: 'Java',
    slug: 'java',
    icon: '/icons/java.svg',
    description: 'Master the fundamentals of Java, one of the most popular programming languages in the world.',
    freeTopicsCount: 5,
    imageUrl: 'https://picsum.photos/seed/java/600/400',
    chapters: [
      {
        id: 'ch-1',
        title: 'Chapter 1: Basics',
        topics: [
          { id: 't-1-1', slug: 'variables', title: 'Variables', isFree: true, videoUrl: '' },
          { id: 't-1-2', slug: 'data-types', title: 'Data Types', isFree: true, videoUrl: '' },
          { id: 't-1-3', slug: 'operators', title: 'Operators', isFree: true, videoUrl: '' },
        ],
      },
      {
        id: 'ch-2',
        title: 'Chapter 2: Control Flow',
        topics: [
          { id: 't-2-1', slug: 'if-else', title: 'If-Else Statements', isFree: true, videoUrl: '' },
          { id: 't-2-2', slug: 'switch', title: 'Switch Statements', isFree: true, videoUrl: '' },
          { id: 't-2-3', slug: 'for-loops', title: 'For Loops', isFree: false, videoUrl: '' },
          { id: 't-2-4', slug: 'while-loops', title: 'While Loops', isFree: false, videoUrl: '' },
        ],
      },
      {
        id: 'ch-3',
        title: 'Chapter 3: Object-Oriented Programming',
        topics: [
          { id: 't-3-1', slug: 'classes-objects', title: 'Classes and Objects', isFree: false, videoUrl: '' },
          { id: 't-3-2', slug: 'inheritance', title: 'Inheritance', isFree: false, videoUrl: '' },
        ],
      },
    ],
  },
  {
    id: 'python-101',
    name: 'Python',
    slug: 'python',
    icon: '/icons/python.svg',
    description: 'Start your journey with Python, from basic syntax to building your first game.',
    freeTopicsCount: 5,
    imageUrl: 'https://picsum.photos/seed/python/600/400',
    chapters: [
       {
        id: 'py-ch-1',
        title: 'Chapter 1: Getting Started',
        topics: [
          { id: 'py-t-1-1', slug: 'hello-world', title: 'Hello, World!', isFree: true, videoUrl: '' },
          { id: 'py-t-1-2', slug: 'variables', title: 'Variables & Types', isFree: true, videoUrl: '' },
        ],
      },
       {
        id: 'py-ch-2',
        title: 'Chapter 2: Data Structures',
        topics: [
          { id: 'py-t-2-1', slug: 'lists', title: 'Lists', isFree: true, videoUrl: '' },
          { id: 'py-t-2-2', slug: 'dictionaries', title: 'Dictionaries', isFree: true, videoUrl: '' },
          { id: 'py-t-2-3', slug: 'tuples', title: 'Tuples & Sets', isFree: true, videoUrl: '' },
        ],
      },
    ],
  },
  {
    id: 'cpp-101',
    name: 'C++',
    slug: 'cpp',
    icon: '/icons/cpp.svg',
    description: 'Dive deep into C++ for performance-critical applications and game development.',
    freeTopicsCount: 5,
    imageUrl: 'https://picsum.photos/seed/cpp/600/400',
    chapters: [
      {
        id: 'cpp-ch-1',
        title: 'Chapter 1: Fundamentals',
        topics: [
           { id: 'cpp-t-1-1', slug: 'syntax', title: 'Basic Syntax', isFree: true, videoUrl: '' },
        ],
      },
    ],
  },
];
