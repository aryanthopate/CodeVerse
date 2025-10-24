

'use server';

import { createClient } from "@/lib/supabase/server";
import type { CourseWithChaptersAndTopics, Topic, UserEnrollment, QuizWithQuestions, GameWithChaptersAndLevels, GameLevel, UserGameProgress } from "../types";

// This function can be used in Server Components or Server Actions.
// It should not be used in Client Components.
// For client-side data fetching, you should create a client-side function
// that uses the client Supabase instance.

export async function getCoursesWithChaptersAndTopics(): Promise<CourseWithChaptersAndTopics[] | null> {
    const supabase = createClient();
    const { data: courses, error } = await supabase
        .from('courses')
        .select(`
            *,
            chapters (
                *,
                topics (
                    *,
                    quizzes (
                        *,
                        questions (
                            *,
                            question_options (*)
                        )
                    )
                )
            )
        `)
        .order('created_at', { ascending: true })
        .order('order', { foreignTable: 'chapters', ascending: true })
        .order('order', { foreignTable: 'chapters.topics', ascending: true })
        .order('order', { foreignTable: 'chapters.topics.quizzes.questions', ascending: true });


    if (error) {
        console.error("Error fetching courses:", error.message);
        return null;
    }
    
    // The type from Supabase might be slightly different, so we cast it.
    // This is safe as long as the query matches the desired structure.
    return courses as unknown as CourseWithChaptersAndTopics[];
}

export async function getCourseBySlug(slug: string): Promise<CourseWithChaptersAndTopics | null> {
    const supabase = createClient();
    const { data: course, error } = await supabase
        .from('courses')
        .select(`
            *,
            chapters (
                *,
                topics (
                    *,
                    quizzes (
                        *,
                        questions (
                            *,
                            question_options (*)
                        )
                    )
                )
            ),
            related_courses!course_id(
                course_id,
                related_course_id,
                courses!related_course_id (
                  id,
                  name,
                  slug,
                  image_url,
                  description
                )
            ),
            games (
                *
            )
        `)
        .eq('slug', slug)
        .order('order', { foreignTable: 'chapters', ascending: true })
        .order('order', { foreignTable: 'chapters.topics', ascending: true })
        .order('order', { foreignTable: 'chapters.topics.quizzes.questions', ascending: true })
        .single();
    
    if (error) {
        console.error("Error fetching course by slug:", error.message);
        return null;
    }
    
    if (!course) {
        return null;
    }

    const transformedCourse = {
        ...course,
        related_courses: course.related_courses?.map((rc: any) => rc.courses) || []
    };

    return transformedCourse as unknown as CourseWithChaptersAndTopics;
}

export async function getCourseAndTopicDetails(courseSlug: string, topicSlug: string) {
    const supabase = createClient();

    // 1. Fetch the course with all its chapters and topics
    const { data: course, error: courseError } = await supabase
        .from('courses')
        .select(`
            id,
            name,
            slug,
            language,
            chapters (
                id,
                title,
                order,
                topics (
                    *,
                    quizzes (
                        *,
                        questions (
                            *,
                            question_options (*)
                        )
                    )
                )
            )
        `)
        .eq('slug', courseSlug)
        .order('order', { foreignTable: 'chapters', ascending: true })
        .order('order', { foreignTable: 'chapters.topics', ascending: true })
        .order('order', { foreignTable: 'chapters.topics.quizzes.questions', ascending: true })
        .single();

    if (courseError || !course) {
        console.error('Error fetching course details:', courseError?.message);
        return { course: null, chapter: null, topic: null, prevTopic: null, nextTopic: null };
    }

    const typedCourse = course as unknown as CourseWithChaptersAndTopics;

    // 2. Flatten topics and find the current one
    const allTopics = typedCourse.chapters.flatMap(ch => ch.topics);
    const currentTopicIndex = allTopics.findIndex(t => t.slug === topicSlug);

    if (currentTopicIndex === -1) {
        return { course: typedCourse, chapter: null, topic: null, prevTopic: null, nextTopic: null };
    }

    const currentTopic = allTopics[currentTopicIndex];
    
    // 3. Find the chapter for the current topic
    const currentChapter = typedCourse.chapters.find(ch => ch.id === (currentTopic as any).chapter_id);

    // 4. Determine previous and next topics
    const prevTopic = currentTopicIndex > 0 ? allTopics[currentTopicIndex - 1] : null;
    const nextTopic = currentTopicIndex < allTopics.length - 1 ? allTopics[currentTopicIndex + 1] : null;
    
    return {
        course: typedCourse,
        chapter: currentChapter || null,
        topic: currentTopic as Topic & { quizzes: QuizWithQuestions[] },
        prevTopic: prevTopic as Topic | null,
        nextTopic: nextTopic as Topic | null,
    };
}


