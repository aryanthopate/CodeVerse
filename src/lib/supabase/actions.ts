

'use server';

import { createClient } from './server';
import { revalidatePath } from 'next/cache';
import { type VideoInsightsOutput } from '@/ai/flows/extract-video-insights';

interface TopicData {
    id?: string; // id is present when updating
    title: string;
    slug: string;
    is_free: boolean;
    order: number;
    video_url?: string;
    content?: string;
    summary?: string;
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
            summary: topic.summary,
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
        id: chapter.id?.startsWith('ch-') ? undefined : chapter.id,
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
            id: topic.id?.startsWith('t-') ? undefined : topic.id,
            title: topic.title,
            slug: topic.slug,
            order: topic.order,
            video_url: topic.video_url,
            is_free: topic.is_free,
            content: topic.content,
            summary: topic.summary,
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


export async function createQuizForTopic(topicId: string, quizData: VideoInsightsOutput) {
    const supabase = createClient();

    // Delete existing quiz for the topic, if any.
    // This simplifies logic by ensuring a fresh start.
    const { data: existingQuiz } = await supabase.from('quizzes').select('id').eq('topic_id', topicId).single();
    if (existingQuiz) {
        await supabase.from('quizzes').delete().eq('id', existingQuiz.id);
    }


    // 1. Create the quiz entry
    const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({ topic_id: topicId })
        .select()
        .single();

    if (quizError) {
        console.error('Error creating quiz:', quizError);
        return { success: false, error: quizError.message };
    }

    // 2. Create the questions and their options
    for (const [qIndex, questionData] of quizData.questions.entries()) {
        const { data: question, error: questionError } = await supabase
            .from('questions')
            .insert({
                quiz_id: quiz.id,
                question_text: questionData.question,
                order: qIndex + 1,
            })
            .select()
            .single();

        if (questionError) {
            console.error('Error creating question:', questionError);
            // In a real app, you might want to roll back the transaction here
            return { success: false, error: questionError.message };
        }

        // 3. Create options for the question
        const optionsToInsert = questionData.options.map(optionText => ({
            question_id: question.id,
            option_text: optionText,
            is_correct: optionText === questionData.correctAnswer,
        }));

        const { error: optionsError } = await supabase.from('question_options').insert(optionsToInsert);

        if (optionsError) {
            console.error('Error creating options:', optionsError);
            return { success: false, error: optionsError.message };
        }
    }
    
    revalidatePath(`/courses/*/${topicId}`);
    return { success: true, quizId: quiz.id };
}
