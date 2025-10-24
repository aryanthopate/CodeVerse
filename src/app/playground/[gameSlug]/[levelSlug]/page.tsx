

'use client';

import { useState, useEffect, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { getGameAndLevelDetails } from '@/lib/supabase/queries';
import { GameWithLevels, GameLevel, UserProfile } from '@/lib/types';
import Link from 'next/link';
import { ArrowLeft, Bot, Lightbulb, Loader2, Play, Sparkles, CheckCircle, ArrowRight, X, Rocket, Award, Heart, ShieldX, ShieldCheck, RefreshCw, Code, BookOpen } from 'lucide-react';
import { reviewCodeAndProvideFeedback } from '@/ai/flows/review-code-and-provide-feedback';
import { provideHintForCodePractice } from '@/ai/flows/provide-hint-for-code-practice';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import Confetti from 'react-confetti';
import { useIsMobile } from '@/hooks/use-mobile';


interface Bubble {
  id: number;
  text: string;
  x: number; // Represents the column index (0-3)
  y: number;
  isTarget: boolean;
  isBursting: boolean;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
}

const lanePositions = [15, 38, 61, 84]; // % for the center of each of the 4 lanes

function CodeBubbleGame({
    level,
    onCorrectBubble,
    onLevelComplete,
    onGameOver,
    gameSlug,
}: {
    level: GameLevel,
    onCorrectBubble: (text: string) => void,
    onLevelComplete: () => void,
    onGameOver: () => void,
    gameSlug: string,
}) {
    const rocketRef = useRef<HTMLDivElement>(null);
    const gameAreaRef = useRef<HTMLDivElement>(null);
    const [bubbles, setBubbles] = useState<Bubble[]>([]);
    const [bullets, setBullets] = useState<Bullet[]>([]);
    const [targetIndex, setTargetIndex] = useState(0);
    const [lives, setLives] = useState(3);
    const isMobile = useIsMobile();
    const gameLoopRef = useRef<number>();
    const lastBubbleTimeRef = useRef(Date.now());


    const correctSnippets = useMemo(() => {
        // Correctly parse the expected output into code snippets
        return level.expected_output?.match(/([a-zA-Z0-9_]+|"[^"]*"|'[^']*'|[\(\)\.,=;\[\]\{\}\+\-\*\/])/g) || [];
    }, [level.expected_output]);

    const fireBullet = useCallback(() => {
        if (rocketRef.current) {
            const rocketRect = rocketRef.current.getBoundingClientRect();
            const gameAreaRect = gameAreaRef.current!.getBoundingClientRect();
            const newBullet: Bullet = {
                id: Date.now(),
                x: rocketRect.left - gameAreaRect.left + rocketRect.width / 2,
                y: rocketRect.top - gameAreaRect.top,
            };
            setBullets(prev => [...prev, newBullet]);
        }
    }, []);

    const handleRestart = () => {
        setBubbles([]);
        setBullets([]);
        setTargetIndex(0);
        setLives(3);
        lastBubbleTimeRef.current = Date.now();
    };

    useEffect(() => {
        if (lives <= 0) {
            onGameOver();
        }
    }, [lives, onGameOver]);

    useEffect(() => {
        if (targetIndex >= correctSnippets.length && correctSnippets.length > 0) {
            onLevelComplete();
        }
    }, [targetIndex, correctSnippets.length, onLevelComplete]);


    // Game Loop Logic
    useEffect(() => {
        const gameLoop = () => {
            if (!gameAreaRef.current) {
                gameLoopRef.current = requestAnimationFrame(gameLoop);
                return;
            }

            // Spawn new bubbles periodically
            if (Date.now() - lastBubbleTimeRef.current > 5000 && bubbles.length < 2) {
                const currentTargetExists = bubbles.some(b => b.isTarget);
                if (!currentTargetExists && targetIndex < correctSnippets.length) {
                    const newBubbles: Bubble[] = [];
                    const targetText = correctSnippets[targetIndex];

                    const availableLanes = [0, 1, 2, 3];

                    // Add the target bubble
                    const targetLaneIndex = Math.floor(Math.random() * availableLanes.length);
                    const targetLane = availableLanes.splice(targetLaneIndex, 1)[0];
                    newBubbles.push({
                        id: Date.now(),
                        text: targetText,
                        x: targetLane,
                        y: -50,
                        isTarget: true,
                        isBursting: false,
                    });

                    // Add distractor bubble
                    const incorrectSnippets = ['var', 'func', 'err', '=>', 'const', 'let', 'x', 'y', 'z', '123', 'error', 'null'];
                    const distractorLaneIndex = Math.floor(Math.random() * availableLanes.length);
                    const distractorLane = availableLanes.splice(distractorLaneIndex, 1)[0];
                    let distractorText;
                    do {
                        distractorText = incorrectSnippets[Math.floor(Math.random() * incorrectSnippets.length)];
                    } while (distractorText === targetText);

                    newBubbles.push({
                        id: Date.now() + 1,
                        text: distractorText,
                        x: distractorLane,
                        y: -50,
                        isTarget: false,
                        isBursting: false,
                    });

                    setBubbles(prev => [...prev, ...newBubbles]);
                    lastBubbleTimeRef.current = Date.now();
                }
            }

            // Move bullets and bubbles
            setBullets(prevBullets =>
                prevBullets
                .map(bullet => ({ ...bullet, y: bullet.y - 10 }))
                .filter(bullet => bullet.y > -20)
            );

            let hitBulletIds = new Set<number>();
            let hitBubbleIds = new Set<number>();
            
            setBubbles(prevBubbles => {
                const updatedBubbles = prevBubbles.map(bubble => ({ ...bubble, y: bubble.y + 0.25 }));

                // Collision detection
                for (const bullet of bullets) {
                    for (const bubble of updatedBubbles) {
                        if (hitBulletIds.has(bullet.id) || bubble.isBursting || hitBubbleIds.has(bubble.id)) continue;

                        const bubbleX = (lanePositions[bubble.x] / 100) * gameAreaRef.current!.offsetWidth;
                        const distance = Math.sqrt(Math.pow(bullet.x - bubbleX, 2) + Math.pow(bullet.y - bubble.y, 2));

                        if (distance < 40) {
                            hitBulletIds.add(bullet.id);
                            hitBubbleIds.add(bubble.id);

                            if (bubble.isTarget) {
                                onCorrectBubble(bubble.text);
                                setTargetIndex(i => i + 1);
                            } else {
                                setLives(l => l - 1);
                            }
                        }
                    }
                }
                
                // Filter out hit bubbles and off-screen bubbles
                return updatedBubbles.filter(bubble => {
                    if (hitBubbleIds.has(bubble.id)) {
                        setTimeout(() => {
                            setBubbles(b => b.filter(x => x.id !== bubble.id))
                        }, 300);
                        return true; // Keep it for bursting animation
                    }

                    if (bubble.y > gameAreaRef.current!.offsetHeight) {
                        if (bubble.isTarget) {
                            setLives(l => l - 1); // Lose a life if target is missed
                        }
                        return false;
                    }
                    return true;
                });
            });

            setBullets(prev => prev.filter(b => !hitBulletIds.has(b.id)));
            
            // Re-map hit bubbles to start bursting
            setBubbles(prev => prev.map(b => hitBubbleIds.has(b.id) ? {...b, isBursting: true} : b));


            gameLoopRef.current = requestAnimationFrame(gameLoop);
        };

        gameLoopRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        }
    }, [correctSnippets, onCorrectBubble, targetIndex, bullets, onLevelComplete, onGameOver]); // Removed `lives` dependency to avoid state update issues

    // Controls
    useEffect(() => {
        const gameArea = gameAreaRef.current;
        const rocket = rocketRef.current;
        if (!gameArea || !rocket) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = gameArea.getBoundingClientRect();
            const x = e.clientX - rect.left;
            rocket.style.transform = `translateX(${x - rocket.offsetWidth / 2}px)`;
        };

        const handleClick = () => fireBullet();

        gameArea.addEventListener('mousemove', handleMouseMove);
        gameArea.addEventListener('click', handleClick);

        return () => {
            if (gameArea) {
                gameArea.removeEventListener('mousemove', handleMouseMove);
                gameArea.removeEventListener('click', handleClick);
            }
        };
    }, [fireBullet]);


    return (
        <div ref={gameAreaRef} id="game-area" className="w-full h-full bg-gray-900/50 rounded-lg relative overflow-hidden border border-border cursor-crosshair">
            <div className="absolute inset-0 bg-grid-white/[0.03] -z-10"></div>
            {/* UI Overlay */}
            <div className="absolute top-4 left-4 flex items-center gap-4 z-20">
                <div className="flex items-center gap-2">
                    <span className="font-bold">Lives:</span>
                    <div className="flex gap-1">
                        {[...Array(3)].map((_, i) => (
                            <Heart key={i} className={cn("w-5 h-5 transition-colors", i < lives ? "text-red-500 fill-red-500" : "text-muted-foreground/50")} />
                        ))}
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleRestart}><RefreshCw className="mr-2" /> Restart</Button>
                <Button variant="destructive" size="sm" asChild>
                    <Link href={`/playground/${gameSlug}`}><X className="mr-2" /> Quit</Link>
                </Button>
            </div>

            {bubbles.map(bubble => (
                <div
                    key={bubble.id}
                    className={cn(
                        "absolute px-3 py-2 rounded-full text-white font-mono text-sm",
                        "bg-primary/50 backdrop-blur-sm border-2 border-primary/80 shadow-lg shadow-primary/20",
                        "transition-all duration-300",
                        bubble.isBursting && "animate-ping opacity-0 scale-150"
                    )}
                    style={{
                        top: `${bubble.y}px`,
                        left: `${lanePositions[bubble.x]}%`,
                        transform: `translateX(-50%)`,
                    }}
                >
                    {bubble.text}
                </div>
            ))}
            {bullets.map(bullet => (
                <div
                    key={bullet.id}
                    className="absolute w-1 h-4 bg-primary rounded-full shadow-lg shadow-primary/80"
                    style={{
                        left: `${bullet.x}px`,
                        top: `${bullet.y}px`,
                        transform: 'translateX(-50%)'
                    }}
                />
            ))}
            <div ref={rocketRef} className="absolute bottom-4 h-12 w-10 will-change-transform z-10">
                <Rocket className="w-full h-full text-primary" />
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-4 h-8 bg-gradient-to-t from-yellow-400 to-orange-500 rounded-b-full blur-sm" />
            </div>
            {isMobile && (
                <div className="absolute bottom-4 right-4 z-20">
                    <Button size="lg" onClick={fireBullet} className="h-16 w-16 rounded-full">Fire!</Button>
                </div>
            )}
        </div>
    )
}

