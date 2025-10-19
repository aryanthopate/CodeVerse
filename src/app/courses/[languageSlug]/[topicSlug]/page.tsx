import { AppLayout } from '@/components/app-layout';
import { mockCourses } from '@/lib/mock-data';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Bot, ChevronRight, Code, Book, Edit, Mic, Clock } from 'lucide-react';
import Link from 'next/link';

export default function TopicPage({ params }: { params: { languageSlug: string, topicSlug: string } }) {
    const course = mockCourses.find(c => c.slug === params.languageSlug);
    const topic = course?.chapters.flatMap(ch => ch.topics).find(t => t.slug === params.topicSlug);

    if (!course || !topic) {
        notFound();
    }
    
    const chapter = course.chapters.find(ch => ch.topics.some(t => t.id === topic.id));

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Link href={`/courses/${course.slug}`} className="hover:text-primary">{course.name}</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span>{chapter?.title}</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-foreground">{topic.title}</span>
                </div>
                
                <h1 className="text-4xl font-bold mb-6">{topic.title}</h1>
                
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Video Player */}
                        <div className="aspect-video w-full bg-card rounded-xl flex items-center justify-center relative overflow-hidden border border-border/50">
                            <video className="w-full h-full" controls poster={`https://picsum.photos/seed/${topic.slug}/1280/720`}>
                                {/* In a real app, use a video source */}
                                {/* <source src={topic.videoUrl} type="video/mp4" /> */}
                            </video>
                            <div className="absolute top-4 right-4 flex flex-col gap-2">
                                <Button variant="outline" size="icon" className="bg-background/50 backdrop-blur-sm"><Code/></Button>
                            </div>
                        </div>

                         {/* Player Actions */}
                        <div className="flex flex-wrap gap-4">
                            <Button variant="outline"><Clock className="mr-2" /> Add Bookmark</Button>
                            <Button variant="outline"><Edit className="mr-2" /> Take Note</Button>
                            <Button variant="outline"><Mic className="mr-2" /> Record Audio Note</Button>
                            <Button variant="destructive" className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300">
                                <Bot className="mr-2"/> Didn't get it?
                            </Button>
                        </div>
                    </div>
                    
                    {/* Notes & Transcript Panel */}
                    <div className="lg:col-span-1">
                        <Tabs defaultValue="notes" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="notes"><Edit className="mr-2 w-4 h-4"/> Notes</TabsTrigger>
                                <TabsTrigger value="transcript"><Book className="mr-2 w-4 h-4"/> Transcript</TabsTrigger>
                            </TabsList>
                            <TabsContent value="notes" className="mt-4 p-4 bg-card/50 rounded-xl border border-border/50">
                                <div className="space-y-4">
                                    <h3 className="font-semibold">My Notes</h3>
                                    <Textarea placeholder="Add a timestamped note..."/>
                                    <Button className="w-full">Save Note</Button>
                                    <div className="text-sm text-center text-muted-foreground">Your notes will be saved here.</div>
                                </div>
                            </TabsContent>
                            <TabsContent value="transcript" className="mt-4 p-4 bg-card/50 rounded-xl border border-border/50 h-96 overflow-y-auto">
                                <h3 className="font-semibold mb-2">Transcript</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-line">
                                    [00:01] Welcome to the lesson on variables.
                                    {'\n'}[00:05] A variable is like a container to store data values.
                                    {'\n'}[00:12] In Java, there are different types of variables, for example...
                                    {'\n'}[00:20] `String` for text, `int` for integers, and so on.
                                </p>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                <div className="flex justify-between mt-8 p-4 bg-card/50 rounded-xl border border-border/50">
                    <Button variant="outline">Previous Topic</Button>
                    <div className="flex gap-4">
                        <Button variant="secondary" className="bg-accent/80 hover:bg-accent">Take Quiz</Button>
                        <Button>Next Topic</Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
