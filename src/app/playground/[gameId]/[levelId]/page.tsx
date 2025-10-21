
'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { getGameAndLevelDetails } from '@/lib/supabase/queries';
import { GameWithLevels, GameLevel } from '@/lib/types';
import Link from 'next/link';
import { ArrowLeft, Bot, Lightbulb, Loader2, Play, Sparkles, CheckCircle, ArrowRight } from 'lucide-react';
import { reviewCodeAndProvideFeedback } from '@/ai/flows/review-code-and-provide-feedback';
import { provideHintForCodePractice } from '@/ai/flows/provide-hint-for-code-practice';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';

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

function OutputConsole({ output }: { output: string }) {
     return (
        <div className="w-full h-full p-4 bg-black text-green-400 font-mono rounded-lg border border-gray-700 overflow-y-auto">
            <pre>{`> ${output}`}</pre>
        </div>
    )
}

export default function GameLevelPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    
    const [game, setGame] = useState<GameWithLevels | null>(null);
    const [level, setLevel] = useState<GameLevel | null>(null);
    const [nextLevel, setNextLevel] = useState<GameLevel | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    const [userCode, setUserCode] = useState('');
    const [feedback, setFeedback] = useState('');
    const [hint, setHint] = useState('');
    const [isReviewing, setIsReviewing] = useState(false);
    const [isGettingHint, setIsGettingHint] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [runOutput, setRunOutput] = useState('');

    useEffect(() => {
        const fetchDetails = async () => {
            const { game, level, nextLevel } = await getGameAndLevelDetails(params.gameId as string, params.levelId as string);
            const { data: { user } } = await supabase.auth.getUser();
            
            setUser(user);

            if (game && level) {
                setGame(game);
                setLevel(level);
                setNextLevel(nextLevel);
                setUserCode(level.starter_code || '');
            }
            setLoading(false);
        };
        fetchDetails();
    }, [params, supabase]);
    
    const handleGetHint = async () => {
        if (!level) return;
        setIsGettingHint(true);
        setHint('');
         try {
            const result = await provideHintForCodePractice({
                problemStatement: level.objective,
                userCode: userCode,
            });
            setHint(result.hint);
        } catch (e: any) {
            setHint(`Error getting hint: ${e.message}`);
        } finally {
            setIsGettingHint(false);
        }
    }
    
    const handleRunCode = async () => {
        if (!level) return;
        setIsReviewing(true);
        setFeedback('');
        setHint('');
        setRunOutput('Running code...');

        // This is a mock execution. A real implementation would need a secure sandbox.
        // For demonstration, we check if user code includes the expected output (very simplified).
        const isSolutionCorrect = userCode.trim() === level.expected_output?.trim();

        if (isSolutionCorrect) {
            setIsCorrect(true);
            setRunOutput('Success! Output matches expected result.');
            setFeedback('Great job! Your code is correct.');
            // Here you would add logic to save progress and award XP
        } else {
             try {
                const result = await reviewCodeAndProvideFeedback({
                    code: userCode,
                    programmingLanguage: 'code', // This could be dynamic based on the game
                });
                setFeedback(result.feedback);
                setRunOutput('Execution finished. Check AI feedback for details.');
            } catch (e: any) {
                setFeedback(`Error getting feedback: ${e.message}`);
                setRunOutput('Error during review.');
            }
        }
        
        setIsReviewing(false);
    }


    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading Level...</div>;
    }

    if (!game || !level) {
        notFound();
    }

    return (
         <div className="flex flex-col h-screen bg-background">
            <Header />
            <main className="flex-grow pt-16 flex flex-col">
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                    <Button variant="ghost" asChild>
                        <Link href={`/playground/${game.id}`}>
                            <ArrowLeft className="mr-2" /> Back to Levels
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold text-center truncate">{game.title}: {level.title}</h1>
                     <div className="w-[150px] flex justify-end">
                        <Badge variant="secondary" className="text-yellow-400 border-yellow-400/50">{level.reward_xp} XP</Badge>
                     </div>
                </div>

                <ResizablePanelGroup direction="horizontal" className="flex-grow">
                    <ResizablePanel defaultSize={40} minSize={20}>
                        <ScrollArea className="h-full p-6">
                            <h2 className="text-2xl font-bold mb-4">Objective</h2>
                            <p className="text-muted-foreground">{level.objective}</p>
                        </ScrollArea>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={60}>
                         <ResizablePanelGroup direction="vertical">
                            <ResizablePanel defaultSize={65} minSize={30}>
                                 <div className="flex flex-col h-full">
                                    <div className="p-4 border-b border-border/50 flex justify-between items-center">
                                        <h2 className="text-lg font-semibold">Code Editor</h2>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={handleGetHint} disabled={isGettingHint || isReviewing}>
                                                {isGettingHint ? <Loader2 className="mr-2 animate-spin" /> : <Lightbulb className="mr-2"/>} Get Hint
                                            </Button>
                                            <Button size="sm" onClick={handleRunCode} disabled={isReviewing}>
                                                {isReviewing ? <Loader2 className="mr-2 animate-spin" /> : <Play className="mr-2"/>} Run Code
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex-grow">
                                        <CodeEditor value={userCode} onChange={setUserCode} />
                                    </div>
                                </div>
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={35} minSize={20}>
                                <div className="flex flex-col h-full">
                                    <Tabs defaultValue="feedback" className="flex-grow flex flex-col">
                                        <TabsList className="m-4">
                                            <TabsTrigger value="feedback"><Bot className="mr-2"/>AI Feedback</TabsTrigger>
                                            <TabsTrigger value="output"><Play className="mr-2"/>Output</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="feedback" className="flex-grow bg-muted/20 m-4 mt-0 rounded-lg">
                                             <ScrollArea className="h-full p-4">
                                                 {isReviewing && <p className="text-muted-foreground">Analyzing your code...</p>}
                                                 {isCorrect && (
                                                     <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-300">
                                                        <p className="font-semibold mb-2 flex items-center gap-2"><CheckCircle /> Correct!</p>
                                                        <p>{feedback}</p>
                                                        {nextLevel ? (
                                                            <Button asChild className="mt-4">
                                                                <Link href={`/playground/${game.id}/${nextLevel.id}`}>
                                                                    Next Level <ArrowRight className="ml-2" />
                                                                </Link>
                                                            </Button>
                                                        ) : (
                                                            <Button asChild className="mt-4">
                                                                <Link href={`/playground/${game.id}`}>
                                                                    Finish Game <CheckCircle className="ml-2" />
                                                                </Link>
                                                            </Button>
                                                        )}
                                                    </div>
                                                 )}
                                                 {!isCorrect && feedback && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300 whitespace-pre-wrap font-mono">{feedback}</div>}
                                                 {hint && !feedback && (
                                                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm text-yellow-200">
                                                        <p className="font-semibold mb-2 flex items-center gap-2"><Lightbulb /> Hint:</p>
                                                        <p>{hint}</p>
                                                    </div>
                                                 )}
                                                 {!isReviewing && !feedback && !hint && <p className="text-muted-foreground text-sm text-center pt-8">Run your code to get AI-powered feedback.</p>}
                                             </ScrollArea>
                                        </TabsContent>
                                        <TabsContent value="output" className="flex-grow bg-muted/20 m-4 mt-0 rounded-lg">
                                            <OutputConsole output={runOutput} />
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </main>
        </div>
    );
}

// Add Tabs components to the page for layout
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
