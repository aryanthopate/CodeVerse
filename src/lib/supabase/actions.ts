

'use server';

import { createClient } from './server';
import { revalidatePath } from 'next/cache';
import type { QuizWithQuestions, QuestionWithOptions, QuestionOption, Topic, Chapter, Course, Game, GameLevel, GameChapter } from '@/lib/types';
import crypto from 'crypto';
import placeholderGames from '@/lib/placeholder-games.json';

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

interface CourseData extends Omit<Course, 'id' | 'created_at' > {
    chapters: ChapterData[];
    related_courses?: string[];
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
    
    const { chapters, related_courses, ...restOfCourseData } = courseData;

    const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
            name: restOfCourseData.name,
            slug: restOfCourseData.slug,
            description: restOfCourseData.description,
            image_url: restOfCourseData.image_url,
            is_paid: restOfCourseData.is_paid,
            price: restOfCourseData.price,
            rating: restOfCourseData.rating,
            what_you_will_learn: restOfCourseData.what_you_will_learn,
            preview_video_url: restOfCourseData.preview_video_url,
            language: restOfCourseData.language,
            notes_url: restOfCourseData.notes_url,
            total_duration_hours: restOfCourseData.total_duration_hours,
            tags: restOfCourseData.tags,
        })
        .select()
        .single();

    if (courseError) {
        console.error('Error creating course:', courseError);
        return { success: false, error: courseError.message };
    }

    if (related_courses && related_courses.length > 0) {
        const relationsToInsert = related_courses.map(relatedId => ({
            course_id: course.id,
            related_course_id: relatedId
        }));
        await supabase.from('related_courses').insert(relationsToInsert);
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

        const optionsToUpsert = questionData.question_options.map(opt => {
            const optionPayload: any = {
                question_id: finalQuestionId,
                option_text: opt.option_text,
                is_correct: opt.is_correct,
                explanation: opt.explanation,
            };

            // Only include the ID if it's a real, existing UUID, not a temporary one.
            if (typeof opt.id === 'string' && !opt.id.startsWith('opt-')) {
                optionPayload.id = opt.id;
            }
            
            return optionPayload;
        });

        if (optionsToUpsert.length > 0) {
            const { error: optionsError } = await supabase.from('question_options').upsert(optionsToUpsert);
            if (optionsError) throw new Error(`Options upsert failed: ${optionsError.message}`);
        }
    }
}


