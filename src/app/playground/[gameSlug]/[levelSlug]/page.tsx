
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { getGameAndLevelDetails } from '@/lib/supabase/queries';
import { GameWithChaptersAndLevels, GameLevel, GameChapter } from '@/lib/types';
import Link from 'next/link';
import { ArrowLeft, Bot, Lightbulb, Loader2, Play, CheckCircle, ArrowRight, X, Award, RefreshCw, Code, BookOpen, GripVertical, Heart, Zap } from 'lucide-react';
import { reviewCodeAndProvideFeedback } from '@/ai/flows/review-code-and-provide-feedback';
import { provideHintForCodePractice } from '@/ai/flows/provide-hint-for-code-practice';
import { generateDistractors } from '@/ai/flows/generate-distractors';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import Confetti from 'react-confetti';
import { completeGameLevel } from '@/lib/supabase/actions';
import { DndContext, useDraggable, useDroppable, DragOverlay, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


const pieceColors = [
    'bg-sky-500/80 border-sky-400 text-sky-50',
    'bg-emerald-500/80 border-emerald-400 text-emerald-50',
    'bg-amber-500/80 border-amber-400 text-amber-50',
    'bg-rose-500/80 border-rose-400 text-rose-50',
    'bg-violet-500/80 border-violet-400 text-violet-50',
    'bg-fuchsia-500/80 border-fuchsia-400 text-fuchsia-50',
];

interface Piece {
  id: string;
  text: string;
  color: string;
  parent: 'bucket' | 'solution';
}

function DraggablePiece({ piece, isOverlay = false }: { piece: Piece, isOverlay?: boolean }) {    
    const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
        id: piece.id,
    });
    
    const style = {
        transform: CSS.Transform.toString(transform),
        opacity: isDragging && !isOverlay ? 0.5 : 1,
        zIndex: isDragging ? 100 : 'auto',
        cursor: isOverlay ? 'grabbing' : 'grab',
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}
            className={cn("px-3 py-1.5 rounded-md font-mono flex items-center gap-2 border-2", piece.color, isOverlay && "shadow-lg")}>
            <GripVertical className="w-4 h-4 opacity-70"/>
            {piece.text}
        </div>
    );
}

function DroppableArea({ id, children, isCorrect }: { id: string, children: React.ReactNode, isCorrect?: boolean | null }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            className={cn(
                "min-h-[120px] bg-black/30 rounded-lg p-3 border-2 border-dashed border-gray-600 flex flex-wrap gap-2 items-start content-start transition-colors",
                isOver && "border-primary bg-primary/10",
                isCorrect === true && "border-green-500 bg-green-500/10",
                isCorrect === false && "border-red-500 bg-red-500/10 animate-shake"
            )}
        >
            {children}
        </div>
    );
}


