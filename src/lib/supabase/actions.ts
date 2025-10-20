

'use server';

import { createClient } from './server';
import { revalidatePath } from 'next/cache';
import type { QuizWithQuestions, QuestionWithOptions, QuestionOption } from '@/lib/types';


interface TopicData {
    id?: string; // id is present when updating
    title: string;
    slug: string;
    is_free: boolean;
    order: number;
    video_url?: string;
    content?: string;
    summary?: string;
    quizzes?: QuizWithQuestions[];
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

    // Finally, insert the topics (and their quizzes)
    for (const chapterData of courseData.chapters) {
        const createdChapter = chapters.find(c => c.order === chapterData.order);
        if (!createdChapter) continue;

        for (const topicData of chapterData.topics) {
             const { data: topic, error: topicError } = await supabase
                .from('topics')
                .insert({
                    title: topicData.title,
                    slug: topicData.slug,
                    is_free: topicData.is_free,
                    order: topicData.order,
                    video_url: topicData.video_url,
                    content: topicData.content,
                    summary: topicData.summary,
                    chapter_id: createdChapter.id,
                })
                .select().single();

            if (topicError) {
                 console.error('Error creating topic:', topicError);
                 continue; // Or handle more gracefully
            }
            
            if (topicData.quizzes && topicData.quizzes.length > 0) {
                const quizData = topicData.quizzes[0]; // Assuming one quiz per topic
                await upsertQuiz(quizData, topic.id);
            }
        }
    }


    // Revalidate paths to show the new course immediately
    revalidatePath('/');
    revalidatePath('/courses');
    revalidatePath(`/courses/${courseData.slug}`);
    revalidatePath('/admin/courses');

    return { success: true, courseId: course.id };
}


// Helper function to handle quiz upsert logic
async function upsertQuiz(quizData: QuizWithQuestions, topicId: string) {
    const supabase = createClient();
    
    // 1. Upsert Quiz
    const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .upsert({ id: quizData.id, topic_id: topicId })
        .select()
        .single();
    if (quizError) throw new Error(`Quiz upsert failed: ${quizError.message}`);

    // Get existing questions to find which ones to delete
    const { data: existingQuestions } = await supabase.from('questions').select('id').eq('quiz_id', quiz.id);
    const incomingQuestionIds = quizData.questions.map(q => q.id).filter(Boolean);
    const questionsToDelete = existingQuestions?.filter(q => !incomingQuestionIds.includes(q.id)).map(q => q.id) || [];
    
    if (questionsToDelete.length > 0) {
        await supabase.from('questions').delete().in('id', questionsToDelete);
    }

    // 2. Upsert Questions
    for (const questionData of quizData.questions) {
        const { data: question, error: questionError } = await supabase
            .from('questions')
            .upsert({
                id: questionData.id,
                quiz_id: quiz.id,
                question_text: questionData.question_text,
                question_type: questionData.question_type,
                order: questionData.order
            })
            .select()
            .single();
        if (questionError) throw new Error(`Question upsert failed: ${questionError.message}`);
        
        // Get existing options to find which ones to delete
        const { data: existingOptions } = await supabase.from('question_options').select('id').eq('question_id', question.id);
        const incomingOptionIds = questionData.question_options.map(o => o.id).filter(Boolean);
        const optionsToDelete = existingOptions?.filter(o => !incomingOptionIds.includes(o.id)).map(o => o.id) || [];
        
        if (optionsToDelete.length > 0) {
            await supabase.from('question_options').delete().in('id', optionsToDelete);
        }

        // 3. Upsert Options
        const optionsToUpsert = questionData.question_options.map(opt => ({
            id: opt.id,
            question_id: question.id,
            option_text: opt.option_text,
            is_correct: opt.is_correct,
        }));
        
        if (optionsToUpsert.length > 0) {
            const { error: optionsError } = await supabase.from('question_options').upsert(optionsToUpsert);
            if (optionsError) throw new Error(`Options upsert failed: ${optionsError.message}`);
        }
    }
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
        .select('*, chapters(*, topics(*, quizzes(*, questions(*, question_options(*)))))')
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
    for (const chapterData of courseData.chapters) {
        const { data: upsertedChapter, error: chapterUpsertError } = await supabase
            .from('chapters')
            .upsert({
                id: chapterData.id?.startsWith('ch-') ? undefined : chapterData.id,
                title: chapterData.title,
                order: chapterData.order,
                course_id: courseId,
            })
            .select()
            .single();
    
        if (chapterUpsertError) {
            console.error('Error upserting chapter:', chapterUpsertError);
            return { success: false, error: chapterUpsertError.message };
        }
        
        // 5. Upsert topics for this chapter
        for (const topicData of chapterData.topics) {
            const { quizzes, ...topicDetails } = topicData;
            const { data: upsertedTopic, error: topicUpsertError } = await supabase
                .from('topics')
                .upsert({
                    ...topicDetails,
                    id: topicDetails.id?.startsWith('t-') ? undefined : topicDetails.id,
                    chapter_id: upsertedChapter.id
                })
                .select()
                .single();
            
            if (topicUpsertError) {
                console.error('Error upserting topic:', topicUpsertError);
                return { success: false, error: topicUpsertError.message };
            }

            // 6. Upsert quiz for this topic
            if (quizzes && quizzes.length > 0) {
                try {
                     await upsertQuiz(quizzes[0], upsertedTopic.id);
                } catch(error: any) {
                     return { success: false, error: error.message };
                }
            } else {
                 // If there's no quiz data, delete any existing quiz for this topic
                 const { data: existingQuiz } = await supabase.from('quizzes').select('id').eq('topic_id', upsertedTopic.id).single();
                 if (existingQuiz) {
                     await supabase.from('quizzes').delete().eq('id', existingQuiz.id);
                 }
            }
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
