
'use server';

import { createClient } from './server';
import { revalidatePath } from 'next/cache';

interface TopicData {
    id?: string; // id is present when updating
    title: string;
    slug: string;
    is_free: boolean;
    order: number;
    video_url?: string;
    content?: string;
}

interface ChapterData {
    id?: string; // id is present when updating
    title: string;
    order: number;
    topics: TopicData[];
}

interface CourseData {
    name: string;
    slug: string;
    description: string;
    image_url: string;
    is_paid: boolean;
    price: number;
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
            is_paid: courseData.is_paid,
            price: courseData.price,
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
        // Find the corresponding newly created chapter. Note: This relies on the order being the same.
        const createdChapter = chapters.find(c => c.order === chapterData.order);
        if (!createdChapter) return [];
        return chapterData.topics.map(topic => ({
            title: topic.title,
            slug: topic.slug,
            is_free: topic.is_free,
            order: topic.order,
            video_url: topic.video_url,
            content: topic.content,
            chapter_id: createdChapter.id,
        }));
    });
    
    if (topicsToInsert.length > 0) {
        const { error: topicsError } = await supabase
            .from('topics')
            .insert(topicsToInsert);

        if (topicsError) {
            console.error('Error creating topics:', topicsError);
            // More complex cleanup needed here
            return { success: false, error: topicsError.message };
        }
    }


    // Revalidate paths to show the new course immediately
    revalidatePath('/');
    revalidatePath('/courses');
    revalidatePath(`/courses/${courseData.slug}`);
    revalidatePath('/admin/courses');

    return { success: true };
}

export async function updateCourse(courseId: string, courseData: CourseData) {
    const supabase = createClient();

    // 1. Update the course itself
    const { error: courseError } = await supabase
        .from('courses')
        .update({
            name: courseData.name,
            slug: courseData.slug,
            description: courseData.description,
            image_url: courseData.image_url,
            is_paid: courseData.is_paid,
            price: courseData.price,
        })
        .eq('id', courseId);

    if (courseError) {
        console.error('Error updating course:', courseError);
        return { success: false, error: courseError.message };
    }

    // 2. Get existing chapters and topics to compare
    const { data: existingCourse } = await supabase
        .from('courses')
        .select('*, chapters(*, topics(*))')
        .eq('id', courseId)
        .single();
    
    if(!existingCourse) return { success: false, error: 'Course not found' };

    const existingChapters = existingCourse.chapters;
    const existingTopics = existingCourse.chapters.flatMap(c => c.topics);

    const incomingChapterIds = courseData.chapters.map(c => c.id).filter(Boolean);
    const incomingTopicIds = courseData.chapters.flatMap(c => c.topics).map(t => t.id).filter(Boolean);

    // 3. Delete chapters and topics that are no longer present
    const chaptersToDelete = existingChapters.filter(c => !incomingChapterIds.includes(c.id));
    if (chaptersToDelete.length > 0) {
        const { error: deleteChapterError } = await supabase
            .from('chapters')
            .delete()
            .in('id', chaptersToDelete.map(c => c.id));
        if (deleteChapterError) return { success: false, error: `Failed to delete chapters: ${deleteChapterError.message}` };
    }
    
    const topicsToDelete = existingTopics.filter(t => !incomingTopicIds.includes(t.id));
     if (topicsToDelete.length > 0) {
        const { error: deleteTopicError } = await supabase
            .from('topics')
            .delete()
            .in('id', topicsToDelete.map(t => t.id));
        if (deleteTopicError) return { success: false, error: `Failed to delete topics: ${deleteTopicError.message}` };
    }

    // 4. Upsert chapters
    const chaptersToUpsert = courseData.chapters.map(chapter => ({
        id: chapter.id, // may be undefined for new chapters
        title: chapter.title,
        order: chapter.order,
        course_id: courseId,
    }));
    
    const { data: upsertedChapters, error: chapterUpsertError } = await supabase
        .from('chapters')
        .upsert(chaptersToUpsert)
        .select();
    
    if (chapterUpsertError) {
        console.error('Error upserting chapters:', chapterUpsertError);
        return { success: false, error: chapterUpsertError.message };
    }

    // 5. Upsert topics
     const topicsToUpsert = courseData.chapters.flatMap((chapterData) => {
        const upsertedChapter = upsertedChapters.find(uc => uc.order === chapterData.order && uc.title === chapterData.title);
        if (!upsertedChapter) return [];
        
        return chapterData.topics.map(topic => ({
            id: topic.id, // may be undefined
            title: topic.title,
            slug: topic.slug,
            order: topic.order,
            video_url: topic.video_url,
            is_free: topic.is_free,
            content: topic.content,
            chapter_id: upsertedChapter.id
        }));
    });

    if (topicsToUpsert.length > 0) {
        const { error: topicUpsertError } = await supabase
            .from('topics')
            .upsert(topicsToUpsert)
            .select();
            
        if (topicUpsertError) {
            console.error('Error upserting topics:', topicUpsertError);
            return { success: false, error: topicUpsertError.message };
        }
    }


    revalidatePath('/');
    revalidatePath('/courses');
    revalidatePath(`/courses/${courseData.slug}`);
    revalidatePath('/admin/courses');
    revalidatePath(`/admin/courses/edit/${courseId}`);
    
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
