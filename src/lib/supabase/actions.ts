
'use server';

import { createClient } from './server';
import { revalidatePath } from 'next/cache';
import type { QuizWithQuestions, QuestionWithOptions, QuestionOption, Topic, Chapter, Course } from '@/lib/types';
import crypto from 'crypto';

interface TopicData extends Omit<Topic, 'id' | 'created_at' | 'chapter_id' | 'order' | 'explanation'> {
    id?: string; // id is present when updating
    order: number;
    explanation?: string | null;
    quizzes?: QuizState[];
}

interface ChapterData extends Omit<Chapter, 'id' | 'created_at' | 'course_id' | 'order'> {
    id?: string; // id is present when updating
    order: number;
    topics: TopicData[];
}

interface CourseData extends Omit<Course, 'id' | 'created_at'> {
    chapters: ChapterData[];
}

// Represents the state of a quiz from the client-side editor
interface QuizState extends Partial<QuizWithQuestions> {
    id: string;
    questions: QuestionState[];
}

// Represents the state of a question from the client-side editor
interface QuestionState extends Partial<QuestionWithOptions> {
    id: string;
    question_text: string;
    question_type: 'single' | 'multiple';
    order: number;
    question_options: OptionState[];
}

// Represents the state of an option from the client-side editor
interface OptionState extends Partial<QuestionOption> {
    id: string;
    option_text: string;
    is_correct: boolean;
    explanation?: string | null;
}


export async function createCourse(courseData: CourseData) {
    const supabase = createClient();
    
    const { chapters, ...restOfCourseData } = courseData;

    const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
            name: restOfCourseData.name,
            slug: restOfCourseData.slug,
            description: restOfCourseData.description,
            image_url: restOfCourseData.image_url,
            is_paid: restOfCourseData.is_paid,
            price: restOfCourseData.price,
        })
        .select()
        .single();

    if (courseError) {
        console.error('Error creating course:', courseError);
        return { success: false, error: courseError.message };
    }

    for (const [chapterIndex, chapterData] of chapters.entries()) {
        const { topics, ...restOfChapterData } = chapterData;
        const { data: chapter, error: chapterError } = await supabase
            .from('chapters')
            .insert({
                ...restOfChapterData,
                course_id: course.id,
                order: chapterIndex + 1,
            })
            .select()
            .single();

        if (chapterError) {
            console.error('Error creating chapter:', chapterError.message);
            continue;
        }

        for (const [topicIndex, topicData] of topics.entries()) {
            const { quizzes, ...restOfTopicData } = topicData;
            const { data: topic, error: topicError } = await supabase
                .from('topics')
                .insert({
                    ...restOfTopicData,
                    chapter_id: chapter.id,
                    order: topicIndex + 1,
                })
                .select()
                .single();

            if (topicError) {
                console.error('Error creating topic:', topicError.message);
                continue;
            }

            if (quizzes && quizzes.length > 0) {
                try {
                    await upsertQuiz(quizzes[0], topic.id);
                } catch (error: any) {
                    return { success: false, error: error.message };
                }
            }
        }
    }

    revalidatePath('/');
    revalidatePath('/courses');
    revalidatePath(`/courses/${courseData.slug}`);
    revalidatePath('/admin/courses');

    return { success: true, courseId: course.id };
}

async function upsertQuiz(quizData: QuizState, topicId: string) {
    const supabase = createClient();
    
    const isNewQuiz = quizData.id?.startsWith('quiz-');
    let quizIdForUpsert = isNewQuiz ? undefined : (quizData.id || (await supabase.from('quizzes').select('id').eq('topic_id', topicId).single()).data?.id);

    const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .upsert({ id: quizIdForUpsert, topic_id: topicId })
        .select()
        .single();
    
    if (quizError) throw new Error(`Quiz upsert failed: ${quizError.message}`);
    const finalQuizId = quiz.id;

    const { data: existingQuestions } = await supabase.from('questions').select('id').eq('quiz_id', finalQuizId);
    const incomingQuestionIds = quizData.questions.map(q => q.id).filter(id => id && !id.startsWith('q-'));
    const questionsToDelete = existingQuestions?.filter(q => !incomingQuestionIds.includes(q.id)).map(q => q.id) || [];
    
    if (questionsToDelete.length > 0) {
        await supabase.from('questions').delete().in('id', questionsToDelete);
    }

    for (const questionData of quizData.questions) {
        const isNewQuestion = questionData.id?.startsWith('q-');
        const questionPayload: any = {
            quiz_id: finalQuizId,
            question_text: questionData.question_text,
            question_type: questionData.question_type,
            order: questionData.order,
        };
        if (!isNewQuestion) {
            questionPayload.id = questionData.id;
        }

        const { data: question, error: questionError } = await supabase.from('questions').upsert(questionPayload).select().single();
        if (questionError) throw new Error(`Question upsert failed: ${questionError.message}`);
        const finalQuestionId = question.id;

        const { data: existingOptions } = await supabase.from('question_options').select('id').eq('question_id', finalQuestionId);
        const incomingOptionIds = questionData.question_options.map(o => o.id).filter(id => id && !id.startsWith('opt-'));
        const optionsToDelete = existingOptions?.filter(o => !incomingOptionIds.includes(o.id)).map(o => o.id) || [];
        
        if (optionsToDelete.length > 0) {
            await supabase.from('question_options').delete().in('id', optionsToDelete);
        }

        if (questionData.question_options.length > 0) {
            const optionsToUpsert = questionData.question_options.map(opt => {
                const isNewOption = typeof opt.id === 'string' && opt.id.startsWith('opt-');
                
                const optionPayload: any = {
                    question_id: finalQuestionId,
                    option_text: opt.option_text,
                    is_correct: opt.is_correct,
                    explanation: opt.explanation,
                };

                if (!isNewOption) {
                    optionPayload.id = opt.id;
                }
                
                return optionPayload;
            });

            const { error: optionsError } = await supabase.from('question_options').upsert(optionsToUpsert);
            if (optionsError) throw new Error(`Options upsert failed: ${optionsError.message}`);
        }
    }
}