function CodeScrambleGame({
    level,
    gameLanguage,
    onStageComplete,
    onIncorrect,
    onCodeChange
}: {
    level: GameLevel;
    gameLanguage: string;
    onStageComplete: () => void;
    onIncorrect: () => void;
    onCodeChange: (newCode: string) => void;
}) {
    const [pieces, setPieces] = useState<Piece[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);

    const correctSnippets = useMemo(() => {
        return level.expected_output?.match(/([a-zA-Z_]\w*|"[^"]*"|'[^']*'|[\(\)\.,=;\[\]\{\}\+\-\*\/]|\d+)/g) || [];
    }, [level.expected_output]);

    useEffect(() => {
        const setupGame = async () => {
            setIsLoading(true);
            const { distractors } = await generateDistractors({
                language: gameLanguage,
                correctSnippets: correctSnippets,
                count: Math.max(3, Math.floor(correctSnippets.length / 2)),
            });

            const correctPs: Piece[] = correctSnippets.map((text, i) => ({ id: `corr-${i}`, text, color: pieceColors[i % pieceColors.length], parent: 'bucket' }));
            const distractorPs: Piece[] = distractors.map((text, i) => ({ id: `dist-${i}`, text, color: pieceColors[(correctSnippets.length + i) % pieceColors.length], parent: 'bucket' }));

            const allPieces = [...correctPs, ...distractorPs];
            for (let i = allPieces.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allPieces[i], allPieces[j]] = [allPieces[j], allPieces[i]];
            }

            setPieces(allPieces);
            setIsLoading(false);
            setIsCorrect(null);
            onCodeChange('');
        };
        setupGame();
    }, [level, correctSnippets, gameLanguage, onCodeChange]);

    function handleDragStart(event: any) {
        setActiveId(event.active.id);
    }
    
    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;
        
        const activePiece = pieces.find(p => p.id === active.id);
        if (!activePiece) return;

        const overContainerId = over.id as 'solution' | 'bucket';
        const activeContainerId = activePiece.parent;

        if (activeContainerId !== overContainerId) {
            setPieces(prevPieces => prevPieces.map(p => p.id === active.id ? { ...p, parent: overContainerId } : p));
        }
    }

    const solutionPieces = useMemo(() => pieces.filter(p => p.parent === 'solution'), [pieces]);
    const bucketPieces = useMemo(() => pieces.filter(p => p.parent === 'bucket'), [pieces]);
    
    useEffect(() => {
        onCodeChange(solutionPieces.map(p => p.text).join(' '));
    }, [solutionPieces, onCodeChange]);

    const resetSolution = () => {
        setPieces(prev => prev.map(p => ({...p, parent: 'bucket'})));
        setIsCorrect(null);
    };

    const checkSolution = () => {
        const solutionText = solutionPieces.map(p => p.text).join(' ');
        const correctText = correctSnippets.join(' ');
        const isSolutionCorrect = solutionText === correctText;
        
        setIsCorrect(isSolutionCorrect);
        if (isSolutionCorrect) {
            onCodeChange(solutionText);
            setTimeout(onStageComplete, 500);
        } else {
            onIncorrect();
        }
    };

    const activePiece = activeId ? pieces.find(p => p.id === activeId) : null;

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
            <div className="flex flex-col h-full bg-gray-900/50 rounded-lg border border-border p-4 gap-4">
                {isLoading ? (
                    <div className="flex-grow flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary"/>
                        <p className="ml-2">Preparing the challenge...</p>
                    </div>
                ) : (
                    <>
                        <div className="flex-grow space-y-4 flex flex-col">
                             <DroppableArea id="solution" isCorrect={isCorrect}>
                                <SortableContext items={solutionPieces.map(p => p.id)}>
                                    {solutionPieces.length === 0 && <p className="text-gray-400 ml-2">Drag code pieces here to build your solution</p>}
                                    {solutionPieces.map((piece) => (
                                        <DraggablePiece key={piece.id} piece={piece} />
                                    ))}
                                </SortableContext>
                            </DroppableArea>
                            <p className="text-sm text-gray-400">Assemble the code pieces in the correct order. Drag pieces back to the bucket to remove them.</p>
                            <DroppableArea id="bucket">
                                <SortableContext items={bucketPieces.map(p => p.id)}>
                                    {bucketPieces.map((piece) => (
                                        <DraggablePiece key={piece.id} piece={piece} />
                                    ))}
                                </SortableContext>
                            </DroppableArea>
                        </div>
                        <div className="flex-shrink-0 flex gap-4">
                             <button className="btn-game flex-1" onClick={checkSolution} disabled={solutionPieces.length === 0}>
                                <CheckCircle className="mr-2"/> Check Answer
                            </button>
                            <button className="btn-game !bg-gray-600/80 !border-gray-500/80 !shadow-gray-800/80" onClick={resetSolution}>
                                <RefreshCw className="mr-2"/> Reset
                            </button>
                        </div>
                    </>
                )}
            </div>
            <DragOverlay>
                {activePiece ? <DraggablePiece piece={activePiece} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    );
}

function CodeEditor({ code }: { code: string }) {
    return (
        <div
            className="w-full h-full p-4 bg-gray-900 text-white font-mono rounded-lg border border-gray-700 whitespace-pre-wrap overflow-y-auto"
        >
            {code}<span className="animate-pulse">_</span>
        </div>
    );
}

