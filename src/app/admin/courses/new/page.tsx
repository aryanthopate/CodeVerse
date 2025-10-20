
'use client';

import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createCourse } from '@/lib/supabase/actions';
import { X, Plus, Book, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Interfaces for our form state
interface TopicState {
    title: string;
    slug: string;
    is_free: boolean;
}

interface ChapterState {
    title: string;
    topics: TopicState[];
}

export default function NewCoursePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Form state
    const [courseName, setCourseName] = useState('');
    const [courseSlug, setCourseSlug] = useState('');
    const [courseDescription, setCourseDescription] = useState('');
    const [courseImageUrl, setCourseImageUrl] = useState('');
    const [chapters, setChapters] = useState<ChapterState[]>([
        { title: '', topics: [{ title: '', slug: '', is_free: false }] }
    ]);

    const handleAddChapter = () => {
        setChapters([...chapters, { title: '', topics: [{ title: '', slug: '', is_free: false }] }]);
    };

    const handleRemoveChapter = (index: number) => {
        const newChapters = chapters.filter((_, i) => i !== index);
        setChapters(newChapters);
    };

    const handleChapterChange = (index: number, value: string) => {
        const newChapters = [...chapters];
        newChapters[index].title = value;
        setChapters(newChapters);
    };

    const handleAddTopic = (chapterIndex: number) => {
        const newChapters = [...chapters];
        newChapters[chapterIndex].topics.push({ title: '', slug: '', is_free: false });
        setChapters(newChapters);
    };

    const handleRemoveTopic = (chapterIndex: number, topicIndex: number) => {
        const newChapters = [...chapters];
        newChapters[chapterIndex].topics = newChapters[chapterIndex].topics.filter((_, i) => i !== topicIndex);
        setChapters(newChapters);
    };

    const handleTopicChange = (chapterIndex: number, topicIndex: number, field: keyof TopicState, value: string | boolean) => {
        const newChapters = [...chapters];
        (newChapters[chapterIndex].topics[topicIndex] as any)[field] = value;
        
        // Auto-generate slug from title
        if(field === 'title' && typeof value === 'string') {
             newChapters[chapterIndex].topics[topicIndex].slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        }

        setChapters(newChapters);
    };

     const handleCourseNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setCourseName(name);
        // Auto-generate slug from course name
        setCourseSlug(name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const courseData = {
            name: courseName,
            slug: courseSlug,
            description: courseDescription,
            image_url: courseImageUrl,
            chapters: chapters.map((chapter, chapterIndex) => ({
                title: chapter.title,
                order: chapterIndex + 1,
                topics: chapter.topics.map((topic, topicIndex) => ({
                    ...topic,
                    order: topicIndex + 1,
                }))
            }))
        };
        
        try {
            const result = await createCourse(courseData);
            if (result.success) {
                toast({
                    title: "Course Created!",
                    description: `${courseName} has been successfully added.`,
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
                                        <Label htmlFor="course-description">Description</Label>
                                        <Textarea id="course-description" value={courseDescription} onChange={e => setCourseDescription(e.target.value)} placeholder="A brief summary of the course." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="course-image-url">Image URL</Label>
                                        <Input id="course-image-url" value={courseImageUrl} onChange={e => setCourseImageUrl(e.target.value)} placeholder="https://picsum.photos/seed/..." />
                                    </div>
                                </CardContent>
                            </Card>
                             <Button type="submit" size="lg" className="w-full" disabled={loading}>
                                {loading ? 'Saving Course...' : 'Save and Publish Course'}
                            </Button>
                        </div>

                        {/* Chapters and Topics Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {chapters.map((chapter, chapterIndex) => (
                                <Card key={chapterIndex} className="bg-muted/30">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div className="space-y-1.5">
                                            <CardTitle className="flex items-center gap-2"><Book className="text-primary"/> Chapter {chapterIndex + 1}</CardTitle>
                                            <Input placeholder="Chapter Title, e.g., 'Getting Started'" value={chapter.title} onChange={e => handleChapterChange(chapterIndex, e.target.value)} required className="text-lg font-semibold p-0 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"/>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveChapter(chapterIndex)} disabled={chapters.length === 1}>
                                            <X className="text-destructive"/>
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pl-10">
                                        {chapter.topics.map((topic, topicIndex) => (
                                            <div key={topicIndex} className="p-4 rounded-lg bg-background border flex items-start gap-4 relative">
                                                <FileText className="mt-2.5 text-accent"/>
                                                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`topic-title-${chapterIndex}-${topicIndex}`}>Topic Title</Label>
                                                        <Input id={`topic-title-${chapterIndex}-${topicIndex}`} value={topic.title} onChange={e => handleTopicChange(chapterIndex, topicIndex, 'title', e.target.value)} placeholder="e.g., 'Variables'" required />
                                                    </div>
                                                     <div className="space-y-2">
                                                        <Label htmlFor={`topic-slug-${chapterIndex}-${topicIndex}`}>Topic Slug</Label>
                                                        <Input id={`topic-slug-${chapterIndex}-${topicIndex}`} value={topic.slug} onChange={e => handleTopicChange(chapterIndex, topicIndex, 'slug', e.target.value)} placeholder="e.g., 'variables'" required />
                                                    </div>
                                                    <div className="flex items-center space-x-2 sm:col-span-2">
                                                        <input type="checkbox" id={`is-free-${chapterIndex}-${topicIndex}`} checked={topic.is_free} onChange={e => handleTopicChange(chapterIndex, topicIndex, 'is_free', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
                                                        <Label htmlFor={`is-free-${chapterIndex}-${topicIndex}`}>This topic is free</Label>
                                                    </div>
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1" onClick={() => handleRemoveTopic(chapterIndex, topicIndex)} disabled={chapter.topics.length === 1}>
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
