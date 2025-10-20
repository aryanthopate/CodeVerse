
'use server';

import { createClient } from './server';
import { revalidatePath } from 'next/cache';
import type { QuizWithQuestions, QuestionWithOptions, QuestionOption, Topic, Chapter, Course } from '@/lib/types';


interface TopicData extends Omit<Topic, 'id' | 'created_at' | 'chapter_id' | 'order'> {
    id?: string; // id is present when updating
    order: number;
    quizzes?: QuizWithQuestions[];
}

interface ChapterData extends Omit<Chapter, 'id' | 'created_at' | 'course_id' | 'order'> {
    id?: string; // id is present when updating
    order: number;
    topics: TopicData[];
}

interface CourseData extends Omit<Course, 'id' | 'created_at'> {
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
             const { quizzes, ...topicDetails } = topicData;
             const { data: topic, error: topicError } = await supabase
                .from('topics')
                .insert({
                    ...topicDetails,
                    explanation: topicData.explanation,
                    chapter_id: createdChapter.id,
                })
                .select().single();

            if (topicError) {
                 console.error('Error creating topic:', topicError);
                 continue; // Or handle more gracefully
            }
            
            if (quizzes && quizzes.length > 0) {
                 try {
                    const quizData = quizzes[0];
                    // Sanitize IDs before upserting
                    const sanitizedQuestions = quizData.questions.map(q => ({
                        ...q,
                        id: undefined, // Always new on create
                        question_options: q.question_options.map(o => ({
                            ...o,
                            id: undefined, // Always new on create
                        }))
                    }));

                    const sanitizedQuizData = { ...quizData, id: undefined, questions: sanitizedQuestions };
                    await upsertQuiz(sanitizedQuizData, topic.id);

                } catch(error: any) {
                     return { success: false, error: error.message };
                }
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
    
    // Find existing quiz for the topic first
    const { data: existingQuiz } = await supabase
        .from('quizzes')
        .select('id')
        .eq('topic_id', topicId)
        .single();
    
    const quizId = quizData.id?.startsWith('quiz-') ? (existingQuiz?.id || undefined) : (quizData.id || existingQuiz?.id);

    // 1. Upsert Quiz
    const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .upsert({ id: quizId, topic_id: topicId })
        .select()
        .single();

    if (quizError) {
        // If it's a unique constraint violation, it means a quiz was created by another process, let's fetch it.
        if (quizError.code === '23505' && !quiz) {
            const { data: existingQuizAgain, error: fetchError } = await supabase.from('quizzes').select('id').eq('topic_id', topicId).single();
            if (fetchError || !existingQuizAgain) {
                 throw new Error(`Quiz upsert failed: ${quizError.message}`);
            }
            quiz.id = existingQuizAgain.id;
        } else if (quizError && !quiz) {
            throw new Error(`Quiz upsert failed: ${quizError.message}`);
        }
    }


    // Get existing questions to find which ones to delete
    const { data: existingQuestions } = await supabase.from('questions').select('id').eq('quiz_id', quiz.id);
    const incomingQuestionIds = quizData.questions.map(q => q.id).filter(id => id && !id.startsWith('q-'));
    const questionsToDelete = existingQuestions?.filter(q => !incomingQuestionIds.includes(q.id)).map(q => q.id) || [];
    
    if (questionsToDelete.length > 0) {
        await supabase.from('question_options').delete().in('question_id', questionsToDelete);
        await supabase.from('questions').delete().in('id', questionsToDelete);
    }

    // 2. Upsert Questions
    for (const questionData of quizData.questions) {
        const questionId = questionData.id?.startsWith('q-') ? undefined : questionData.id;
        const { data: question, error: questionError } = await supabase
            .from('questions')
            .upsert({
                id: questionId,
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
        const incomingOptionIds = questionData.question_options.map(o => o.id).filter(id => id && !id.startsWith('opt-'));
        const optionsToDelete = existingOptions?.filter(o => !incomingOptionIds.includes(o.id)).map(o => o.id) || [];
        
        if (optionsToDelete.length > 0) {
            await supabase.from('question_options').delete().in('id', optionsToDelete);
        }

        // 3. Upsert Options
        const optionsToUpsert = questionData.question_options.map(opt => ({
            id: opt.id?.startsWith('opt-') ? undefined : opt.id,
            question_id: question.id,
            option_text: opt.option_text,
            is_correct: opt.is_correct,
            explanation: opt.explanation,
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
        .select('id, chapters(id, topics(id))')
        .eq('id', courseId)
        .single();
    
    if(!existingCourse) return { success: false, error: 'Course not found' };

    const existingChapters = existingCourse.chapters;
    const existingTopics = existingCourse.chapters.flatMap(c => c.topics);

    const incomingChapterIds = courseData.chapters.map(c => c.id).filter(id => id && !id.startsWith('ch-'));
    const incomingTopicIds = courseData.chapters.flatMap(c => c.topics).map(t => t.id).filter(id => id && !id.startsWith('t-'));

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
                    chapter_id: upsertedChapter.id,
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
                     const quizData = quizzes[0];
                     // Sanitize IDs before upserting
                     const sanitizedQuestions = quizData.questions.map(q => ({
                         ...q,
                         id: q.id?.startsWith('q-') ? undefined : q.id,
                         question_options: q.question_options.map(o => ({
                             ...o,
                             id: o.id?.startsWith('opt-') ? undefined : o.id,
                         }))
                     }));
                     const sanitizedQuizData = { ...quizData, questions: sanitizedQuestions };
                     await upsertQuiz(sanitizedQuizData, upsertedTopic.id);
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

export async function createQuizForTopic(topicId: string, quizData: QuizWithQuestions) {
  const supabase = createClient();

  // 1. Create the quiz entry linked to the topic
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({ topic_id: topicId })
    .select()
    .single();

  if (quizError) {
    console.error('Error creating quiz:', quizError);
    if (quizError.code === '23505') { // unique constraint violation
        return { success: false, error: 'A quiz already exists for this topic.'};
    }
    return { success: false, error: 'Failed to create quiz entry.' };
  }

  // 2. Create the questions for the quiz
  const questionsToInsert = quizData.questions.map((q, index) => ({
    quiz_id: quiz.id,
    question_text: q.question_text,
    question_type: q.question_type || 'single',
    order: index + 1,
  }));
  
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .insert(questionsToInsert)
    .select();

  if (questionsError) {
    console.error('Error creating questions:', questionsError);
    // Clean up created quiz if questions fail
    await supabase.from('quizzes').delete().eq('id', quiz.id);
    return { success: false, error: 'Failed to save quiz questions.' };
  }

  // 3. Create the options for each question
  const optionsToInsert = [];
  for (let i = 0; i < quizData.questions.length; i++) {
    const originalQuestion = quizData.questions[i];
    const savedQuestion = questions.find(q => q.order === i + 1);

    if (savedQuestion) {
      for (const option of originalQuestion.question_options) {
        optionsToInsert.push({
          question_id: savedQuestion.id,
          option_text: option.option_text,
          is_correct: option.is_correct,
          explanation: option.explanation,
        });
      }
    }
  }

  if (optionsToInsert.length > 0) {
    const { error: optionsError } = await supabase
        .from('question_options')
        .insert(optionsToInsert as any);

    if (optionsError) {
        console.error('Error creating options:', optionsError);
        // More complex cleanup could be done here, but for now we'll just report the error
        return { success: false, error: 'Failed to save quiz options.' };
    }
  }

  return { success: true, quizId: quiz.id };
}

    