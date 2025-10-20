
'use client';

import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { updateCourse } from '@/lib/supabase/actions';
import { X, Plus, Book, FileText, Sparkles, Image as ImageIcon, Video, Bot, Upload, IndianRupee } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { generateCourseDescription } from '@/ai/flows/generate-course-description';
import { generateCodeTask } from '@/ai/flows/generate-code-task';
import Image from 'next/image';
import type { CourseWithChaptersAndTopics } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { generateQuizFromTranscript } from '@/ai/flows/generate-quiz-from-transcript';


interface TopicState {
    id?: string;
    title: string;
    slug: string;
    is_free: boolean;
    video_url: string;
    content?: string;
    uploadProgress?: number;
    isGeneratingTask?: boolean;
    isGeneratingQuiz?: boolean;
}

interface ChapterState {
    id?: string;
    title: string;
    topics: TopicState[];
}

export default function EditCoursePage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.courseId as string;
    const { toast } = useToast();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const [courseName, setCourseName] = useState('');
    const [courseSlug, setCourseSlug] = useState('');
    const [courseDescription, setCourseDescription] = useState('');
    const [courseImageUrl, setCourseImageUrl] = useState('');
    const [imagePreview, setImagePreview] = useState('');
    const [isPaid, setIsPaid] = useState(false);
    const [price, setPrice] = useState<number | string>(0);

    const [chapters, setChapters] = useState<ChapterState[]>([]);

    useEffect(() => {
        const fetchCourse = async () => {
            setInitialLoading(true);
            const { data: courseData } = await supabase
                .from('courses')
                .select('*, chapters(*, topics(*))')
                .eq('id', courseId)
                .order('order', { foreignTable: 'chapters', ascending: true })
                .order('order', { foreignTable: 'chapters.topics', ascending: true })
                .single();
            
            if (courseData) {
                const course = courseData as CourseWithChaptersAndTopics;
                setCourseName(course.name);
                setCourseSlug(course.slug);
                setCourseDescription(course.description || '');
                setCourseImageUrl(course.image_url || '');
                setImagePreview(course.image_url || '');
                setIsPaid(course.is_paid || false);
                setPrice(course.price || 0);
                setChapters(course.chapters.map(c => ({
                    id: c.id,
                    title: c.title,
                    topics: c.topics.map(t => ({
                        id: t.id,
                        title: t.title,
                        slug: t.slug,
                        is_free: t.is_free,
                        video_url: t.video_url || '',
                        content: t.content || '',
                        uploadProgress: undefined,
                        isGeneratingTask: false,
                        isGeneratingQuiz: false,
                    }))
                })));
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'Course not found',
                    description: 'Could not load the course data to edit.'
                });
                router.push('/admin/courses');
            }
            setInitialLoading(false);
        }
        if (courseId) {
            fetchCourse();
        }
    }, [courseId, router, supabase, toast]);
    

    const handleAddChapter = () => {
        setChapters([...chapters, { title: '', topics: [{ title: '', slug: '', is_free: false, video_url: '' }] }] as any);
    };

    const handleRemoveChapter = (index: number) => {
        const newChapters = chapters.filter((_, i) => i !== index);
        setChapters(newChapters as any);
    };

    const handleChapterChange = (index: number, value: string) => {
        const newChapters = [...chapters];
        newChapters[index].title = value;
        setChapters(newChapters as any);
    };

    const handleAddTopic = (chapterIndex: number) => {
        const newChapters = [...chapters];
        newChapters[chapterIndex].topics.push({ title: '', slug: '', is_free: false, video_url: '', content: '', isGeneratingTask: false, isGeneratingQuiz: false });
        setChapters(newChapters as any);
    };

    const handleRemoveTopic = (chapterIndex: number, topicIndex: number) => {
        const newChapters = [...chapters];
        newChapters[chapterIndex].topics = newChapters[chapterIndex].topics.filter((_, i) => i !== topicIndex);
        setChapters(newChapters as any);
    };

    const handleTopicChange = (chapterIndex: number, topicIndex: number, field: keyof TopicState, value: string | boolean | number | undefined) => {
        const newChapters = [...chapters];
        const topic = newChapters[chapterIndex].topics[topicIndex] as any;
        topic[field] = value;
        
        if(field === 'title' && typeof value === 'string') {
             topic.slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        }

        setChapters(newChapters as any);
    };
    
    const handleVideoFileChange = async (chapterIndex: number, topicIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const topic = chapters[chapterIndex].topics[topicIndex];
        const filePath = `course-videos/${courseId}/${topic.slug}-${file.name}`;

        handleTopicChange(chapterIndex, topicIndex, 'uploadProgress', 0);

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
            handleTopicChange(chapterIndex, topicIndex, 'uploadProgress', undefined);
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('course_videos')
            .getPublicUrl(filePath);

        setChapters(prevChapters => {
            const newChapters = [...prevChapters];
            const updatedTopic = newChapters[chapterIndex].topics[topicIndex];
            updatedTopic.video_url = publicUrl;
            updatedTopic.uploadProgress = 100;
            return newChapters;
        });

        toast({
            title: 'Upload Complete!',
            description: 'The video has been successfully uploaded and linked.',
        });
        
        // Hide progress bar after a delay
        setTimeout(() => {
            setChapters(prevChapters => {
                const newChapters = [...prevChapters];
                if (newChapters[chapterIndex]?.topics[topicIndex]) {
                    newChapters[chapterIndex].topics[topicIndex].uploadProgress = undefined;
                }
                return newChapters;
            });
        }, 2000);
    };


     const handleCourseNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setCourseName(name);
        setCourseSlug(name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }

    const handleGenerateDescription = async () => {
        if (!courseName) {
            toast({
                variant: 'destructive',
                title: 'Course Name is required',
                description: 'Please enter a course name to generate a description.'
            });
            return;
        }
        setIsGenerating(true);
        try {
            const result = await generateCourseDescription({ courseTitle: courseName });
            setCourseDescription(result.description);
        } catch (error) {
            console.error('AI description generation failed:', error);
            toast({
                variant: 'destructive',
                title: 'AI Failed',
                description: 'Could not generate a description. Please try again.'
            });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setImagePreview(result);
                setCourseImageUrl(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateCodeTask = async (chapterIndex: number, topicIndex: number) => {
        const topic = chapters[chapterIndex].topics[topicIndex];
        if (!topic.title || !courseName) {
            toast({
                variant: 'destructive',
                title: 'Topic and Course Name are required',
                description: 'Please provide a topic title and a course name to generate a code task.',
            });
            return;
        }

        handleTopicChange(chapterIndex, topicIndex, 'isGeneratingTask', true);

        try {
            const language = courseName.split(' ')[0]; // Simple logic to get language from course name
            const result = await generateCodeTask({ topicTitle: topic.title, programmingLanguage: language });
            handleTopicChange(chapterIndex, topicIndex, 'content', result.task);
            toast({
                title: 'AI Code Task Generated!',
                description: `A new code task for "${topic.title}" has been created.`,
            });
        } catch (error) {
            console.error('AI code task generation failed:', error);
            toast({
                variant: 'destructive',
                title: 'AI Failed',
                description: 'Could not generate a code task. Please try again.',
            });
        } finally {
            handleTopicChange(chapterIndex, topicIndex, 'isGeneratingTask', false);
        }
    };

    const handleGenerateQuiz = async (chapterIndex: number, topicIndex: number) => {
        const topic = chapters[chapterIndex].topics[topicIndex];
        if (!topic.video_url || !topic.video_url.includes('youtube.com')) {
            toast({
                variant: 'destructive',
                title: 'YouTube Video URL is required',
                description: 'Please provide a valid YouTube video URL to generate a quiz.',
            });
            return;
        }

        handleTopicChange(chapterIndex, topicIndex, 'isGeneratingQuiz', true);

        try {
            const result = await generateQuizFromTranscript({ videoUrl: topic.video_url });
            console.log('Generated Quiz:', result);
            toast({
                title: 'AI Quiz Generated!',
                description: `A new quiz for "${topic.title}" has been created. Check the console for the output.`,
            });
        } catch (error: any) {
            console.error('AI quiz generation failed:', error);
            toast({
                variant: 'destructive',
                title: 'AI Quiz Generation Failed',
                description: error.message || 'Could not generate a quiz. Please try again.',
            });
        } finally {
            handleTopicChange(chapterIndex, topicIndex, 'isGeneratingQuiz', false);
        }
    };
    
    const handleAiAction = (action: string) => {
        toast({
            title: `🤖 ${action} Initiated`,
            description: `The AI is starting to work. This feature is coming soon!`,
        });
    }

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
                id: chapter.id,
                title: chapter.title,
                order: chapterIndex + 1,
                topics: chapter.topics.map((topic, topicIndex) => ({
                    id: topic.id,
                    title: topic.title,
                    slug: topic.slug,
                    is_free: topic.is_free,
                    video_url: topic.video_url,
                    content: topic.content,
                    order: topicIndex + 1,
                }))
            }))
        };
        
        try {
            const result = await updateCourse(courseId, courseData);
            if (result.success) {
                toast({
                    title: "Course Updated!",
                    description: `${courseName} has been successfully saved.`,
                });
                router.push('/admin/courses');
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
                                        <div className="flex justify-between items-center">
                                            <Label htmlFor="course-description">Description</Label>
                                            <Button type="button" variant="outline" size="sm" onClick={handleGenerateDescription} disabled={isGenerating}>
                                                <Sparkles className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                                                {isGenerating ? 'Generating...' : 'Generate with AI'}
                                            </Button>
                                        </div>
                                        <Textarea id="course-description" value={courseDescription} onChange={e => setCourseDescription(e.target.value)} placeholder="A brief summary of the course." className="min-h-[100px]"/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Course Image</Label>
                                        <Card className="border-dashed">
                                            <CardContent className="p-4">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    {imagePreview ? (
                                                        <Image src={imagePreview} alt="Image preview" width={400} height={200} className="rounded-md max-h-40 w-auto object-contain"/>
                                                    ) : (
                                                        <ImageIcon className="w-12 h-12 text-muted-foreground" />
                                                    )}
                                                    <Input id="image-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*"/>
                                                    <Label htmlFor="image-upload" className="cursor-pointer text-primary text-sm underline">
                                                        {imagePreview ? 'Change image' : 'Upload an image'}
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
                                <Card key={chapter.id || `new-chapter-${chapterIndex}`} className="bg-muted/30">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div className="space-y-1.5 flex-grow mr-4">
                                            <CardTitle className="flex items-center gap-2"><Book className="text-primary"/> Chapter {chapterIndex + 1}</CardTitle>
                                            <Input placeholder="Chapter Title, e.g., 'Getting Started'" value={chapter.title} onChange={e => handleChapterChange(chapterIndex, e.target.value)} required className="text-lg font-semibold p-0 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"/>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveChapter(chapterIndex)}>
                                            <X className="text-destructive"/>
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pl-10">
                                        {chapter.topics.map((topic, topicIndex) => (
                                              <div key={topic.id || `new-topic-${topicIndex}`} className="p-4 rounded-lg bg-background border flex flex-col gap-4 relative">
                                                <div className="flex items-start gap-4">
                                                    <FileText className="mt-2.5 text-accent-foreground/50"/>
                                                    <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`topic-title-${chapterIndex}-${topicIndex}`}>Topic Title</Label>
                                                            <Input id={`topic-title-${chapterIndex}-${topicIndex}`} value={topic.title} onChange={e => handleTopicChange(chapterIndex, topicIndex, 'title', e.target.value)} placeholder="e.g., 'Variables'" required />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`topic-slug-${chapterIndex}-${topicIndex}`}>Topic Slug</Label>
                                                            <Input id={`topic-slug-${chapterIndex}-${topicIndex}`} value={topic.slug} onChange={e => handleTopicChange(chapterIndex, topicIndex, 'slug', e.target.value)} placeholder="e.g., 'variables'" required />
                                                        </div>
                                                         <div className="space-y-2 sm:col-span-2">
                                                            <Label htmlFor={`topic-video-${chapterIndex}-${topicIndex}`}>Topic Video</Label>
                                                            <div className="flex items-center gap-2">
                                                                <Input 
                                                                    id={`topic-video-${chapterIndex}-${topicIndex}`} 
                                                                    value={topic.video_url} 
                                                                    onChange={e => handleTopicChange(chapterIndex, topicIndex, 'video_url', e.target.value)} 
                                                                    placeholder="Paste video link (e.g., YouTube) or upload"
                                                                    className="flex-grow"
                                                                />
                                                                <Button type="button" variant="outline" size="icon" asChild>
                                                                    <Label htmlFor={`video-upload-${chapterIndex}-${topicIndex}`} className="cursor-pointer">
                                                                        <Upload className="h-4 w-4" />
                                                                        <span className="sr-only">Upload Video</span>
                                                                    </Label>
                                                                </Button>
                                                                <Input id={`video-upload-${chapterIndex}-${topicIndex}`} type="file" className="sr-only" accept="video/*" onChange={(e) => handleVideoFileChange(chapterIndex, topicIndex, e)} />
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
                                                              id={`is-free-${chapterIndex}-${topicIndex}`}
                                                              checked={topic.is_free}
                                                              onCheckedChange={checked => handleTopicChange(chapterIndex, topicIndex, 'is_free', checked)}
                                                            />
                                                            <Label htmlFor={`is-free-${chapterIndex}-${topicIndex}`} className="text-sm font-medium">This topic is a free preview</Label>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="border-t border-dashed -mx-4 mt-2"></div>
                                                 <div className="pt-2 px-4 flex flex-col gap-2">
                                                    <Label className="text-sm font-medium">Topic Content (AI Task)</Label>
                                                     <Textarea 
                                                        value={topic.content || ''}
                                                        onChange={e => handleTopicChange(chapterIndex, topicIndex, 'content', e.target.value)}
                                                        placeholder="AI-Generated code task will appear here."
                                                        className="mt-2 min-h-[120px] font-mono"
                                                        rows={6}
                                                    />
                                                </div>
                                                <div className="pt-2 px-4 flex items-center justify-between">
                                                    <Label className="text-sm font-medium">AI Tools</Label>
                                                    <div className="flex gap-2">
                                                        <Button type="button" variant="outline" size="sm" onClick={() => handleAiAction("Video Analysis")}><Video className="mr-2 h-4 w-4" /> Analyze Video</Button>
                                                        <Button type="button" variant="outline" size="sm" onClick={() => handleGenerateQuiz(chapterIndex, topicIndex)} disabled={topic.isGeneratingQuiz}>
                                                            <Bot className={`mr-2 h-4 w-4 ${topic.isGeneratingQuiz ? 'animate-spin' : ''}`} />
                                                            {topic.isGeneratingQuiz ? 'Generating...' : 'Generate Quiz'}
                                                        </Button>
                                                        <Button type="button" variant="outline" size="sm" onClick={() => handleGenerateCodeTask(chapterIndex, topicIndex)} disabled={topic.isGeneratingTask}>
                                                            <Bot className={`mr-2 h-4 w-4 ${topic.isGeneratingTask ? 'animate-spin' : ''}`} />
                                                             {topic.isGeneratingTask ? 'Generating...' : 'Generate Code Task'}
                                                        </Button>
                                                    </div>
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1" onClick={() => handleRemoveTopic(chapterIndex, topicIndex)}>
                                                    <X className="w-4 h-4 text-muted-foreground"/>
                                                </Button>
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" onClick={() => handleAddTopic(chapterIndex)}>
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