export async function getUserEnrollments(userId: string): Promise<{ enrolledCourses: CourseWithChaptersAndTopics[], enrollments: UserEnrollment[] } | null> {
    const supabase = createClient();
    const { data: enrollments, error } = await supabase
        .from('user_enrollments')
        .select(`
            *,
            courses (
                *,
                chapters (
                    *,
                    topics (*)
                )
            )
        `)
        .eq('user_id', userId);

    if (error) {
        console.error("Error fetching user enrollments:", error.message);
        return null;
    }

    const enrolledCourses = enrollments.map(e => e.courses) as unknown as CourseWithChaptersAndTopics[];

    return { enrolledCourses, enrollments: enrollments as UserEnrollment[] };
}


export async function getAllCoursesMinimal() {
    const supabase = createClient();
    const { data, error } = await supabase.from('courses').select('id, name');
    if (error) {
        console.error("Error fetching minimal courses:", error);
        return [];
    }
    return data;
}

export async function getRelatedCourseIds(courseId: string) {
    const supabase = createClient();
    const { data, error } = await supabase.from('related_courses').select('related_course_id').eq('course_id', courseId);
    if(error) {
        console.error("Error fetching related course ids", error);
        return [];
    }
    return data.map(r => r.related_course_id);
}

export async function getIsUserEnrolled(courseId: string, userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('user_enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', userId)
        .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error("Error checking enrollment:", error);
        return false;
    }

    return !!data;
}

export async function getAllGames(): Promise<GameWithChaptersAndLevels[] | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('games')
        .select(`
            *,
            game_chapters (
                *,
                game_levels (
                    *
                )
            )
        `)
        .order('created_at', { ascending: true })
        .order('order', { foreignTable: 'game_chapters', ascending: true })
        .order('order', { foreignTable: 'game_chapters.game_levels', ascending: true });


    if (error) {
        console.error("Error fetching games:", error.message);
        return null;
    }

    return data as GameWithChaptersAndLevels[];
}


export async function getGameBySlug(slug: string): Promise<GameWithChaptersAndLevels | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('games')
        .select(`
            *,
            game_chapters (
                *,
                game_levels (
                    *
                )
            )
        `)
        .eq('slug', slug)
        .order('order', { foreignTable: 'game_chapters', ascending: true })
        .order('order', { foreignTable: 'game_chapters.game_levels', ascending: true })
        .maybeSingle();
    
    if (error) {
        console.error("Error fetching game by slug:", error.message);
        return null;
    }

    return data as GameWithChaptersAndLevels;
}

export async function getGameAndLevelDetails(gameSlug: string, levelSlug: string) {
    const supabase = createClient();
    
    const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select(`
            *,
            game_chapters (
                *,
                game_levels (
                    *
                )
            )
        `)
        .eq('slug', gameSlug)
        .order('order', { foreignTable: 'game_chapters', ascending: true })
        .order('order', { foreignTable: 'game_chapters.game_levels', ascending: true })
        .single();
    
    if(gameError || !gameData) {
        console.error("Error fetching game details:", gameError?.message);
        return { game: null, level: null, prevLevel: null, nextLevel: null };
    }
    
    const game = gameData as GameWithChaptersAndLevels;
    const allLevels = game.game_chapters.flatMap(c => c.game_levels);
    
    const currentLevelIndex = allLevels.findIndex(l => l.slug === levelSlug);

    if (currentLevelIndex === -1) {
        console.error(`Level with slug "${levelSlug}" not found in game "${gameSlug}"`);
        return { game: game, level: null, prevLevel: null, nextLevel: null };
    }

    const currentLevel = allLevels[currentLevelIndex];
    const prevLevel = currentLevelIndex > 0 ? allLevels[currentLevelIndex - 1] : null;
    const nextLevel = currentLevelIndex < allLevels.length - 1 ? allLevels[currentLevelIndex + 1] : null;

    return { game, level: currentLevel, prevLevel, nextLevel };
}


export async function getUserGameProgress(gameId: string): Promise<UserGameProgress[] | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const { data, error } = await supabase
        .from('user_game_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('game_id', gameId);

    if (error) {
        console.error("Error fetching user game progress:", error);
        return null;
    }

    return data;
}

