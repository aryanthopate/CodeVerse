
'use server';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Bot, ChevronRight, Code, Book, Edit, Mic, Clock, ArrowLeft, ArrowRight, Home, Video, HelpCircle, FileCode2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { getCourseAndTopicDetails } from '@/lib/supabase/queries';
import { CourseWithChaptersAndTopics, Topic } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

function VideoPlayer({ topic }: { topic: { video_url: string | null, slug: string } }) {
    if (!topic.video_url) {
        return (
            <div className="aspect-video w-full bg-card rounded-xl flex items-center justify-center text-muted-foreground border border-border/50">
                <span>Video not available.</span>
            </div>
        );
    }

    const isYoutubeVideo = topic.video_url.includes('youtube.com') || topic.video_url.includes('youtu.be');

    if (isYoutubeVideo) {
        // Extract video ID from URL
        let videoId;
        try {
            const url = new URL(topic.video_url);
            if (url.hostname === 'youtu.be') {
                videoId = url.pathname.slice(1);
            } else {
                videoId = url.searchParams.get('v');
            }
        } catch (error) {
             // Handle cases where the URL might be malformed but contains the ID
            const match = topic.video_url.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
            videoId = match ? match[1] : null;
        }


        if (!videoId) {
            return <div className="aspect-video w-full bg-card rounded-xl flex items-center justify-center text-muted-foreground border border-border/50">Invalid YouTube URL</div>;
        }

        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&modestbranding=1&rel=0`;

        return (
            <div className="aspect-video w-full bg-card rounded-xl flex items-center justify-center relative overflow-hidden border border-border/50">
                 <iframe 
                    className="w-full h-full"
                    src={embedUrl}
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                ></iframe>
            </div>
        );
    }
    
    // For direct video links (e.g., from Supabase Storage)
    return (
        <div className="aspect-video w-full bg-card rounded-xl flex items-center justify-center relative overflow-hidden border border-border/50">
            <video className="w-full h-full" controls poster={`https://picsum.photos/seed/${topic.slug}/1280/720`}>
                <source src={topic.video_url} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        </div>
    );
}

async function CourseSidebar({ activeCourseSlug, activeTopicSlug }: { activeCourseSlug: string, activeTopicSlug: string }) {
    const { course } = await getCourseAndTopicDetails(activeCourseSlug, activeTopicSlug);

    if (!course) return null;

    return (
        <div className="sticky top-24 w-full h-[calc(100vh-7rem)]">
            <div className="p-1 mb-4">
                <Button variant="ghost" asChild className="w-full justify-start">
                    <Link href="/dashboard"><Home className="mr-2" /> Back to Dashboard</Link>
                </Button>
            </div>
            <h2 className="text-lg font-semibold px-4 mb-2 truncate">{course.name}</h2>
            <Accordion type="single" collapsible defaultValue={course.chapters.find(c => c.topics.some(t => t.slug === activeTopicSlug))?.id} className="w-full h-full overflow-y-auto pr-4">
                {course.chapters.map((chapter) => (
                <AccordionItem key={chapter.id} value={chapter.id} className="border-none mb-1">
                    <AccordionTrigger className="p-3 text-base font-semibold hover:no-underline hover:bg-muted/50 rounded-md">
                        <span className="truncate">{chapter.title}</span>
                    </AccordionTrigger>
                    <AccordionContent className="pl-4">
                        <ul className="space-y-1 mt-2 border-l border-border/50">
                            {chapter.topics.map(topic => {
                                const hasQuiz = topic.quizzes && topic.quizzes.length > 0 && topic.quizzes[0].questions.length > 0;
                                const hasPractice = !!topic.content;
                                return (
                                <li key={topic.id} className="ml-4">
                                    <div className={`flex flex-col p-2 rounded-md transition-colors text-sm 
                                        ${topic.slug === activeTopicSlug ? 'bg-primary/20' : ''}
                                    `}>
                                        <Link href={`/courses/${course.slug}/${topic.slug}`} className={`flex items-center w-full p-1 rounded-md ${topic.slug === activeTopicSlug ? 'text-primary-foreground font-semibold' : 'hover:bg-muted/50'}`}>
                                            <Video className="mr-2 w-4 h-4" />
                                            <span className="flex-grow truncate">{topic.title}</span>
                                        </Link>
                                         <div className="pl-6 mt-1 space-y-1">
                                             {hasQuiz && (
                                                <Link href={`/courses/${course.slug}/${topic.slug}/quiz`} className="flex items-center text-xs p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50">
                                                    <HelpCircle className="mr-2 w-3.5 h-3.5" />
                                                    Quiz
                                                </Link>
                                             )}
                                             {hasPractice && (
                                                <Link href={`/courses/${course.slug}/${topic.slug}/practice`} className="flex items-center text-xs p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50">
                                                    <FileCode2 className="mr-2 w-3.5 h-3.5" />
                                                    Code Practice
                                                </Link>
                                             )}
                                        </div>
                                    </div>
                                </li>
                                )
                            })}
                        </ul>
                    </AccordionContent>
                </AccordionItem>
                ))}
          </Accordion>
        </div>
    )
}

