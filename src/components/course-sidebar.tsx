'use client';

import { useState, useEffect } from 'react';
import { getCoursesWithChaptersAndTopics } from '@/lib/supabase/queries';
import type { CourseWithChaptersAndTopics } from '@/lib/types';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle, Lock, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

export function CourseSidebar({ activeCourseSlug, activeTopicSlug }: { activeCourseSlug: string, activeTopicSlug: string }) {
    const [course, setCourse] = useState<CourseWithChaptersAndTopics | null>(null);
    const [loading, setLoading] = useState(true);
    const [openChapters, setOpenChapters] = useState<string[]>([]);

    useEffect(() => {
        const fetchCourse = async () => {
            setLoading(true);
            // In a real app, you might fetch only the specific course needed.
            // For simplicity here, we fetch all and find the one we need.
            const allCourses = await getCoursesWithChaptersAndTopics();
            const currentCourse = allCourses?.find(c => c.slug === activeCourseSlug);
            
            if (currentCourse) {
                setCourse(currentCourse);
                // Find and open the chapter containing the active topic
                const activeChapter = currentCourse.chapters.find(c => c.topics.some(t => t.slug === activeTopicSlug));
                if (activeChapter) {
                    setOpenChapters([activeChapter.id]);
                }
            }
            setLoading(false);
        };

        fetchCourse();
    }, [activeCourseSlug, activeTopicSlug]);

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        );
    }

    if (!course) {
        return <div>Course not found.</div>;
    }

    return (
        <div className="h-full">
            <h2 className="text-xl font-bold mb-4">{course.name}</h2>
            <Accordion type="multiple" value={openChapters} onValueChange={setOpenChapters} className="w-full">
                {course.chapters.map((chapter) => (
                    <AccordionItem key={chapter.id} value={chapter.id}>
                        <AccordionTrigger className="text-base font-semibold hover:no-underline">
                           <div className="flex-1 text-left">{chapter.title}</div>
                        </AccordionTrigger>
                        <AccordionContent>
                             <ul className="space-y-1">
                                {chapter.topics.map(topic => {
                                    const isActive = topic.slug === activeTopicSlug;
                                    return (
                                        <li key={topic.id}>
                                            <Link href={`/courses/${course.slug}/${topic.slug}`} className={cn(
                                                "flex items-center p-2 rounded-md transition-colors w-full text-left",
                                                isActive ? "bg-primary/20 text-primary-foreground" : "hover:bg-muted/50",
                                            )}>
                                                <div className="mr-3 text-muted-foreground">
                                                     {topic.is_free ? <PlayCircle className="w-5 h-5 text-primary" /> : <Lock className="w-5 h-5" />}
                                                </div>
                                                <span className="flex-grow text-sm">{topic.title}</span>
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}