export async function updateCourse(courseId: string, courseData: CourseData) {
    const supabase = createClient();

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

    const { data: existingCourse } = await supabase
        .from('courses')
        .select('id, chapters(id, topics(id))')
        .eq('id', courseId)
        .single();
    
    if(!existingCourse) return { success: false, error: 'Course not found' };

    const existingChapterIds = existingCourse.chapters.map(c => c.id);
    const existingTopicIds = existingCourse.chapters.flatMap(c => c.topics.map(t => t.id));
    
    const incomingChapterIds = courseData.chapters.map(c => c.id).filter(id => id && !id.startsWith('ch-'));
    const incomingTopicIds = courseData.chapters.flatMap(c => c.topics).map(t => t.id).filter(id => id && !id.startsWith('t-'));

    const chaptersToDelete = existingChapterIds.filter(id => !incomingChapterIds.includes(id));
    if (chaptersToDelete.length > 0) {
        await supabase.from('chapters').delete().in('id', chaptersToDelete);
    }
    
    const topicsToDelete = existingTopicIds.filter(id => !incomingTopicIds.includes(id));
    if (topicsToDelete.length > 0) {
        await supabase.from('topics').delete().in('id', topicsToDelete);
    }

    for (const chapterData of courseData.chapters) {
        const isNewChapter = chapterData.id?.startsWith('ch-');
        const chapterToUpsert: any = {
            title: chapterData.title,
            order: chapterData.order,
            course_id: courseId,
        };
        if(!isNewChapter) {
            chapterToUpsert.id = chapterData.id;
        }

        const { data: upsertedChapter, error: chapterUpsertError } = await supabase
            .from('chapters')
            .upsert(chapterToUpsert)
            .select()
            .single();
    
        if (chapterUpsertError) return { success: false, error: `Chapter upsert failed: ${chapterUpsertError.message}` };
        
        for (const topicData of chapterData.topics) {
            const { quizzes, ...topicDetails } = topicData;
            const isNewTopic = topicDetails.id?.startsWith('t-');
            const topicToUpsert: any = {
                ...topicDetails,
                chapter_id: upsertedChapter.id
            };
            delete topicToUpsert.uploadProgress; // Don't save uploadProgress to DB

            if(isNewTopic) {
                delete topicToUpsert.id;
            }
            
            const { data: upsertedTopic, error: topicUpsertError } = await supabase
                .from('topics')
                .upsert(topicToUpsert)
                .select().single();
            
            if (topicUpsertError) return { success: false, error: `Topic upsert failed: ${topicUpsertError.message}` };

            if (quizzes && quizzes.length > 0) {
                try {
                     await upsertQuiz(quizzes[0], upsertedTopic.id);
                } catch(error: any) {
                     return { success: false, error: error.message };
                }
            } else {
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

  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({ topic_id: topicId })
    .select()
    .single();

  if (quizError) {
    console.error('Error creating quiz:', quizError);
    if (quizError.code === '23505') { 
        return { success: false, error: 'A quiz already exists for this topic.'};
    }
    return { success: false, error: 'Failed to create quiz entry.' };
  }

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
    await supabase.from('quizzes').delete().eq('id', quiz.id);
    return { success: false, error: 'Failed to save quiz questions.' };
  }

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
        return { success: false, error: 'Failed to save quiz options.' };
    }
  }

  return { success: true, quizId: quiz.id };
}
