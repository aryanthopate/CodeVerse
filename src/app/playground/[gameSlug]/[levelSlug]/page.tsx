
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { getGameAndLevelDetails, getIsUserEnrolled } from '@/lib/supabase/queries';
import { GameWithLevels, GameLevel, UserProfile } from '@/lib/types';
import Link from 'next/link';
import { ArrowLeft, Bot, Lightbulb, Loader2, Play, Sparkles, CheckCircle, ArrowRight, X, Rocket, Award } from 'lucide-react';
import { reviewCodeAndProvideFeedback, provideHintForCodePractice } from '@/ai/flows/review-code-and-provide-feedback';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import Confetti from 'react-confetti';

// --- New Code Bubble Game Component ---

interface Bubble {
  id: number;
  text: string;
  isCorrect: boolean;
  isTarget: boolean;
  x: number;
  y: number;
  vy: number; // vertical velocity
}

function CodeBubbleGame({ level, onCodeUpdate, onCorrectBubble, onIncorrectBubble }: { level: GameLevel, onCodeUpdate: (code: string) => void, onCorrectBubble: (text: string) => void, onIncorrectBubble: () => void }) {
  const [rocketX, setRocketX] = useState(50);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [targetIndex, setTargetIndex] = useState(0);

  const correctSnippets = useMemo(() => {
      // Split by spaces or punctuation, but keep delimiters
      return level.expected_output?.match(/([a-zA-Z0-9_]+|"[^"]*"|'[^']*'|[\(\)\.,=;\[\]\{\}])/g) || [];
  }, [level.expected_output]);

  // Bubble generation logic
  useEffect(() => {
    const generateBubbles = () => {
      const newBubbles: Bubble[] = [];
      const incorrectSnippets = ['var', 'func', 'err', '=>', 'const', 'let', 'x', 'y', 'z', '123'];
      
      const allSnippets = [...correctSnippets, ...incorrectSnippets.slice(0, correctSnippets.length * 2)];
      const shuffledSnippets = allSnippets.sort(() => Math.random() - 0.5);

      shuffledSnippets.forEach((text, i) => {
        const isCorrectSnippet = correctSnippets.includes(text);
        newBubbles.push({
          id: Date.now() + i,
          text,
          isCorrect: isCorrectSnippet,
          isTarget: isCorrectSnippet && correctSnippets.indexOf(text) === targetIndex,
          x: Math.random() * 90 + 5, // %
          y: -10 - (Math.random() * 50), // Start off-screen
          vy: 0.5 + Math.random() * 0.5,
        });
      });
      setBubbles(newBubbles);
    };

    if (correctSnippets.length > 0) {
      generateBubbles();
    }
  }, [correctSnippets, targetIndex]);

  // Game loop
  useEffect(() => {
    const gameLoop = setInterval(() => {
      setBubbles(prev =>
        prev.map(b => {
          let newY = b.y + b.vy;
          // Collision detection with rocket
          if (newY > 85 && newY < 95 && Math.abs(b.x - rocketX) < 5) {
            if (b.text === correctSnippets[targetIndex]) {
              onCorrectBubble(b.text);
              setTargetIndex(i => i + 1);
              return { ...b, y: 110 }; // Remove bubble
            } else {
              onIncorrectBubble();
              return { ...b, y: 110 }; // Remove bubble
            }
          }
          if (newY > 100) return { ...b, y: -10, x: Math.random() * 90 + 5 }; // Reset bubble
          return { ...b, y: newY };
        }).filter(b => b.y < 105) // Cleanup bubbles that have been hit
      );
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [rocketX, onCorrectBubble, onIncorrectBubble, correctSnippets, targetIndex]);
  
  // Controls
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const newX = ((e.clientX - rect.left) / rect.width) * 100;
      setRocketX(Math.max(5, Math.min(95, newX)));
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setRocketX(x => Math.max(5, x - 3));
      } else if (e.key === 'ArrowRight') {
        setRocketX(x => Math.min(95, x + 3));
      }
    };
    
    const gameArea = document.getElementById('game-area');
    gameArea?.addEventListener('mousemove', handleMouseMove as EventListener);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      gameArea?.removeEventListener('mousemove', handleMouseMove as EventListener);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div id="game-area" className="w-full h-full bg-gray-900/50 rounded-lg relative overflow-hidden border border-border">
       <div className="absolute inset-0 bg-grid-white/[0.03] -z-10"></div>
      {bubbles.map(b => (
        <div
          key={b.id}
          className={cn("absolute px-3 py-1 rounded-full text-white font-mono text-sm transition-all",
             b.text === correctSnippets[targetIndex] ? "bg-primary/80 shadow-lg shadow-primary/50" : "bg-muted/80"
          )}
          style={{ left: `${b.x}%`, top: `${b.y}%`, transform: 'translateX(-50%)' }}
        >
          {b.text}
        </div>
      ))}
      <div className="absolute bottom-4 h-12 w-10" style={{ left: `${rocketX}%`, transform: 'translateX(-50%)' }}>
        <Rocket className="w-full h-full text-primary" />
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-4 h-8 bg-gradient-to-t from-yellow-400 to-orange-500 rounded-b-full blur-sm" />
      </div>
    </div>
  )
}

function CodeEditor({ value }: { value: string }) {
    return (
        <div
            className="w-full h-full p-4 bg-gray-900 text-white font-mono rounded-lg border border-gray-700"
        >
          <pre>{value}<span className="animate-pulse">_</span></pre>
        </div>
    )
}

function OutputConsole({ output, isError }: { output: string, isError: boolean }) {
     return (
        <div className={cn("w-full h-full p-4 bg-black font-mono rounded-lg border border-gray-700 overflow-y-auto", isError ? "text-red-400" : "text-green-400")}>
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
    const [showIntro, setShowIntro] = useState(true);

    const [userCode, setUserCode] = useState('');
    const [feedback, setFeedback] = useState('');
    const [hint, setHint] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [isGettingHint, setIsGettingHint] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [runOutput, setRunOutput] = useState('');
    const [runOutputIsError, setRunOutputIsError] = useState(false);
    
    const [showConfetti, setShowConfetti] = useState(false);
    const [incorrectBubbleHits, setIncorrectBubbleHits] = useState(0);

    useEffect(() => {
        const fetchDetails = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
              router.push(`/login?redirect=/playground/${params.gameSlug}/${params.levelSlug}`);
              return;
            }
            setUser(user);

            const { game, level, nextLevel } = await getGameAndLevelDetails(params.gameSlug as string, params.levelSlug as string);

            if (game && level) {
                setGame(game);
                setLevel(level);
                setNextLevel(nextLevel);
                // We don't set userCode from starter code anymore, it's built via the game
            }
            setLoading(false);
        };
        fetchDetails();
    }, [params, supabase, router]);

    const handleCorrectBubble = useCallback((text: string) => {
        // Add a space if the last char isn't a separator
        setUserCode(prev => {
            if (!prev) return text;
            const lastChar = prev.slice(-1);
            if (['(', '[', '{', '.'].includes(lastChar) || text === ')') return prev + text;
            return prev + ' ' + text;
        });
    }, []);

    const handleIncorrectBubble = useCallback(() => {
      setIncorrectBubbleHits(c => c + 1);
      // Could add a screen shake or sound effect here
    }, []);

    const handleRunCode = async () => {
        if (!level) return;
        setIsChecking(true);
        setFeedback('');
        setHint('');
        setRunOutput('Running code...');
        setRunOutputIsError(false);

        const isSolutionCorrect = userCode.trim().replace(/\s+/g, ' ') === level.expected_output?.trim().replace(/\s+/g, ' ');

        if (isSolutionCorrect) {
            setIsCorrect(true);
            setRunOutput('Success! Output matches expected result.');
            setFeedback(level.correct_feedback || 'Great job! Your code is correct.');
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
            // Here you would add logic to save progress and award XP
        } else {
            setIsCorrect(false);
            setRunOutputIsError(true);
            setRunOutput('Execution finished. Check AI feedback for details.');
             try {
                // Check for alignment/syntax issues even if output is not perfect
                const result = await reviewCodeAndProvideFeedback({
                    code: userCode,
                    solution: level.expected_output || '',
                    programmingLanguage: game?.language || 'code',
                });
                setFeedback(result.feedback || (level.incorrect_feedback || "That's not quite right. Try again!"));
            } catch (e: any) {
                setFeedback(`Error getting feedback: ${e.message}`);
            }
        }
        
        setIsChecking(false);
    }
    
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


    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-background text-foreground">Loading Level...</div>;
    }

    if (!game || !level) {
        notFound();
    }
    
    if (showIntro) {
        return (
            <div className="flex flex-col h-screen bg-background">
                <Header />
                <main className="flex-grow pt-16 flex items-center justify-center relative overflow-hidden">
                    <Image src={`https://picsum.photos/seed/${level.id}/1920/1080`} alt="Mission Background" fill className="object-cover -z-10 opacity-20 blur-sm" data-ai-hint="futuristic space" />
                    <Card className="w-full max-w-2xl bg-card/50 backdrop-blur-lg border-border/50 text-center animate-in fade-in-0 zoom-in-95 duration-500">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold">Mission Briefing</CardTitle>
                            <CardDescription>{game.title}: {level.title}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-4 items-start">
                                <Bot className="w-16 h-16 text-primary flex-shrink-0" />
                                <p className="text-left p-4 bg-muted/50 rounded-lg border border-border">
                                    {level.intro_text || "Your mission, should you choose to accept it, is to complete the objective. Good luck, recruit!"}
                                </p>
                            </div>
                            <Button size="lg" onClick={() => setShowIntro(false)}>
                                Start Challenge <ArrowRight className="ml-2" />
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            </div>
        )
    }

    return (
         <div className="flex flex-col h-screen bg-background">
            {showConfetti && <Confetti recycle={false} numberOfPieces={400} />}
            <Header />
            <main className="flex-grow pt-16 flex flex-col">
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                    <Button variant="ghost" asChild>
                        <Link href={`/playground/${game.slug}`}>
                            <ArrowLeft className="mr-2" /> Back to Map
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold text-center truncate">{game.title}: {level.title}</h1>
                     <div className="w-[150px] flex justify-end">
                        <Badge variant="secondary" className="text-yellow-400 border-yellow-400/50">{level.reward_xp} XP</Badge>
                     </div>
                </div>

                <ResizablePanelGroup direction="horizontal" className="flex-grow">
                    <ResizablePanel defaultSize={50} minSize={30}>
                        <div className="flex flex-col h-full p-4">
                           <h2 className="text-lg font-semibold mb-2">Game Arena</h2>
                           <div className="flex-grow">
                             <CodeBubbleGame level={level} onCodeUpdate={setUserCode} onCorrectBubble={handleCorrectBubble} onIncorrectBubble={handleIncorrectBubble} />
                           </div>
                        </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={50}>
                         <ResizablePanelGroup direction="vertical">
                            <ResizablePanel defaultSize={30} minSize={20}>
                                <div className="h-full p-4">
                                  <h2 className="text-lg font-semibold mb-2">Objective</h2>
                                  <p className="text-sm text-muted-foreground">{level.objective}</p>
                                </div>
                            </ResizablePanel>
                            <ResizableHandle withHandle/>
                             <ResizablePanel defaultSize={40} minSize={20}>
                                <div className="flex flex-col h-full">
                                    <div className="p-4 border-b border-border/50 flex justify-between items-center">
                                        <h2 className="text-lg font-semibold">Code Editor</h2>
                                         <Button size="sm" onClick={handleRunCode} disabled={isChecking}>
                                            {isChecking ? <Loader2 className="mr-2 animate-spin" /> : <Play className="mr-2"/>} Run Code
                                        </Button>
                                    </div>
                                    <div className="flex-grow p-2">
                                        <CodeEditor value={userCode} />
                                    </div>
                                </div>
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={30} minSize={20}>
                                <div className="flex flex-col h-full">
                                    <Tabs defaultValue="feedback" className="flex-grow flex flex-col">
                                        <TabsList className="m-4">
                                            <TabsTrigger value="feedback"><Bot className="mr-2"/>AI Feedback</TabsTrigger>
                                            <TabsTrigger value="output"><Play className="mr-2"/>Output</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="feedback" className="flex-grow bg-muted/20 m-4 mt-0 rounded-lg">
                                             <ScrollArea className="h-full p-4">
                                                 {isChecking && <p className="text-muted-foreground">Analyzing your code...</p>}
                                                 {isCorrect && (
                                                     <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-300">
                                                        <p className="font-semibold mb-2 flex items-center gap-2"><CheckCircle /> Correct!</p>
                                                        <p>{feedback}</p>
                                                        {nextLevel ? (
                                                            <Button asChild className="mt-4">
                                                                <Link href={`/playground/${game.slug}/${nextLevel.slug}`}>
                                                                    Next Level <ArrowRight className="ml-2" />
                                                                </Link>
                                                            </Button>
                                                        ) : (
                                                            <Button asChild className="mt-4">
                                                                <Link href={`/playground/${game.slug}`}>
                                                                    Finish Game <Award className="ml-2" />
                                                                </Link>
                                                            </Button>
                                                        )}
                                                    </div>
                                                 )}
                                                 {!isCorrect && feedback && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300 whitespace-pre-wrap font-mono">{feedback}</div>}
                                                 {!isChecking && !feedback && <p className="text-muted-foreground text-sm text-center pt-8">Run your code to get AI-powered feedback.</p>}
                                             </ScrollArea>
                                        </TabsContent>
                                        <TabsContent value="output" className="flex-grow bg-muted/20 m-4 mt-0 rounded-lg">
                                            <OutputConsole output={runOutput} isError={runOutputIsError}/>
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


    