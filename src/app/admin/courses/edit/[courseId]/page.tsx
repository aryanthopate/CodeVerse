
'use client';

import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { updateCourse } from '@/lib/supabase/actions';
import { X, Plus, Book, FileText, Sparkles, Image as ImageIcon, Upload, IndianRupee, Trash2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { CourseWithChaptersAndTopics, QuizWithQuestions, QuestionWithOptions, QuestionOption } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type QuestionType = 'single' | 'multiple';

interface OptionState extends Partial<QuestionOption> {
    id: string;
    option_text: string;
    is_correct: boolean;
}

interface QuestionState extends Partial<QuestionWithOptions> {
    id: string;
    question_text: string;
    question_type: QuestionType;
    order: number;
    question_options: OptionState[];
}

interface QuizState extends Partial<QuizWithQuestions> {
    id: string;
    questions: QuestionState[];
}

interface TopicState {
    id?: string;
    title: string;
    slug: string;
    is_free: boolean;
    video_url: string;
    content?: string;
    summary?: string;
    uploadProgress?: number;
    quizzes?: QuizState[];
}

interface ChapterState {
    id?: string;
    title: string;
    topics: TopicState[];
}

function ManualQuizEditor({ topic, onTopicChange, chapterId, topicId }: { topic: TopicState; onTopicChange: (chapterId: string, topicId: string, field: keyof TopicState, value: any) => void; chapterId: string; topicId: string; }) {
    
    const quiz = topic.quizzes?.[0];

    const handleAddQuiz = () => {
        const newQuiz: QuizState = {
            id: `quiz-${Date.now()}`,
            questions: [],
        };
        onTopicChange(chapterId, topicId, 'quizzes', [newQuiz]);
    };

    const handleAddQuestion = () => {
        if (!quiz) return;
        const newQuestion: QuestionState = {
            id: `q-${Date.now()}`,
            question_text: '',
            question_type: 'single',
            order: quiz.questions.length + 1,
            question_options: [],
        };
        const updatedQuiz = { ...quiz, questions: [...quiz.questions, newQuestion] };
        onTopicChange(chapterId, topicId, 'quizzes', [updatedQuiz]);
    };

    const handleRemoveQuestion = (questionId: string) => {
        if (!quiz) return;
        const updatedQuestions = quiz.questions.filter(q => q.id !== questionId);
        const updatedQuiz = { ...quiz, questions: updatedQuestions };
        onTopicChange(chapterId, topicId, 'quizzes', [updatedQuiz]);
    };

    const handleQuestionChange = (questionId: string, field: keyof QuestionState, value: any) => {
        if (!quiz) return;
        const updatedQuestions = quiz.questions.map(q => {
            if (q.id === questionId) {
                return { ...q, [field]: value };
            }
            return q;
        });
        const updatedQuiz = { ...quiz, questions: updatedQuestions };
        onTopicChange(chapterId, topicId, 'quizzes', [updatedQuiz]);
    };

    const handleAddOption = (questionId: string) => {
        if (!quiz) return;
        const newOption: OptionState = { id: `opt-${Date.now()}`, option_text: '', is_correct: false };
        const updatedQuestions = quiz.questions.map(q => {
            if (q.id === questionId) {
                return { ...q, question_options: [...q.question_options, newOption] };
            }
            return q;
        });
        const updatedQuiz = { ...quiz, questions: updatedQuestions };
        onTopicChange(chapterId, topicId, 'quizzes', [updatedQuiz]);
    };

    const handleRemoveOption = (questionId: string, optionId: string) => {
        if (!quiz) return;
         const updatedQuestions = quiz.questions.map(q => {
            if (q.id === questionId) {
                return { ...q, question_options: q.question_options.filter(o => o.id !== optionId) };
            }
            return q;
        });
        const updatedQuiz = { ...quiz, questions: updatedQuestions };
        onTopicChange(chapterId, topicId, 'quizzes', [updatedQuiz]);
    };

    const handleOptionChange = (questionId: string, optionId: string, field: 'option_text' | 'is_correct', value: any) => {
         if (!quiz) return;
         const updatedQuestions = quiz.questions.map(q => {
            if (q.id === questionId) {
                let newOptions = q.question_options.map(o => {
                    if (o.id === optionId) {
                        return { ...o, [field]: value };
                    }
                    // If it's a single choice question, unselect other options
                    if (q.question_type === 'single' && field === 'is_correct' && value === true) {
                        return { ...o, is_correct: false };
                    }
                    return o;
                });
                
                // Make sure the changed option is correctly set
                if (q.question_type === 'single' && field === 'is_correct' && value === true) {
                   newOptions = newOptions.map(o => o.id === optionId ? {...o, is_correct: true} : o);
                }

                return { ...q, question_options: newOptions };
            }
            return q;
        });
        const updatedQuiz = { ...quiz, questions: updatedQuestions };
        onTopicChange(chapterId, topicId, 'quizzes', [updatedQuiz]);
    }
    
    if (!quiz) {
        return (
            <div className="pt-2 px-4 flex flex-col gap-2">
                <Label className="text-sm font-medium">Quiz Management</Label>
                <div className="p-4 border-dashed border-2 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">No quiz exists for this topic.</p>
                    <Button variant="link" onClick={handleAddQuiz}>Create a Manual Quiz</Button>
                </div>
            </div>
        )
    }

    return (
         <div className="pt-2 px-4 flex flex-col gap-4">
            <Label className="text-sm font-medium">Quiz Management</Label>
            <div className="p-4 bg-muted/30 rounded-lg space-y-4">
                {quiz.questions.map((q, qIndex) => (
                    <Card key={q.id}>
                        <CardHeader className='flex-row items-center justify-between p-4'>
                            <CardTitle className='text-lg'>Question {qIndex + 1}</CardTitle>
                            <div className='flex items-center gap-2'>
                                 <Select value={q.question_type} onValueChange={(value: QuestionType) => handleQuestionChange(q.id, 'question_type', value)}>
                                    <SelectTrigger className="w-[180px] h-9">
                                        <SelectValue placeholder="Question Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="single">Single Choice</SelectItem>
                                        <SelectItem value="multiple">Multiple Choice</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveQuestion(q.id)}><Trash2 className="text-destructive h-4 w-4"/></Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-4">
                            <Textarea 
                                placeholder="Enter question text..." 
                                value={q.question_text}
                                onChange={e => handleQuestionChange(q.id, 'question_text', e.target.value)}
                            />
                            <div className='space-y-2'>
                                <Label className="text-xs">Options</Label>
                                {q.question_options.map(opt => (
                                    <div key={opt.id} className="flex items-center gap-2">
                                        {q.question_type === 'single' ? (
                                            <RadioGroup
                                                value={q.question_options.find(o => o.is_correct)?.id}
                                                onValueChange={() => handleOptionChange(q.id, opt.id, 'is_correct', true)}
                                            >
                                                <RadioGroupItem value={opt.id} id={`rb-${opt.id}`} />
                                            </RadioGroup>
                                        ) : (
                                            <Checkbox
                                                id={`cb-${opt.id}`}
                                                checked={opt.is_correct}
                                                onCheckedChange={checked => handleOptionChange(q.id, opt.id, 'is_correct', checked)}
                                            />
                                        )}
                                        <Input 
                                            value={opt.option_text}
                                            onChange={(e) => handleOptionChange(q.id, opt.id, 'option_text', e.target.value)}
                                            className="h-9"
                                            placeholder="Option text..."
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(q.id, opt.id)}><X className="h-4 w-4"/></Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => handleAddOption(q.id)}><Plus className="mr-2 h-4 w-4"/>Add Option</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                <Button onClick={handleAddQuestion}><Plus className="mr-2"/>Add Question</Button>
            </div>
        </div>
    );
}

export default function EditCoursePage() {
    const params = useParams();
    const courseId = params.courseId as string;
    const { toast } = useToast();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const [courseName, setCourseName] = useState('');
    const [courseSlug, setCourseSlug] = useState('');
    const [courseDescription, setCourseDescription] = useState('');
    const [courseImageUrl, setCourseImageUrl] = useState('');
    const [isPaid, setIsPaid] = useState(false);
    const [price, setPrice] = useState<number | string>(0);

    const [chapters, setChapters] = useState<ChapterState[]>([]);
    
    const handleTopicChange = useCallback((chapterId: string, topicId: string, field: keyof TopicState, value: any) => {
        setChapters(prev => prev.map(c => {
            if (c.id === chapterId) {
                return {
                    ...c,
                    topics: c.topics.map(t => {
                        if (t.id === topicId) {
                             const updatedTopic = { ...t, [field]: value };
                            if (field === 'title' && typeof value === 'string') {
                                updatedTopic.slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                            }
                            return updatedTopic;
                        }
                        return t;
                    })
                };
            }
            return c;
        }));
    }, []);

    const fetchCourse = useCallback(async () => {
        if (!courseId) return;
        setInitialLoading(true);
        try {
            const { data: courseData, error } = await supabase
                .from('courses')
                .select('*, chapters(*, topics(*, quizzes(*, questions(*, question_options(*)))))')
                .eq('id', courseId)
                .order('order', { foreignTable: 'chapters', ascending: true })
                .order('order', { foreignTable: 'chapters.topics', ascending: true })
                .order('order', { foreignTable: 'chapters.topics.quizzes.questions', ascending: true })
                .single();
            
            if (error) throw error;
            
            if (courseData) {
                const course = courseData as CourseWithChaptersAndTopics;
                setCourseName(course.name);
                setCourseSlug(course.slug);
                setCourseDescription(course.description || '');
                setCourseImageUrl(course.image_url || '');
                setIsPaid(course.is_paid || false);
                setPrice(course.price || 0);

                setChapters(course.chapters.map(c => ({
                    id: c.id,
                    title: c.title,
                    topics: (c.topics || []).map(t => ({
                        id: t.id,
                        title: t.title,
                        slug: t.slug,
                        is_free: t.is_free,
                        video_url: t.video_url || '',
                        content: t.content || '',
                        summary: t.summary || '',
                        uploadProgress: undefined,
                        quizzes: (t.quizzes || []).map(q => ({
                            ...q,
                            id: q.id || `quiz-${Date.now()}`,
                            questions: (q.questions || []).map(qu => ({
                                ...qu,
                                id: qu.id || `q-${Date.now()}`,
                                question_options: (qu.question_options || []).map(o => ({...o, id: o.id || `opt-${Date.now()}`}))
                            }))
                        }))
                    }))
                })));
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'Course not found',
                    description: 'Could not load the course data to edit.'
                });
            }
        } catch (err: any) {
            console.error("Failed to fetch course:", err);
            toast({
                variant: 'destructive',
                title: 'Error Loading Course',
                description: err.message || 'An unexpected error occurred while fetching course data.'
            });
        } finally {
            setInitialLoading(false);
        }
    }, [courseId, supabase, toast]);

    useEffect(() => {
        fetchCourse();
    }, [fetchCourse]);
    

    const handleAddChapter = () => {
        setChapters([...chapters, { id: `ch-${Date.now()}`, title: '', topics: [{ id: `t-${Date.now()}`, title: '', slug: '', is_free: false, video_url: '' }] }]);
    };

    const handleRemoveChapter = (chapterId: string) => {
        const newChapters = chapters.filter(c => c.id !== chapterId);
        setChapters(newChapters);
    };

    const handleChapterChange = (chapterId: string, value: string) => {
        const newChapters = chapters.map(c => c.id === chapterId ? { ...c, title: value } : c);
        setChapters(newChapters);
    };

    const handleAddTopic = (chapterId: string) => {
        const newChapters = chapters.map(c => {
            if (c.id === chapterId) {
                return { ...c, topics: [...c.topics, { id: `t-${Date.now()}`, title: '', slug: '', is_free: false, video_url: '', content: '', summary: '' }] };
            }
            return c;
        });
        setChapters(newChapters);
    };

    const handleRemoveTopic = (chapterId: string, topicId: string) => {
        const newChapters = chapters.map(c => {
            if (c.id === chapterId) {
                return { ...c, topics: c.topics.filter(t => t.id !== topicId) };
            }
            return c;
        });
        setChapters(newChapters);
    };
    
    const handleVideoFileChange = async (chapterId: string, topicId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const chapter = chapters.find(c => c.id === chapterId);
        const topic = chapter?.topics.find(t => t.id === topicId);
        if (!topic) return;

        const filePath = `${courseId}/${topic.slug}-${file.name}`;

        handleTopicChange(chapterId, topicId, 'uploadProgress', 0);
        
        const { error: uploadError } = await supabase.storage
            .from('course_videos')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true,
                contentType: file.type,
            });


        if (uploadError) {
            toast({
                variant: 'destructive',
                title: 'Video Upload Failed',
                description: uploadError.message,
            });
            handleTopicChange(chapterId, topicId, 'uploadProgress', undefined);
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('course_videos')
            .getPublicUrl(filePath);

        handleTopicChange(chapterId, topicId, 'video_url', publicUrl);
        handleTopicChange(chapterId, topicId, 'uploadProgress', 100);

        toast({
            title: 'Upload Complete!',
            description: 'The video has been successfully uploaded and linked.',
        });
        
        setTimeout(() => {
            handleTopicChange(chapterId, topicId, 'uploadProgress', undefined);
        }, 2000);
    };


     const handleCourseNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setCourseName(name);
        setCourseSlug(name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setCourseImageUrl(result);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const courseData = {
            name: courseName,
            slug: courseSlug,
            description: courseDescription,
            image_url: courseImageUrl,
            is_paid: isPaid,
            price: Number(price),
            chapters: chapters.map((chapter, chapterIndex) => ({
                id: chapter.id?.startsWith('ch-') ? undefined : chapter.id,
                title: chapter.title,
                order: chapterIndex + 1,
                topics: chapter.topics.map((topic, topicIndex) => ({
                    id: topic.id?.startsWith('t-') ? undefined : topic.id,
                    title: topic.title,
                    slug: topic.slug,
                    is_free: topic.is_free,
                    video_url: topic.video_url,
                    content: topic.content,
                    summary: topic.summary,
                    order: topicIndex + 1,
                    quizzes: topic.quizzes?.map(quiz => ({
                        ...quiz,
                        id: quiz.id?.startsWith('quiz-') ? undefined : quiz.id,
                        questions: quiz.questions.map(q => ({
                            ...q,
                            id: q.id?.startsWith('q-') ? undefined : q.id,
                            question_options: q.question_options.map(o => ({
                                ...o,
                                id: o.id?.startsWith('opt-') ? undefined : o.id,
                            }))
                        }))
                    }))
                }))
            }))
        };
        
        try {
            const result = await updateCourse(courseId, courseData as any);
            if (result.success) {
                toast({
                    title: "Course Updated!",
                    description: `${courseName} has been successfully saved.`,
                });
                // Re-fetch to get the updated data with new DB-generated IDs
                await fetchCourse();
            } else {
                throw new Error(result.error || 'An unknown error occurred');
            }
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: error.message || "Could not save the course. Please check your inputs and try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
      return (
        <AdminLayout>
          <div>Loading course editor...</div>
        </AdminLayout>
      );
    }


    return (
        <AdminLayout>
             <div className="space-y-8">
                <div>
                    <h1 className="text-4xl font-bold">Edit Course</h1>
                    <p className="text-lg text-muted-foreground mt-1">Editing course: <span className="font-semibold text-foreground">{courseName}</span></p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Course Details Column */}
                        <div className="lg:col-span-1 space-y-6 sticky top-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Course Details</CardTitle>
                                    <CardDescription>Provide the main details for the course.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="course-name">Course Name</Label>
                                        <Input id="course-name" value={courseName} onChange={handleCourseNameChange} placeholder="e.g., Introduction to Python" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="course-slug">Course Slug</Label>
                                        <Input id="course-slug" value={courseSlug} onChange={e => setCourseSlug(e.target.value)} placeholder="e.g., python-intro" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="course-description">Description</Label>
                                        <Textarea id="course-description" value={courseDescription} onChange={e => setCourseDescription(e.target.value)} placeholder="A brief summary of the course." className="min-h-[100px]"/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Course Image</Label>
                                        <Card className="border-dashed">
                                            <CardContent className="p-4">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    {courseImageUrl ? (
                                                        <Image src={courseImageUrl} alt="Image preview" width={400} height={200} className="rounded-md max-h-40 w-auto object-contain"/>
                                                    ) : (
                                                        <ImageIcon className="w-12 h-12 text-muted-foreground" />
                                                    )}
                                                    <Input id="image-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*"/>
                                                    <Label htmlFor="image-upload" className="cursor-pointer text-primary text-sm underline">
                                                        {courseImageUrl ? 'Change image' : 'Upload an image'}
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                     <div className="space-y-2">
                                      <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                          <Label>Paid Course</Label>
                                          <CardDescription>Is this a premium course?</CardDescription>
                                        </div>
                                        <Switch
                                          checked={isPaid}
                                          onCheckedChange={setIsPaid}
                                        />
                                      </div>
                                    </div>
                                     {isPaid && (
                                        <div className="space-y-2">
                                            <Label htmlFor="course-price">Price (₹)</Label>
                                            <div className="relative">
                                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="course-price"
                                                    type="number"
                                                    value={price}
                                                    onChange={e => setPrice(e.target.value)}
                                                    placeholder="e.g., 499"
                                                    className="pl-8"
                                                    min="0"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                             <Button type="submit" size="lg" className="w-full" disabled={loading}>
                                {loading ? 'Saving Changes...' : 'Save Changes'}
                            </Button>
                        </div>

                        {/* Chapters and Topics Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {chapters.map((chapter, chapterIndex) => (
                                <Card key={chapter.id} className="bg-muted/30">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div className="space-y-1.5 flex-grow mr-4">
                                            <CardTitle className="flex items-center gap-2"><Book className="text-primary"/> Chapter {chapterIndex + 1}</CardTitle>
                                            <Input placeholder="Chapter Title, e.g., 'Getting Started'" value={chapter.title} onChange={e => handleChapterChange(chapter.id!, e.target.value)} required className="text-lg font-semibold p-0 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"/>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveChapter(chapter.id!)}>
                                            <X className="text-destructive"/>
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pl-10">
                                         <Accordion type="single" collapsible className="w-full">
                                            {chapter.topics.map((topic, topicIndex) => (
                                                <AccordionItem key={topic.id} value={topic.id!} className="bg-background border rounded-lg mb-4">
                                                    <AccordionTrigger className="p-4 text-base font-semibold hover:no-underline">
                                                        Topic {topicIndex + 1}: {topic.title || 'New Topic'}
                                                    </AccordionTrigger>
                                                    <AccordionContent className="p-4 pt-0">
                                                         <div className="flex flex-col gap-4 relative">
                                                            <div className="flex items-start gap-4">
                                                                <FileText className="mt-2.5 text-accent-foreground/50"/>
                                                                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor={`topic-title-${chapter.id}-${topic.id}`}>Topic Title</Label>
                                                                        <Input id={`topic-title-${chapter.id}-${topic.id}`} value={topic.title} onChange={e => handleTopicChange(chapter.id!, topic.id!, 'title', e.target.value)} placeholder="e.g., 'Variables'" required />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor={`topic-slug-${chapter.id}-${topic.id}`}>Topic Slug</Label>
                                                                        <Input id={`topic-slug-${chapter.id}-${topic.id}`} value={topic.slug} onChange={e => handleTopicChange(chapter.id!, topic.id!, 'slug', e.target.value)} placeholder="e.g., 'variables'" required />
                                                                    </div>
                                                                    <div className="space-y-2 sm:col-span-2">
                                                                        <Label htmlFor={`topic-video-${chapter.id}-${topic.id}`}>Video URL or Upload</Label>
                                                                        <div className="flex items-center gap-2">
                                                                            <Input 
                                                                                id={`topic-video-${chapter.id}-${topic.id}`} 
                                                                                value={topic.video_url} 
                                                                                onChange={e => handleTopicChange(chapter.id!, topic.id!, 'video_url', e.target.value)} 
                                                                                placeholder="Upload a file or paste a direct video link"
                                                                                className="flex-grow"
                                                                            />
                                                                            <Button type="button" variant="outline" size="icon" asChild>
                                                                                <Label htmlFor={`video-upload-${chapter.id}-${topic.id}`} className="cursor-pointer">
                                                                                    <Upload className="h-4 w-4" />
                                                                                    <span className="sr-only">Upload Video</span>
                                                                                </Label>
                                                                            </Button>
                                                                            <Input id={`video-upload-${chapter.id}-${topic.id}`} type="file" className="sr-only" accept="video/*" onChange={(e) => handleVideoFileChange(chapter.id!, topic.id!, e)} />
                                                                        </div>
                                                                        {topic.uploadProgress !== undefined && (
                                                                            <div className="mt-2 space-y-1">
                                                                                <Progress value={topic.uploadProgress} className="h-2" />
                                                                                <p className="text-xs text-muted-foreground text-center">{topic.uploadProgress === 100 ? "Upload complete!" : `Uploading... ${topic.uploadProgress}%`}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center space-x-2 sm:col-span-2 pt-2">
                                                                        <Switch
                                                                        id={`is-free-${chapter.id}-${topic.id}`}
                                                                        checked={topic.is_free}
                                                                        onCheckedChange={checked => handleTopicChange(chapter.id!, topic.id!, 'is_free', checked)}
                                                                        />
                                                                        <Label htmlFor={`is-free-${chapter.id}-${topic.id}`} className="text-sm font-medium">This topic is a free preview</Label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="border-t border-dashed -mx-4 mt-2"></div>

                                                            <div className="pt-2 px-4 flex flex-col gap-2">
                                                                <Label className="text-sm font-medium">Video Summary</Label>
                                                                <Textarea 
                                                                    value={topic.summary || ''}
                                                                    onChange={e => handleTopicChange(chapter.id!, topic.id!, 'summary', e.target.value)}
                                                                    placeholder="Manually enter a summary for the video."
                                                                    className="mt-2 min-h-[120px]"
                                                                    rows={4}
                                                                />
                                                            </div>
                                                            
                                                            <div className="border-t border-dashed -mx-4 mt-2"></div>

                                                            <div className="pt-2 px-4 flex flex-col gap-2">
                                                                <Label className="text-sm font-medium">Coding Challenge (Markdown)</Label>
                                                                <Textarea 
                                                                    value={topic.content || ''}
                                                                    onChange={e => handleTopicChange(chapter.id!, topic.id!, 'content', e.target.value)}
                                                                    placeholder="Manually enter a coding challenge in Markdown format."
                                                                    className="mt-2 min-h-[120px] font-mono"
                                                                    rows={6}
                                                                />
                                                            </div>

                                                            <div className="border-t border-dashed -mx-4 mt-2"></div>
                                                            
                                                            <ManualQuizEditor 
                                                                topic={topic} 
                                                                onTopicChange={handleTopicChange} 
                                                                chapterId={chapter.id!} 
                                                                topicId={topic.id!}
                                                            />

                                                            <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1" onClick={() => handleRemoveTopic(chapter.id!, topic.id!)}>
                                                                <X className="w-4 h-4 text-muted-foreground"/>
                                                            </Button>
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                        <Button type="button" variant="outline" onClick={() => handleAddTopic(chapter.id!)}>
                                            <Plus className="mr-2"/> Add Topic
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                             <Button type="button" onClick={handleAddChapter} className="w-full">
                                <Plus className="mr-2"/> Add Another Chapter
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

    