function NotesSection() {
    return (
        <div className="space-y-4">
            <h3 className="font-semibold">My Notes</h3>
            <Textarea placeholder="Add a timestamped note... e.g., '03:15 - Explain this concept further'"/>
            <div className="flex gap-2">
                <Button className="w-full">Save Note</Button>
                <Button variant="outline" className="w-full"><Mic className="mr-2" /> Record Voice Note</Button>
            </div>
            <div className="text-sm text-center text-muted-foreground">Your notes will be saved here.</div>
        </div>
    );
}

export default async function TopicPage({ params }: { params: { languageSlug: string, topicSlug: string } }) {
    const { course, chapter, topic, prevTopic, nextTopic } = await getCourseAndTopicDetails(params.languageSlug, params.topicSlug);

    if (!course || !topic || !chapter) {
        notFound();
    }

    const hasQuiz = topic.quizzes && topic.quizzes.length > 0 && topic.quizzes[0].questions.length > 0;
    const hasPractice = !!topic.content;
    
    return (
    <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow pt-16">
            <div className="flex">
                <aside className="hidden lg:block w-80 xl:w-96 p-4 border-r border-border/50">
                   <CourseSidebar activeCourseSlug={params.languageSlug} activeTopicSlug={params.topicSlug} />
                </aside>
                <div className="flex-1 p-4 md:p-6 lg:p-8">
                     <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                            <Link href={`/courses/${course.slug}`} className="hover:text-primary">{course.name}</Link>
                            <ChevronRight className="w-4 h-4" />
                            <span>{chapter?.title}</span>
                            <ChevronRight className="w-4 h-4" />
                            <span className="text-foreground">{topic.title}</span>
                        </div>
                        
                        <h1 className="text-3xl md:text-4xl font-bold mb-6">{topic.title}</h1>
                        
                        <div className="space-y-6">
                            <VideoPlayer topic={topic} />

                            <Tabs defaultValue="summary" className="w-full">
                                <TabsList>
                                    <TabsTrigger value="summary"><Book className="mr-2 w-4 h-4"/> Summary</TabsTrigger>
                                    <TabsTrigger value="notes"><Edit className="mr-2 w-4 h-4"/> My Notes</TabsTrigger>
                                </TabsList>
                                <TabsContent value="summary" className="mt-4 p-4 bg-card/50 rounded-xl border border-border/50 min-h-[200px]">
                                    <h3 className="font-semibold mb-2">Video Summary</h3>
                                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                                        {topic.summary || 'Summary not available.'}
                                    </p>
                                </TabsContent>
                                <TabsContent value="notes" className="mt-4 p-4 bg-card/50 rounded-xl border border-border/50 min-h-[200px]">
                                   <NotesSection />
                                </TabsContent>
                            </Tabs>
                        </div>

                        <div className="flex justify-between mt-8 p-4 bg-card/50 rounded-xl border border-border/50">
                            {prevTopic ? (
                                <Button variant="outline" asChild>
                                    <Link href={`/courses/${course.slug}/${prevTopic.slug}`}>
                                    <ArrowLeft className="mr-2"/> Previous Topic
                                    </Link>
                                </Button>
                            ) : <div></div>}
                        
                            <div className="flex gap-4">
                                {hasQuiz ? (
                                    <Button variant="secondary" className="bg-accent/80 hover:bg-accent" asChild>
                                        <Link href={`/courses/${course.slug}/${topic.slug}/quiz`}>Take Quiz</Link>
                                    </Button>
                                ) : hasPractice ? (
                                     <Button variant="secondary" className="bg-accent/80 hover:bg-accent" asChild>
                                        <Link href={`/courses/${course.slug}/${topic.slug}/practice`}>Start Practice</Link>
                                    </Button>
                                ) : null}

                                {nextTopic ? (
                                    <Button asChild>
                                        <Link href={`/courses/${course.slug}/${nextTopic.slug}`}>
                                            Next Topic <ArrowRight className="ml-2"/>
                                        </Link>
                                    </Button>
                                ): (
                                    <Button asChild>
                                        <Link href={`/courses/${course.slug}`}>
                                            Finish Course <CheckCircle className="ml-2"/>
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
        <Footer />
    </div>
    );
}
