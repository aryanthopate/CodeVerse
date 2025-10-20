

'use client';

import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createCourse } from '@/lib/supabase/actions';
import { X, Plus, Book, FileText, Sparkles, Image as ImageIcon, Video, Bot, Upload, IndianRupee } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { generateCourseDescription } from '@/ai/flows/generate-course-description';
import { generateCodeTask } from '@/ai/flows/generate-code-task';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';

interface TopicState {
    id: string; // Use a temporary client-side ID
    title: string;
    slug: string;
    is_free: boolean;
    video_url: string;
    content?: string;
    summary?: string;
    uploadProgress?: number;
    isGeneratingTask?: boolean;
    isAnalyzingVideo?: boolean;
}

interface ChapterState {
    id: string; // Use a temporary client-side ID
    title: string;
    topics: TopicState[];
}

export default function NewCoursePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const [courseName, setCourseName] = useState('');
    const [courseSlug, setCourseSlug] = useState('');
    const [courseDescription, setCourseDescription] = useState('');
    const [courseImageUrl, setCourseImageUrl] = useState('');
    const [imagePreview, setImagePreview] = useState('');
    const [isPaid, setIsPaid] = useState(false);
    const [price, setPrice] = useState<number | string>(0);


    const [chapters, setChapters] = useState<ChapterState[]>([
        { id: `ch-${Date.now()}`, title: '', topics: [{ id: `t-${Date.now()}`, title: '', slug: '', is_free: false, video_url: '', content: '', summary: '', uploadProgress: undefined, isGeneratingTask: false, isAnalyzingVideo: false }] }
    ]);

    const handleAddChapter = () => {
        setChapters([...chapters, { id: `ch-${Date.now()}`, title: '', topics: [{ id: `t-${Date.now()}`, title: '', slug: '', is_free: false, video_url: '', content: '', summary: '', isGeneratingTask: false, isAnalyzingVideo: false }] }]);
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
                return { ...c, topics: [...c.topics, { id: `t-${Date.now()}`, title: '', slug: '', is_free: false, video_url: '', content: '', summary: '', isGeneratingTask: false, isAnalyzingVideo: false }] };
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

    const handleTopicChange = (chapterId: string, topicId: string, field: keyof TopicState, value: any) => {
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
    };
    
    const handleVideoFileChange = async (chapterId: string, topicId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        toast({
            variant: 'destructive',
            title: 'Create the course first',
            description: 'Please save the course before uploading videos. You can edit the course to add videos later.',
        });
        
        e.target.value = ''; // Reset file input
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

    const handleGenerateCodeTask = async (chapterId: string, topicId: string) => {
        const chapter = chapters.find(c => c.id === chapterId);
        const topic = chapter?.topics.find(t => t.id === topicId);

        if (!topic?.title || !courseName) {
            toast({
                variant: 'destructive',
                title: 'Topic and Course Name are required',
                description: 'Please provide a topic title and a course name to generate a code task.',
            });
            return;
        }

        handleTopicChange(chapterId, topicId, 'isGeneratingTask', true);

        try {
            const language = courseName.split(' ')[0]; // Simple logic to get language from course name
            const result = await generateCodeTask({ topicTitle: topic.title, programmingLanguage: language });
            handleTopicChange(chapterId, topicId, 'content', result.task);
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
            handleTopicChange(chapterId, topicId, 'isGeneratingTask', false);
        }
    };

    const handleAnalyzeVideo = async () => {
        toast({
            variant: 'destructive',
            title: 'Create the course first',
            description: 'AI analysis can only be performed on saved topics. Please save the course, then edit it to analyze videos.',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const courseData = {
            name: courseName,
            slug: courseSlug,
            description: courseDescription,
            image_url: courseImageUrl || `https://picsum.photos/seed/${courseSlug}/600/400`,
            is_paid: isPaid,
            price: Number(price),
            chapters: chapters.map((chapter, chapterIndex) => ({
                // Don't send client-side temporary id
                title: chapter.title,
                order: chapterIndex + 1,
                topics: chapter.topics.map((topic, topicIndex) => ({
                    // Don't send client-side temporary id
                    title: topic.title,
                    slug: topic.slug,
                    is_free: topic.is_free,
                    video_url: topic.video_url,
                    content: topic.content,
                    summary: topic.summary,
                    order: topicIndex + 1,
                }))
            }))
        };
        
        try {
            const result = await createCourse(courseData);
            if (result.success) {
                toast({
                    title: "Course Created!",
                    description: `${courseName} has been successfully added. You can now edit the course to upload videos and generate quizzes.`,
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


    return (
        <AdminLayout>
             <div className="space-y-8">
                <div>
                    <h1 className="text-4xl font-bold">Create a New Course</h1>
                    <p className="text-lg text-muted-foreground mt-1">Fill out the details below to add a new course to the platform.</p>
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
                                {loading ? 'Saving Course...' : 'Save and Publish Course'}
                            </Button>
                        </div>

                        {/* Chapters and Topics Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {chapters.map((chapter, chapterIndex) => (
                                <Card key={chapter.id} className="bg-muted/30">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div className="space-y-1.5 flex-grow mr-4">
                                            <CardTitle className="flex items-center gap-2"><Book className="text-primary"/> Chapter {chapterIndex + 1}</CardTitle>
                                            <Input placeholder="Chapter Title, e.g., 'Getting Started'" value={chapter.title} onChange={e => handleChapterChange(chapter.id, e.target.value)} required className="text-lg font-semibold p-0 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"/>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveChapter(chapter.id)} disabled={chapters.length === 1}>
                                            <X className="text-destructive"/>
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pl-10">
                                        {chapter.topics.map((topic, topicIndex) => (
                                            <div key={topic.id} className="p-4 rounded-lg bg-background border flex flex-col gap-4 relative">
                                                <div className="flex items-start gap-4">
                                                    <FileText className="mt-2.5 text-accent-foreground/50"/>
                                                    <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`topic-title-${chapter.id}-${topic.id}`}>Topic Title</Label>
                                                            <Input id={`topic-title-${chapter.id}-${topic.id}`} value={topic.title} onChange={e => handleTopicChange(chapter.id, topic.id, 'title', e.target.value)} placeholder="e.g., 'Variables'" required />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`topic-slug-${chapter.id}-${topic.id}`}>Topic Slug</Label>
                                                            <Input id={`topic-slug-${chapter.id}-${topic.id}`} value={topic.slug} onChange={e => handleTopicChange(chapter.id, topic.id, 'slug', e.target.value)} placeholder="e.g., 'variables'" required />
                                                        </div>
                                                         <div className="space-y-2 sm:col-span-2">
                                                            <Label htmlFor={`topic-video-${chapter.id}-${topic.id}`}>Topic Video</Label>
                                                            <div className="flex items-center gap-2">
                                                                <Input 
                                                                    id={`topic-video-${chapter.id}-${topic.id}`} 
                                                                    value={topic.video_url} 
                                                                    onChange={e => handleTopicChange(chapter.id, topic.id, 'video_url', e.target.value)} 
                                                                    placeholder="Paste video link (e.g., YouTube) or upload"
                                                                    className="flex-grow"
                                                                />
                                                                <Button type="button" variant="outline" size="icon" asChild>
                                                                    <Label htmlFor={`video-upload-${chapter.id}-${topic.id}`} className="cursor-pointer">
                                                                        <Upload className="h-4 w-4" />
                                                                        <span className="sr-only">Upload Video</span>
                                                                    </Label>
                                                                </Button>
                                                                <Input id={`video-upload-${chapter.id}-${topic.id}`} type="file" className="sr-only" accept="video/*" onChange={(e) => handleVideoFileChange(chapter.id, topic.id, e)} />
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
                                                              onCheckedChange={checked => handleTopicChange(chapter.id, topic.id, 'is_free', checked)}
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
                                                        onChange={e => handleTopicChange(chapter.id, topic.id, 'summary', e.target.value)}
                                                        placeholder="AI-Generated video summary will appear here."
                                                        className="mt-2 min-h-[120px]"
                                                        rows={4}
                                                    />
                                                </div>

                                                <div className="border-t border-dashed -mx-4 mt-2"></div>

                                                <div className="pt-2 px-4 flex flex-col gap-2">
                                                    <Label className="text-sm font-medium">Coding Challenge</Label>
                                                     <Textarea 
                                                        value={topic.content || ''}
                                                        onChange={e => handleTopicChange(chapter.id, topic.id, 'content', e.target.value)}
                                                        placeholder="AI-Generated code task will appear here."
                                                        className="mt-2 min-h-[120px] font-mono"
                                                        rows={6}
                                                    />
                                                </div>
                                                <div className="pt-2 px-4 flex items-center justify-end">
                                                    <div className="flex gap-2">
                                                        <Button type="button" variant="outline" size="sm" onClick={handleAnalyzeVideo} disabled={topic.isAnalyzingVideo}>
                                                            <Video className={`mr-2 h-4 w-4 ${topic.isAnalyzingVideo ? 'animate-spin' : ''}`} />
                                                            {topic.isAnalyzingVideo ? 'Analyzing...' : 'Analyze Video & Gen Quiz'}
                                                        </Button>
                                                        <Button type="button" variant="outline" size="sm" onClick={() => handleGenerateCodeTask(chapter.id, topic.id)} disabled={topic.isGeneratingTask}>
                                                            <Bot className={`mr-2 h-4 w-4 ${topic.isGeneratingTask ? 'animate-spin' : ''}`} />
                                                             {topic.isGeneratingTask ? 'Generating...' : 'Generate Code Task'}
                                                        </Button>
                                                    </div>
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1" onClick={() => handleRemoveTopic(chapter.id, topic.id)} disabled={chapter.topics.length === 1}>
                                                    <X className="w-4 h-4 text-muted-foreground"/>
                                                </Button>
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" onClick={() => handleAddTopic(chapter.id)}>
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