const CodeEditor = forwardRef(({ level, onCodeChange, onCodeAppend }: { level: GameLevel, onCodeChange: (code: string) => void, onCodeAppend: (text: string) => void }, ref) => {
    const [code, setCode] = useState(level.starter_code || '');

    useImperativeHandle(ref, () => ({
        appendCode: (text: string) => {
            onCodeAppend(text); // Use the prop to queue the update
        },
        getCode: () => code,
        resetCode: () => {
            const initialCode = level.starter_code || '';
            setCode(initialCode);
            onCodeChange(initialCode);
        }
    }));
    
    // This effect safely updates the code state from the queue
    useEffect(() => {
        onCodeAppend((text: string) => {
             setCode(prev => {
                let newCode = prev;
                if (!newCode.trim() || newCode.endsWith('\n')) {
                    newCode = prev + text;
                } else {
                     const lastChar = prev.slice(-1);
                    if (['(', '[', '{', '.', ';'].includes(lastChar) || text === ')' || text === ';') {
                        newCode = prev + text;
                    } else {
                        newCode = prev + ' ' + text;
                    }
                }
                onCodeChange(newCode); // Notify parent of the final code
                return newCode;
            });
        });
    }, [onCodeAppend, onCodeChange]);


    return (
        <div
            className="w-full h-full p-4 bg-gray-900 text-white font-mono rounded-lg border border-gray-700 whitespace-pre-wrap"
        >
            {code}<span className="animate-pulse">_</span>
        </div>
    );
});
CodeEditor.displayName = 'CodeEditor';