export async function updateCourse(courseId: string, courseData: CourseData) {
    const supabase = createClient();
    
    const { chapters, related_courses, ...restOfCourseData } = courseData;

    const { error: courseError } = await supabase
        .from('courses')
        .update({
            name: restOfCourseData.name,
            slug: restOfCourseData.slug,
            description: restOfCourseData.description,
            image_url: restOfCourseData.image_url,
            is_paid: restOfCourseData.is_paid,
            price: restOfCourseData.price,
            what_you_will_learn: restOfCourseData.what_you_will_learn,
            preview_video_url: restOfCourseData.preview_video_url,
            language: restOfCourseData.language,
            notes_url: restOfCourseData.notes_url,
            total_duration_hours: restOfCourseData.total_duration_hours,
            tags: restOfCourseData.tags,
        })
        .eq('id', courseId);

    if (courseError) {
        console.error('Error updating course:', courseError);
        return { success: false, error: courseError.message };
    }

    // Handle related courses
    await supabase.from('related_courses').delete().eq('course_id', courseId);
    if (related_courses && related_courses.length > 0) {
        const relationsToInsert = related_courses.map(relatedId => ({
            course_id: courseId,
            related_course_id: relatedId
        }));
        await supabase.from('related_courses').insert(relationsToInsert);
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
                chapter_id: upsertedChapter.id,
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

export async function enrollInCourse(courseId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "You must be logged in to enroll." };
    }

    const { error } = await supabase.from('user_enrollments').insert({
        user_id: user.id,
        course_id: courseId,
    });

    if (error) {
        if (error.code === '23505') { // Unique constraint violation
            return { success: true, message: "Already enrolled." };
        }
        console.error("Error enrolling user in course:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/courses');
    revalidatePath(`/courses/${courseId}`); // Revalidate specific course page

    return { success: true };
}


export async function giftCourseToUser(courseId: string, recipientEmail: string) {
    const supabase = createClient();
    const { data: { user: gifterUser } } = await supabase.auth.getUser();

    if (!gifterUser) {
        return { success: false, error: "You must be logged in to gift a course." };
    }

    // Find the recipient user by email
    const { data: recipientProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', recipientEmail)
        .single();
    
    if (profileError || !recipientProfile) {
        return { success: false, error: `Could not find a user with the email: ${recipientEmail}. Please make sure they have a CodeVerse account.` };
    }

    const recipientId = recipientProfile.id;

    // Enroll the user in the course with the gifted flag
    const { error: enrollError } = await supabase.from('user_enrollments').insert({
        user_id: recipientId,
        course_id: courseId,
        is_gifted: true,
    });

     if (enrollError) {
        if (enrollError.code === '23505') { // Unique constraint violation
            return { success: false, error: `This user is already enrolled in the course.` };
        }
        console.error("Error enrolling user in gifted course:", enrollError);
        return { success: false, error: `Failed to enroll the user: ${enrollError.message}` };
    }

    // Record the gift transaction
    const { error: giftRecordError } = await supabase.from('course_gifts').insert({
        course_id: courseId,
        gifter_user_id: gifterUser.id,
        recipient_user_id: recipientId,
    });

     if (giftRecordError) {
        // This is not a critical failure, but should be logged. The user has the course.
        console.error("Critical: Failed to record gift transaction after enrollment:", giftRecordError);
    }
    
    return { success: true, message: `Successfully gifted the course to ${recipientEmail}!` };
}

interface LevelData extends Omit<GameLevel, 'id' | 'created_at' | 'chapter_id' | 'order' | 'slug'> {
    id: string; // Temporary client-side ID
    order: number;
    slug: string;
}
interface GameChapterData extends Omit<GameChapter, 'id' | 'created_at' | 'game_id' | 'order'> {
    id: string; // Temporary client-side ID
    order: number;
    game_levels: LevelData[];
}
interface GameData extends Omit<Game, 'id' | 'created_at'> {
    game_chapters: GameChapterData[];
}

export async function createGame(gameData: GameData) {
    const supabase = createClient();
    const { game_chapters, ...restOfGameData } = gameData;

    const { data: newGame, error: gameError } = await supabase
        .from('games')
        .insert(restOfGameData)
        .select()
        .single();

    if (gameError) {
        return { success: false, error: `Game creation failed: ${gameError.message}` };
    }

    for (const chapterData of game_chapters) {
        const { game_levels, ...restOfChapterData } = chapterData;
        const chapterPayload: Omit<GameChapter, 'id' | 'created_at'> = {
            title: restOfChapterData.title,
            order: restOfChapterData.order,
            game_id: newGame.id,
        };
        const { data: newChapter, error: chapterError } = await supabase
            .from('game_chapters')
            .insert(chapterPayload)
            .select()
            .single();

        if (chapterError) {
            console.error('Error creating game chapter:', chapterError.message);
            // Rollback game creation for consistency
            await supabase.from('games').delete().eq('id', newGame.id);
            return { success: false, error: chapterError.message };
        }

        if (game_levels && game_levels.length > 0) {
             const levelsToInsert = game_levels.map(level => {
                const { id, ...restOfLevel } = level; // Exclude the temporary client-side id
                return {
                    ...restOfLevel,
                    chapter_id: newChapter.id,
                };
            });
            const { error: levelsError } = await supabase.from('game_levels').insert(levelsToInsert as any);

            if (levelsError) {
                console.error('Error creating game levels:', levelsError.message);
                await supabase.from('games').delete().eq('id', newGame.id);
                return { success: false, error: levelsError.message };
            }
        }
    }
    
    revalidatePath('/admin/games');
    revalidatePath('/playground');

    return { success: true, gameId: newGame.id };
}


export async function seedDemoGames() {
    const supabase = createClient();

    const { data: existingGames, error: fetchError } = await supabase
        .from('games')
        .select('title');

    if (fetchError) {
        return { success: false, error: `Failed to check for existing games: ${fetchError.message}` };
    }

    const existingTitles = existingGames.map(g => g.title);
    const gamesToInsert = placeholderGames.filter(g => !existingTitles.includes(g.title));

    if (gamesToInsert.length === 0) {
        return { success: true, message: 'Demo games have already been seeded.' };
    }

    for (const game of gamesToInsert) {
        const { chapters, ...gameData } = game;
        
        const { data: newGame, error: gameError } = await supabase
            .from('games')
            .insert(gameData as any)
            .select()
            .single();

        if (gameError) {
            console.error(`Error inserting game "${game.title}":`, gameError);
            return { success: false, error: `Failed to insert game "${game.title}": ${gameError.message}` };
        }

        for (const chapter of chapters) {
            const { levels, ...chapterData } = chapter;
            const { data: newChapter, error: chapterError } = await supabase
                .from('game_chapters')
                .insert({ ...chapterData, game_id: newGame.id })
                .select().single();

            if (chapterError) {
                 await supabase.from('games').delete().eq('id', newGame.id);
                 return { success: false, error: `Failed to insert chapter for "${game.title}": ${chapterError.message}` };
            }

            const levelsToInsert = levels.map((level: any, index: number) => {
                const baseSlug = level.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                // Append a short hash to ensure uniqueness, just in case titles are identical
                const uniqueId = crypto.randomBytes(3).toString('hex');
                return {
                    ...level,
                    slug: `${baseSlug}-${uniqueId}`,
                    chapter_id: newChapter.id,
                    order: index + 1
                };
            });

            if (levelsToInsert.length > 0) {
                const { error: levelsError } = await supabase
                    .from('game_levels')
                    .insert(levelsToInsert);
                if (levelsError) {
                    await supabase.from('games').delete().eq('id', newGame.id);
                    return { success: false, error: `Failed to insert levels for "${game.title}": ${levelsError.message}` };
                }
            }
        }
    }
    
    revalidatePath('/admin/games');
    revalidatePath('/playground');

    return { success: true };
}

export async function deleteGame(gameId: string) {
    const supabase = createClient();
    const { error } = await supabase.from('games').delete().eq('id', gameId);
    if (error) {
        return { success: false, error: `Failed to delete game: ${error.message}` };
    }
    revalidatePath('/admin/games');
    revalidatePath('/playground');
    return { success: true };
}

export async function deleteMultipleGames(gameIds: string[]) {
    const supabase = createClient();
    const { error } = await supabase.from('games').delete().in('id', gameIds);
    if (error) {
        return { success: false, error: `Failed to delete games: ${error.message}` };
    }
    revalidatePath('/admin/games');
    revalidatePath('/playground');
    return { success: true };
}

export async function completeGameLevel(levelId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "User not authenticated" };
    }
    
    const { data: levelData, error: levelError } = await supabase
        .from('game_levels')
        .select('game_chapters(game_id)')
        .eq('id', levelId)
        .single();
    
    if (levelError || !levelData || !levelData.game_chapters) {
        console.error("Could not find the game for this level:", levelError?.message);
        return { success: false, error: "Could not find the game for this level." };
    }
    const gameId = levelData.game_chapters.game_id;

    const { error } = await supabase.from('user_game_progress').upsert({
        user_id: user.id,
        game_id: gameId,
        completed_level_id: levelId,
        completed_at: new Date().toISOString(),
    }, {
        onConflict: 'user_id,completed_level_id'
    });

    if (error) {
        console.error("Error saving game progress:", error);
        return { success: false, error: "Could not save progress." };
    }

    revalidatePath(`/playground/${gameId}`);

    return { success: true };
}
    

    

    




