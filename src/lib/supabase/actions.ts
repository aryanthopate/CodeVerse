
'use server';

import { createClient } from './server';
import { revalidatePath } from 'next/cache';

interface TopicData {
    title: string;
    slug: string;
    is_free: boolean;
    order: number;
    video_url?: string;
}

interface ChapterData {
    title: string;
    order: number;
    topics: TopicData[];
}

interface CourseData {
    name: string;
    slug: string;
    description: string;
    image_url: string;
    chapters: ChapterData[];
}

export async function createCourse(courseData: CourseData) {
    const supabase = createClient();
    
    // First, insert the course
    const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
            name: courseData.name,
            slug: courseData.slug,
            description: courseData.description,
            image_url: courseData.image_url,
        })
        .select()
        .single();

    if (courseError) {
        console.error('Error creating course:', courseError);
        return { success: false, error: courseError.message };
    }

    // Then, insert the chapters
    const chaptersToInsert = courseData.chapters.map(chapter => ({
        title: chapter.title,
        order: chapter.order,
        course_id: course.id,
    }));

    const { data: chapters, error: chaptersError } = await supabase
        .from('chapters')
        .insert(chaptersToInsert)
        .select();

    if (chaptersError) {
        console.error('Error creating chapters:', chaptersError);
        // Optional: clean up the created course if chapters fail
        await supabase.from('courses').delete().eq('id', course.id);
        return { success: false, error: chaptersError.message };
    }

    // Finally, insert the topics
    const topicsToInsert = courseData.chapters.flatMap((chapterData, index) => {
        const chapterId = chapters.find(c => c.order === chapterData.order)?.id;
        if (!chapterId) return [];
        return chapterData.topics.map(topic => ({
            ...topic,
            chapter_id: chapterId,
        }));
    });
    
    const { error: topicsError } = await supabase
        .from('topics')
        .insert(topicsToInsert);

    if (topicsError) {
        console.error('Error creating topics:', topicsError);
        // Optional: more complex cleanup needed here if topics fail
        return { success: false, error: topicsError.message };
    }

    // Revalidate paths to show the new course immediately
    revalidatePath('/');
    revalidatePath('/courses');
    revalidatePath(`/courses/${courseData.slug}`);
    revalidatePath('/admin/courses');

    return { success: true };
}


export async function deleteCourse(courseId: string) {
    const supabase = createClient();

    // The database is set up with cascading deletes, so deleting the course
    // will also delete its chapters and topics.
    const { error } = await supabase.from('courses').delete().eq('id', courseId);

    if (error) {
        console.error('Error deleting course:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/courses');
    revalidatePath('/courses');

    return { success: true };
}
