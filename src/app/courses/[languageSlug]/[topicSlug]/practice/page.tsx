
'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { getCourseAndTopicDetails } from '@/lib/supabase/queries';
import { CourseWithChaptersAndTopics, TopicWithContent } from '@/lib/types';
import Link from 'next/link';
import { ArrowLeft, Bot, Lightbulb, Loader2, Play, Sparkles } from 'lucide-react';
import { reviewCodeAndProvideFeedback } from '@/ai/flows/review-code-and-provide-feedback';
import { provideHintForCodePractice } from '@/ai/flows/provide-hint-for-code-practice';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

// A mock code editor component
function CodeEditor({ value, onChange }: { value: string, onChange: (value: string) => void }) {
    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full p-4 bg-gray-900 text-white font-mono rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Write your code here..."
        />
    )
}

function MarkdownRenderer({ content }: { content: string }) {
    // This is a very basic renderer. A real app would use a library like 'react-markdown'.
    const renderContent = () => {
        return content
            .replace(/### (.*)/g, '<h3 class="text-xl font-semibold mt-4 mb-2">$1</h3>')
            .replace(/```(\w+)\n([\s\S]*?)```/g, '<pre class="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto"><code class="language-$1">$2</code></pre>')
            .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded-md text-sm font-mono">$1</code>')
    };

    return <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderContent() }} />;
}

export default function CodePracticePage() {
    const params = useParams();
    const [topic, setTopic] = useState<TopicWithContent | null>(null);
    const [course, setCourse] = useState<CourseWithChaptersAndTopics | null>(null);
    const [loading, setLoading] = useState(true);

    const [userCode, setUserCode] = useState('');
    const [feedback, setFeedback] = useState('');
    const [hint, setHint] = useState('');
    const [isReviewing, setIsReviewing] = useState(false);
    const [isGettingHint, setIsGettingHint] = useState(false);
    const [showSolution, setShowSolution] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            const { course, topic } = await getCourseAndTopicDetails(params.languageSlug as string, params.topicSlug as string);
            if (course && topic) {
                setCourse(course);
                setTopic(topic);
                 // Extract starter code from the content
                const starterCodeMatch = topic.content?.match(/```(?:\w+)\n([\s\S]*?)```/);
                if (starterCodeMatch && starterCodeMatch[1]) {
                    // This logic is simple and assumes the first code block is the starter code
                    const allCodeBlocks = topic.content?.match(/```(?:\w+)\n([\s\S]*?)```/g) || [];
                    const starterCodeBlock = allCodeBlocks[0] || '';
                    const starterCode = starterCodeBlock.replace(/```\w+\n|```/g, '');
                    setUserCode(starterCode);
                }

            }
            setLoading(false);
        };
        fetchDetails();
    }, [params]);

    const handleReviewCode = async () => {
        if (!topic || !course) return;
        setIsReviewing(true);
        setFeedback('');
        try {
            const result = await reviewCodeAndProvideFeedback({
                code: userCode,
                programmingLanguage: course.language || 'code',
            });
            setFeedback(result.feedback);
        } catch (e: any) {
            setFeedback(`Error getting feedback: ${e.message}`);
        } finally {
            setIsReviewing(false);
        }
    };
    
    const handleGetHint = async () => {
        if (!topic) return;
        setIsGettingHint(true);
        setHint('');
         try {
            const result = await provideHintForCodePractice({
                problemStatement: topic.content || '',
                userCode: userCode,
            });
            setHint(result.hint);
        } catch (e: any) {
            setHint(`Error getting hint: ${e.message}`);
        } finally {
            setIsGettingHint(false);
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading Code Practice...</div>;
    }

    if (!topic || !topic.content || !course) {
        notFound();
    }

    return (
         <div className="flex flex-col h-screen bg-background">
            <Header />
            <main className="flex-grow pt-16 flex flex-col">
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                    <Button variant="ghost" asChild>
                        <Link href={`/courses/${course.slug}/${topic.slug}`}>
                            <ArrowLeft className="mr-2" /> Back to Lesson
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold text-center truncate">{topic.title}: Code Challenge</h1>
                    <div className="w-[150px]"></div>
                </div>

                <ResizablePanelGroup direction="horizontal" className="flex-grow">
                    <ResizablePanel defaultSize={50}>
                        <ScrollArea className="h-full p-6">
                            <h2 className="text-2xl font-bold mb-4">Problem Statement</h2>
                            <MarkdownRenderer content={topic.content} />
                        </ScrollArea>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={50}>
                         <ResizablePanelGroup direction="vertical">
                            <ResizablePanel defaultSize={60} minSize={30}>
                                 <div className="flex flex-col h-full">
                                    <div className="p-4 border-b border-border/50 flex justify-between items-center">
                                        <h2 className="text-lg font-semibold">Your Code</h2>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={handleGetHint} disabled={isGettingHint}>
                                                {isGettingHint ? <Loader2 className="mr-2 animate-spin" /> : <Lightbulb className="mr-2"/>} Hint
                                            </Button>
                                            <Button size="sm" onClick={handleReviewCode} disabled={isReviewing}>
                                                {isReviewing ? <Loader2 className="mr-2 animate-spin" /> : <Play className="mr-2"/>} Review Code
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex-grow">
                                        <CodeEditor value={userCode} onChange={setUserCode} />
                                    </div>
                                </div>
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={40} minSize={20}>
                                <ScrollArea className="h-full p-6">
                                     <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-semibold flex items-center gap-2"><Bot /> AI Feedback</h2>
                                        <Button size="sm" variant="secondary" onClick={() => setShowSolution(!showSolution)}>
                                            {showSolution ? 'Hide' : 'Show'} Solution
                                        </Button>
                                    </div>
                                    {isReviewing && <p className="text-muted-foreground">Analyzing your code...</p>}
                                    {feedback && <div className="p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-line font-mono">{feedback}</div>}
                                     {hint && !feedback && (
                                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">
                                            <p className="font-semibold mb-2">Hint:</p>
                                            <p>{hint}</p>
                                        </div>
                                     )}
                                     {showSolution && (
                                        <div className="mt-4">
                                            <h3 className="font-semibold mb-2">Solution Explanation</h3>
                                            <p className="text-sm text-muted-foreground mb-4">{topic.explanation || 'No explanation provided.'}</p>
                                            <MarkdownRenderer content={topic.content.split('### Solution')[1] || ''} />
                                        </div>
                                     )}
                                     {!isReviewing && !feedback && !hint && !showSolution && <p className="text-muted-foreground text-sm text-center pt-8">Submit your code to get AI-powered feedback.</p>}
                                </ScrollArea>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </main>
        </div>
    );
}