function OutputConsole({ output, isError }: { output: string, isError: boolean }) {
    return (
        <div className={cn("w-full h-full p-4 bg-black font-mono rounded-lg border border-gray-700 overflow-y-auto", isError ? "text-red-400" : "text-green-400")}>
            <pre>{`> ${output}`}</pre>
        </div>
    )
}

function ManualCodePractice({ level, onRunCode, onGetHint }: { level: GameLevel, onRunCode: (code: string) => void, onGetHint: (code: string) => void }) {
    const [code, setCode] = useState(level.starter_code || '');
    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border/50 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Manual Code Editor</h2>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onGetHint(code)}>
                        <Lightbulb className="mr-2" /> Hint
                    </Button>
                    <Button size="sm" onClick={() => onRunCode(code)}>
                        <Play className="mr-2" /> Run Code
                    </Button>
                </div>
            </div>
            <div className="flex-grow p-2">
                <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-full p-4 bg-gray-900 text-white font-mono rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
            </div>
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
    const [gameState, setGameState] = useState<'playing' | 'levelComplete' | 'gameOver' | 'manual'>('playing');
    const [showSolution, setShowSolution] = useState(false);

    const [feedback, setFeedback] = useState('');
    const [hint, setHint] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [isGettingHint, setIsGettingHint] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [runOutput, setRunOutput] = useState('');
    const [runOutputIsError, setRunOutputIsError] = useState(false);

    const [showConfetti, setShowConfetti] = useState(false);
    const editorRef = useRef<{ appendCode: (text: string) => void, getCode: () => string, resetCode: () => void }>(null);
    const [finalCode, setFinalCode] = useState('');
    const appendCodeQueue = useRef<((text: string) => void)[]>([]);


    const handleCodeAppend = (text: string) => {
        appendCodeQueue.current.forEach(fn => fn(text));
    };

    const handleSetAppendCallback = (callback: (text: string) => void) => {
        appendCodeQueue.current.push(callback);
        return () => {
             appendCodeQueue.current = appendCodeQueue.current.filter(cb => cb !== callback);
        };
    };

    const handleLevelComplete = useCallback(() => {
        setGameState('levelComplete');
    }, []);

    const handleGameOver = useCallback(() => {
        setGameState('gameOver');
    }, []);

    const handleRestart = useCallback(() => {
        setGameState('playing');
        setFeedback('');
        setHint('');
        setIsCorrect(false);
        setRunOutput('');
        setShowSolution(false);
        editorRef.current?.resetCode();
    }, []);

    const handleCorrectBubble = useCallback((text: string) => {
        handleCodeAppend(text);
    }, []);

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
                setFinalCode(level.starter_code || '');
            }
            setLoading(false);
        };
        fetchDetails();
    }, [params, supabase, router]);

    const handleRunCode = async (codeToRun: string) => {
        if (!level || !codeToRun) return;
        setIsChecking(true);
        setFeedback('');
        setHint('');
        setRunOutput('Running code...');
        setRunOutputIsError(false);

        const isSolutionCorrect = codeToRun.trim().replace(/\s+/g, ' ') === level.expected_output?.trim().replace(/\s+/g, ' ');

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
                const result = await reviewCodeAndProvideFeedback({
                    code: codeToRun,
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

    const handleGetHint = async (codeForHint: string) => {
        if (!level) return;
        setIsGettingHint(true);
        setHint('');
        try {
            const result = await provideHintForCodePractice({
                problemStatement: level.objective,
                userCode: codeForHint,
            });
            setHint(result.hint);
        } catch (e: any) {
            setHint(`Error getting hint: ${e.message}`);
        } finally {
            setIsGettingHint(false);
        }
    }

    const GameStatusOverlay = () => {
        if (gameState === 'levelComplete') {
            return (
                <div className="absolute inset-0 w-full h-full bg-gray-900/80 rounded-lg z-30 flex flex-col items-center justify-center text-center p-4">
                    <ShieldCheck className="w-24 h-24 text-green-400 mb-4" />
                    <h3 className="text-2xl font-bold">Level Complete!</h3>
                    <p className="text-muted-foreground mt-2">You've assembled the code. Now run it to check your solution!</p>
                    <Button onClick={() => handleRunCode(finalCode)} className="mt-6">
                        <Play className="mr-2" /> Run Final Code
                    </Button>
                </div>
            );
        }
        if (gameState === 'gameOver') {
            return (
                <div className="absolute inset-0 w-full h-full bg-gray-900/80 rounded-lg z-30 flex flex-col items-center justify-center text-center p-4">
                    <ShieldX className="w-24 h-24 text-red-400 mb-4" />
                    <h3 className="text-2xl font-bold">Game Over</h3>
                    <p className="text-muted-foreground mt-2">You've run out of lives.</p>
                    <div className="flex gap-4 mt-6">
                        <Button onClick={handleRestart}><RefreshCw className="mr-2" />Try Again</Button>
                        <Button variant="secondary" onClick={() => setShowSolution(true)}><BookOpen className="mr-2" /> Show Solution</Button>
                        <Button variant="outline" onClick={() => setGameState('manual')}><Code className="mr-2" /> Try Manual Mode</Button>
                    </div>
                </div>
            );
        }
        return null;
    };


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
                        <div className="flex flex-col h-full">
                            <div className="flex-grow relative">
                                {gameState === 'manual' ? (
                                    <ManualCodePractice level={level} onRunCode={handleRunCode} onGetHint={handleGetHint} />
                                ) : (
                                    <>
                                        <CodeBubbleGame
                                            key={gameState} // Force re-render on restart
                                            level={level}
                                            onCorrectBubble={handleCorrectBubble}
                                            onLevelComplete={handleLevelComplete}
                                            onGameOver={handleGameOver}
                                            gameSlug={game.slug}
                                        />
                                        <GameStatusOverlay />
                                    </>
                                )}
                            </div>
                        </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={50}>
                        <ResizablePanelGroup direction="vertical">
                            <ResizablePanel defaultSize={30} minSize={20}>
                                <ScrollArea className="h-full p-4">
                                    <h2 className="text-lg font-semibold mb-2">Objective</h2>
                                    <p className="text-sm text-muted-foreground">{level.objective}</p>
                                </ScrollArea>
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={40} minSize={20}>
                                <div className="flex flex-col h-full">
                                    <div className="p-4 border-b border-border/50 flex justify-between items-center">
                                        <h2 className="text-lg font-semibold">Code Editor</h2>
                                        <Button size="sm" onClick={() => handleRunCode(finalCode)} disabled={isChecking}>
                                            {isChecking ? <Loader2 className="mr-2 animate-spin" /> : <Play className="mr-2" />} Run Code
                                        </Button>
                                    </div>
                                    <div className="flex-grow p-2">
                                        <CodeEditor 
                                            ref={editorRef} 
                                            level={level} 
                                            onCodeChange={setFinalCode}
                                            onCodeAppend={handleSetAppendCallback} 
                                        />
                                    </div>
                                </div>
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={30} minSize={20}>
                                <div className="flex flex-col h-full">
                                    <Tabs defaultValue="feedback" className="flex-grow flex flex-col">
                                        <TabsList className="m-4">
                                            <TabsTrigger value="feedback"><Bot className="mr-2" />AI Feedback</TabsTrigger>
                                            <TabsTrigger value="output"><Play className="mr-2" />Output</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="feedback" className="flex-grow bg-muted/20 m-4 mt-0 rounded-lg">
                                            <ScrollArea className="h-full p-4">
                                                {isChecking && <p className="text-muted-foreground">Analyzing your code...</p>}
                                                {showSolution && (
                                                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm">
                                                        <h3 className="font-semibold mb-2">Solution:</h3>
                                                        <pre className="bg-black/50 p-2 rounded-md font-mono text-xs">{level.expected_output}</pre>
                                                        {level.incorrect_feedback && <p className="mt-2 italic">{level.incorrect_feedback}</p>}
                                                        <Button onClick={handleRestart} className="mt-4"><RefreshCw className="mr-2" />Try Again</Button>
                                                    </div>
                                                )}
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
                                                {!isChecking && !feedback && !showSolution && <p className="text-muted-foreground text-sm text-center pt-8">Run your code to get AI-powered feedback.</p>}
                                            </ScrollArea>
                                        </TabsContent>
                                        <TabsContent value="output" className="flex-grow bg-muted/20 m-4 mt-0 rounded-lg">
                                            <OutputConsole output={runOutput} isError={runOutputIsError} />
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

    