function ManualCodePractice({ level, onRunCode, onGetHint, onCodeChange, code, isChecking, isGettingHint }: { level: GameLevel, onRunCode: (code: string) => void, onGetHint: (code: string) => void, onCodeChange: (code: string) => void, code: string, isChecking: boolean, isGettingHint: boolean }) {
    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border/50 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Manual Code Editor</h2>
                <div className="flex gap-2">
                    <button className="btn-game !py-2 !px-4" onClick={() => onGetHint(code)} disabled={isGettingHint}>
                        {isGettingHint ? <Loader2 className="mr-2 animate-spin"/> : <Lightbulb className="mr-2" />} Hint
                    </button>
                    <button className="btn-game !py-2 !px-4" onClick={() => onRunCode(code)} disabled={isChecking}>
                         {isChecking ? <Loader2 className="mr-2 animate-spin"/> : <Play className="mr-2" />} Run Code
                    </button>
                </div>
            </div>
            <div className="flex-grow p-2">
                <textarea
                    value={code}
                    onChange={(e) => onCodeChange(e.target.value)}
                    className="w-full h-full p-4 bg-gray-900 text-white font-mono rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Write your solution here..."
                />
            </div>
        </div>
    )
}

export default function GameLevelPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();

    const [game, setGame] = useState<GameWithChaptersAndLevels | null>(null);
    const [level, setLevel] = useState<GameLevel | null>(null);
    const [chapter, setChapter] = useState<GameChapter | null>(null);
    const [nextLevel, setNextLevel] = useState<GameLevel | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [showIntro, setShowIntro] = useState(true);
    const [gameState, setGameState] = useState<'puzzle' | 'manual' | 'levelComplete'>('puzzle');
    const [showSolution, setShowSolution] = useState(false);
    
    const [lives, setLives] = useState(3);
    const [streak, setStreak] = useState(0);

    const [feedback, setFeedback] = useState('');
    const [hint, setHint] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [runOutput, setRunOutput] = useState('');
    const [runOutputIsError, setRunOutputIsError] = useState(false);
    const [isGettingHint, setIsGettingHint] = useState(false);

    const [showConfetti, setShowConfetti] = useState(false);
    const [finalCode, setFinalCode] = useState('');
    
    const handleCodeChange = useCallback((newCode: string) => {
        setFinalCode(newCode);
    }, []);
    
    const handleLevelComplete = useCallback(async (usedHint: boolean) => {
        if (!level || !game || gameState === 'levelComplete') return;
        setGameState('levelComplete');
        
        const levelWasPerfect = lives === 3 && !usedHint;
        await completeGameLevel(level.id, game.id, level.reward_xp, levelWasPerfect);

        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 8000);
    }, [level, game, gameState, lives]);

    const handleStageComplete = () => {
        setStreak(s => s + 1);
        handleLevelComplete(false);
    };

     const handleRunCode = useCallback(async (codeToRun: string) => {
        if (!level || !codeToRun) return;
        setIsChecking(true);
        setFeedback('');
        setHint('');
        setRunOutput('Analyzing code...');
        setRunOutputIsError(false);
        
        try {
            const solutionCode = level.expected_output || '';
            const userCodeCleaned = codeToRun.replace(/\s+/g, ' ').trim();
            const solutionCleaned = solutionCode.replace(/\s+/g, ' ').trim();

            if (userCodeCleaned === solutionCleaned) {
                setIsCorrect(true);
                setRunOutput('Success! Output matches expected result.');
                setFeedback(level.correct_feedback || 'Great job! Your code is correct.');
                await handleStageComplete();
            } else {
                 const result = await reviewCodeAndProvideFeedback({
                    code: codeToRun,
                    solution: solutionCode,
                    programmingLanguage: game?.language || 'code',
                });
                setIsCorrect(false);
                setRunOutputIsError(true);
                setRunOutput('Execution finished. See AI feedback.');
                setFeedback(result.feedback || level.incorrect_feedback || "That's not quite right. Try again!");
                handleIncorrectAnswer();
            }
        } catch (e: any) {
            setRunOutputIsError(true);
            setRunOutput('Error during analysis.');
            setFeedback(`Error getting feedback: ${e.message}`);
        } finally {
            setIsChecking(false);
        }
    }, [level, game, handleStageComplete]);

    
    const handleIncorrectAnswer = () => {
        setLives(l => {
            const newLives = Math.max(0, l - 1);
            if (newLives <= 0) {
                setGameState('levelComplete');
            }
            return newLives;
        });
        setStreak(0);
    };

    useEffect(() => {
        const fetchDetails = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push(`/login?redirect=/playground/${params.gameSlug}/${params.levelSlug}`);
                return;
            }
            setUser(user);

            const { game, level, chapter, nextLevel } = await getGameAndLevelDetails(params.gameSlug as string, params.levelSlug as string);

            if (game && level && chapter) {
                setGame(game as GameWithChaptersAndLevels);
                setLevel(level);
                setChapter(chapter as GameChapter);
                setNextLevel(nextLevel);
                setFinalCode(level.starter_code || '');
            }
            setLoading(false);
        };
        fetchDetails();
    }, [params, supabase, router]);
    
    const handleGetHint = async (codeForHint: string) => {
        if (!level) return;
        setIsGettingHint(true);
        setHint('');
        setStreak(0);
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
            const isSuccess = lives > 0;
            return (
                 <div className="absolute inset-0 w-full h-full bg-gray-900/90 backdrop-blur-sm rounded-lg z-30 flex flex-col items-center justify-center text-center p-4">
                    {isSuccess && showConfetti && <Confetti recycle={false} numberOfPieces={500} gravity={0.2} />}
                    <div className="flex gap-4 items-center">
                         <div className={cn("text-7xl animate-burst", isSuccess ? "text-primary" : "text-red-500")}>
                            {isSuccess ? '🎉' : '💥'}
                         </div>
                         <div className="p-6 bg-card/80 rounded-xl relative text-left">
                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-card/80 rotate-45"></div>
                            <h3 className="text-2xl font-bold">{isSuccess ? 'Mission Complete!' : 'Mission Failed'}</h3>
                            <p className="text-muted-foreground mt-2">{isSuccess ? `Outstanding work, recruit! You earned ${level?.reward_xp} XP.` : "You've run out of lives. Better luck next time!"}</p>
                            <div className="flex gap-4 mt-6">
                                {nextLevel && isSuccess ? (
                                    <Link href={`/playground/${game!.slug}/${nextLevel.slug}`} className="btn-game flex-1">Next Mission <ArrowRight className="ml-2"/></Link>
                                ) : isSuccess ? (
                                    <Link href={`/playground/${game!.slug}`} className="btn-game flex-1">Finish Game <Award className="ml-2"/></Link>
                                ) : null}
                                <Link href={`/playground/${game!.slug}`} className="btn-game !bg-gray-600/80 !border-gray-500/80 !shadow-gray-800/80 flex-1">Quit Game</Link>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }

        return null;
    };


    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-background text-foreground">Loading Level...</div>;
    }

    if (!game || !level || !chapter) {
        notFound();
    }

    if (showIntro) {
        return (
            <div className="flex flex-col h-screen bg-[hsl(var(--game-bg))] text-[hsl(var(--game-text))]">
                <Header />
                <main className="flex-grow pt-16 flex items-center justify-center relative overflow-hidden">
                    <Image src={game.thumbnail_url || `https://picsum.photos/seed/${level.id}/1920/1080`} alt="Mission Background" fill className="object-cover -z-10 opacity-10 blur-sm" data-ai-hint="futuristic space" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--game-bg))]/50 via-[hsl(var(--game-bg))] to-[hsl(var(--game-bg))] -z-10"></div>
                    <Card className="w-full max-w-2xl bg-[hsl(var(--game-surface))] text-[hsl(var(--game-text))] border-2 border-[hsl(var(--game-border))] text-center animate-in fade-in-0 zoom-in-95 duration-500" style={{ boxShadow: '0 8px 16px hsla(0,0%,0%,0.4), inset 0 2px 4px hsl(var(--game-border)/0.6)'}}>
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold" style={{ color: 'hsl(var(--game-accent))', textShadow: '0 0 8px hsl(var(--game-accent-glow)/0.7)' }}>Mission Briefing</CardTitle>
                            <CardDescription className="text-[hsl(var(--game-text))]/80">{chapter.title}: Level {level.order} - {level.title}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-4 items-start">
                                <Bot className="w-16 h-16 text-[hsl(var(--game-accent))] flex-shrink-0" />
                                <p className="text-left p-4 bg-[hsl(var(--game-bg))] rounded-lg border border-[hsl(var(--game-border))]">
                                    {level.intro_text || "Your mission, should you choose to accept it, is to complete the objective. Good luck, recruit!"}
                                </p>
                            </div>
                            <button className="btn-game" onClick={() => setShowIntro(false)}>
                                Start Challenge <ArrowRight className="ml-2" />
                            </button>
                        </CardContent>
                    </Card>
                </main>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-[hsl(var(--game-bg))] text-[hsl(var(--game-text))]">
            <Header />
            <main className="flex-grow pt-16 flex flex-col">
                <div className="p-4 border-b-2 border-[hsl(var(--game-border))] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/playground/${game.slug}`} className="btn-game !py-2 !px-4">
                            <X className="mr-2" /> Quit
                        </Link>
                         <button onClick={() => window.location.reload()} className="btn-game !py-2 !px-4 !bg-gray-600/80 !border-gray-500/80 !shadow-gray-800/80">
                            <RefreshCw className="mr-2"/> Restart
                        </button>
                    </div>
                     <div className="text-center">
                        <h1 className="text-xl font-bold">Level {level.order} - {level.title}</h1>
                    </div>
                    <div className="w-[200px] flex justify-end items-center gap-4">
                        <div className="flex items-center gap-2 font-bold text-yellow-400">
                            <Zap className="text-yellow-400 fill-yellow-400"/>
                            {streak}
                        </div>
                        <div className="flex items-center gap-1">
                            {[...Array(3)].map((_, i) => (
                                <Heart key={i} className={cn("w-6 h-6 transition-all", i < lives ? "text-red-500 fill-red-500" : "text-white/30")} />
                            ))}
                        </div>
                    </div>
                </div>

                <ResizablePanelGroup direction="horizontal" className="flex-grow">
                    <ResizablePanel defaultSize={50} minSize={30}>
                        <div className="flex flex-col h-full">
                            <div className="flex-grow relative">
                                {gameState === 'manual' ? (
                                    <ManualCodePractice level={level} onRunCode={handleRunCode} onGetHint={handleGetHint} onCodeChange={setFinalCode} code={finalCode} isChecking={isChecking} isGettingHint={isGettingHint} />
                                ) : (
                                    <>
                                        <CodeScrambleGame
                                            level={level}
                                            gameLanguage={game.language || 'code'}
                                            onStageComplete={handleStageComplete}
                                            onIncorrect={handleIncorrectAnswer}
                                            onCodeChange={handleCodeChange}
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
                                    <p className="text-sm text-[hsl(var(--game-text))]/80">{level.objective}</p>
                                    <div className="mt-4">
                                        {gameState === 'puzzle' && (
                                            <button className="btn-game !py-2 !px-4" onClick={() => setGameState('manual')}><Code className="mr-2" /> Switch to Manual Mode</button>
                                        )}
                                        {gameState === 'manual' && (
                                            <button className="btn-game !py-2 !px-4" onClick={() => setGameState('puzzle')}><Code className="mr-2" /> Switch to Puzzle Mode</button>
                                        )}
                                    </div>
                                </ScrollArea>
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={70} minSize={20}>
                                <div className="flex flex-col h-full">
                                     <Tabs defaultValue="feedback" className="flex-grow flex flex-col">
                                        <TabsList className="m-4 tabs-game">
                                            <TabsTrigger value="feedback" className="tab-trigger-game"><Bot className="mr-2" />AI Feedback</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="feedback" className="flex-grow bg-muted/20 m-4 mt-0 rounded-lg">
                                            <ScrollArea className="h-full p-4">
                                                {isChecking && <p className="text-muted-foreground">Analyzing your code...</p>}
                                                {showSolution && (
                                                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm">
                                                        <h3 className="font-semibold mb-2">Solution:</h3>
                                                        <pre className="bg-black/50 p-2 rounded-md font-mono text-xs">{level.expected_output}</pre>
                                                        {level.incorrect_feedback && <p className="mt-2 italic">{level.incorrect_feedback}</p>}
                                                    </div>
                                                )}
                                                {!isCorrect && feedback && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300 whitespace-pre-wrap font-mono">{feedback}</div>}
                                                {isCorrect && feedback && <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-300 whitespace-pre-wrap font-mono">{feedback}</div>}
                                                {hint && <div className="mt-2 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">{hint}</div>}
                                                {!isChecking && !feedback && !showSolution && !isCorrect && !hint && <p className="text-muted-foreground text-sm text-center pt-8">Complete the puzzle or run code to get feedback.</p>}
                                            </ScrollArea>
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
