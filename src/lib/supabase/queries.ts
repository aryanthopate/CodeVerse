'use server'

import { createClient } from "@/lib/supabase/server";
import type { CourseWithChaptersAndTopics, Topic } from "../types";

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
                    *
                )
            )
        `)
        .order('created_at', { ascending: true })
        .order('order', { foreignTable: 'chapters', ascending: true })
        .order('order', { foreignTable: 'chapters.topics', ascending: true });

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
                    *
                )
            )
        `)
        .eq('slug', slug)
        .order('order', { foreignTable: 'chapters', ascending: true })
        .order('order', { foreignTable: 'chapters.topics', ascending: true })
        .single();
    
    if (error) {
        console.error("Error fetching course by slug:", error.message);
        return null;
    }

    return course as unknown as CourseWithChaptersAndTopics;
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
            chapters (
                id,
                title,
                order,
                topics (
                    id,
                    title,
                    slug,
                    video_url,
                    content,
                    is_free,
                    order
                )
            )
        `)
        .eq('slug', courseSlug)
        .order('order', { foreignTable: 'chapters', ascending: true })
        .order('order', { foreignTable: 'chapters.topics', ascending: true })
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
        topic: currentTopic as Topic,
        prevTopic: prevTopic as Topic | null,
        nextTopic: nextTopic as Topic | null,
    };
}
