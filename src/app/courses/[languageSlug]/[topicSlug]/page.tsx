

'use server';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowRight, CheckCircle, Lightbulb, FileText, LogIn } from 'lucide-react';
import Link from 'next/link';
import { getCourseAndTopicDetails, getUserNoteForTopic } from '@/lib/supabase/queries';
import { Topic } from '@/lib/types';
import { completeTopicAction, upsertUserNote } from '@/lib/supabase/actions';
import { createClient } from '@/lib/supabase/server';
import { ExplainCodeDialog } from '@/components/explain-code-dialog';
import { CourseSidebar } from '@/components/course-sidebar';
import { VideoPlayer } from '@/components/video-player';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

function AddNoteDialog({ topicId, initialContent, children }: { topicId: string, initialContent: string | null, children: React.ReactNode }) {
    
    const handleSubmit = async (formData: FormData) => {
        'use server'
        const content = formData.get('note_content') as string;
        await upsertUserNote(topicId, content);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <form action={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add a Note</DialogTitle>
                        <DialogDescription>
                            Jot down your thoughts for this topic. Your notes will be saved and you can review them later.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="note-content" className="sr-only">Note Content</Label>
                        <Textarea 
                            id="note-content" 
                            name="note_content" 
                            className="min-h-[200px]" 
                            defaultValue={initialContent || ''}
                            placeholder="Your notes here..."
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                             <Button type="button" variant="secondary">Cancel</Button>
                        </DialogClose>
                        <DialogClose asChild>
                            <Button type="submit">Save Note</Button>
                        </DialogClose>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default async function TopicPage({ params }: { params: { languageSlug: string, topicSlug: string } }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { course, chapter, topic, prevTopic, nextTopic } = await getCourseAndTopicDetails(params.languageSlug, params.topicSlug);

    if (!course || !topic || !chapter) {
        notFound();
    }
    
    const userNote = user ? await getUserNoteForTopic(topic.id) : null;
    const hasQuiz = topic.quizzes && topic.quizzes.length > 0 && topic.quizzes[0].questions && topic.quizzes[0].questions.length > 0;
    const hasPractice = !!topic.content;
    
    // Determine the next logical step
    let nextStepUrl: string;
    let nextStepText: string;

    if (hasQuiz) {
        nextStepUrl = `/courses/${course.slug}/${topic.slug}/quiz`;
        nextStepText = "Start Quiz";
    } else if (hasPractice) {
        nextStepUrl = `/courses/${course.slug}/${topic.slug}/practice`;
        nextStepText = "Start Practice";
    } else if (nextTopic) {
        nextStepUrl = `/courses/${course.slug}/${nextTopic.slug}`;
        nextStepText = "Next Topic";
    } else {
        nextStepUrl = `/courses/${course.slug}`;
        nextStepText = "Finish Course";
    }
    
    const codeSnippetForExplanation = topic.content?.match(/### Solution\s*```(?:\w+)\n([\s\S]*?)```/)?.[1]?.trim() || topic.summary;


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

                            <div className="flex justify-between items-center -mt-2">
                                <div className="flex gap-2">
                                    <ExplainCodeDialog codeSnippet={codeSnippetForExplanation || ''}>
                                        <Button variant="secondary">
                                            <Lightbulb className="mr-2"/> Explain It To Me
                                        </Button>
                                    </ExplainCodeDialog>
                                    {user ? (
                                        <AddNoteDialog topicId={topic.id} initialContent={userNote?.note_content || null}>
                                            <Button variant="outline">
                                                <FileText className="mr-2" /> Add Note
                                            </Button>
                                        </AddNoteDialog>
                                    ) : null}
                                </div>
                            
                                <form action={completeTopicAction}>
                                    <input type="hidden" name="topicId" value={topic.id} />
                                    <input type="hidden" name="courseId" value={course.id} />
                                    <input type="hidden" name="nextUrl" value={nextStepUrl} />
                                    <Button type="submit">
                                        {nextStepText} 
                                        {nextStepText !== "Finish Course" ? <ArrowRight className="ml-2"/> : <CheckCircle className="ml-2"/>}
                                    </Button>
                                </form>
                            </div>

                            <div className="mt-8 p-4 bg-card/50 rounded-xl border border-border/50 min-h-[200px]">
                                <h3 className="font-semibold mb-2">Video Summary</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-line">
                                    {topic.summary || 'Summary not available.'}
                                </p>
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
