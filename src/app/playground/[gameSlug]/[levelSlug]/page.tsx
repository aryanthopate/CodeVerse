

'use client';

import { useState, useEffect, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { getGameAndLevelDetails } from '@/lib/supabase/queries';
import { GameWithLevels, GameLevel, UserProfile } from '@/lib/types';
import Link from 'next/link';
import { ArrowLeft, Bot, Lightbulb, Loader2, Play, Sparkles, CheckCircle, ArrowRight, X, Rocket, Award, Heart, ShieldX, ShieldCheck, RefreshCw } from 'lucide-react';
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
import { useIsMobile } from '@/hooks/use-mobile';


interface Bubble {
  id: number;
  text: string;
  x: number; // Represents the column index (0-3)
  y: number;
  isTarget: boolean;
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
    onIncorrectBubble, 
    onRestart, 
    gameSlug, 
    lives 
}: { 
    level: GameLevel, 
    onCorrectBubble: (text: string) => void, 
    onIncorrectBubble: () => void, 
    onRestart: () => void,
    gameSlug: string,
    lives: number
}) {
  const rocketRef = useRef<HTMLDivElement>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [targetIndex, setTargetIndex] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const lastBubbleTime = useRef(Date.now());
  const isMobile = useIsMobile();


  const correctSnippets = useMemo(() => {
      return level.expected_output?.match(/([a-zA-Z0-9_]+|"[^"]*"|'[^']*'|[\(\)\.,=;\[\]\{\}])/g) || [];
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

  // Bubble and Game Loop Logic
  useEffect(() => {
      if (isGameOver) return;

      const spawnBubble = () => {
          if (targetIndex >= correctSnippets.length) return;
          
          // Only spawn if there is no current target bubble
          if (bubbles.some(b => b.isTarget)) return;

          const incorrectSnippets = ['var', 'func', 'err', '=>', 'const', 'let', 'x', 'y', 'z', '123', 'error', 'null'];
          const newBubbles: Bubble[] = [];
          const targetText = correctSnippets[targetIndex];
          
          let availableLanes = [0, 1, 2, 3];
          
          // Add the target bubble
          const targetLaneIndex = Math.floor(Math.random() * availableLanes.length);
          const targetLane = availableLanes.splice(targetLaneIndex, 1)[0];
          newBubbles.push({
              id: Date.now(),
              text: targetText,
              x: targetLane,
              y: -50,
              isTarget: true,
          });

          // Add 1 distractor bubble
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
          });
          
          setBubbles(prev => [...prev, ...newBubbles]);
      };

      const gameLoop = () => {
          if (Date.now() - lastBubbleTime.current > 4000) { // Spawn every 4 seconds
              spawnBubble();
              lastBubbleTime.current = Date.now();
          }

          setBullets(prevBullets =>
              prevBullets
                  .map(bullet => ({ ...bullet, y: bullet.y - 10 }))
                  .filter(bullet => bullet.y > -20)
          );

          setBubbles(prevBubbles => {
              let newBubbles = prevBubbles
                  .map(bubble => ({ ...bubble, y: bubble.y + 0.25 })) // Slower falling speed
                  .filter(bubble => !gameAreaRef.current || bubble.y < gameAreaRef.current!.offsetHeight);

              // Collision detection
              bullets.forEach(bullet => {
                  newBubbles = newBubbles.filter(bubble => {
                      if (!gameAreaRef.current) return true;
                      const bubbleX = (lanePositions[bubble.x] / 100) * gameAreaRef.current.offsetWidth;
                      const distance = Math.sqrt(
                          Math.pow(bullet.x - bubbleX, 2) + Math.pow(bullet.y - bubble.y, 2)
                      );
                      if (distance < 40) { // Collision radius
                          if (bubble.isTarget) {
                              onCorrectBubble(bubble.text);
                              setTargetIndex(i => i + 1);
                          } else {
                              onIncorrectBubble();
                          }
                          setBullets(bs => bs.filter(b => b.id !== bullet.id)); // Remove bullet on hit
                          return false; // Remove bubble
                      }
                      return true;
                  });
              });
              return newBubbles;
          });

          requestAnimationFrame(gameLoop);
      };

      const animationFrameId = requestAnimationFrame(gameLoop);

      return () => cancelAnimationFrame(animationFrameId);
  }, [bubbles, bullets, correctSnippets.length, onCorrectBubble, onIncorrectBubble, targetIndex, isGameOver]);
  
  useEffect(() => {
    if (lives <= 0) {
      setIsGameOver(true);
    }
  }, [lives]);

  // Controls
  useEffect(() => {
    const gameArea = gameAreaRef.current;
    const rocket = rocketRef.current;
    if (!gameArea || !rocket) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = gameArea.getBoundingClientRect();
      const x = e.clientX - rect.left;
      rocket.style.transform = `translateX(${x - rocket.offsetWidth / 2}px) rotate(0deg)`;
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
  
  if (targetIndex >= correctSnippets.length && correctSnippets.length > 0) {
      return (
          <div className="w-full h-full bg-gray-900/50 rounded-lg relative overflow-hidden border border-green-500 flex flex-col items-center justify-center text-center p-4">
              <ShieldCheck className="w-24 h-24 text-green-400 mb-4" />
              <h3 className="text-2xl font-bold">Level Complete!</h3>
              <p className="text-muted-foreground mt-2">You've assembled the code. Now run it to check your solution!</p>
          </div>
      );
  }

  if (isGameOver) {
      return (
          <div className="w-full h-full bg-gray-900/50 rounded-lg relative overflow-hidden border border-red-500 flex flex-col items-center justify-center text-center p-4">
              <ShieldX className="w-24 h-24 text-red-400 mb-4" />
              <h3 className="text-2xl font-bold">Game Over</h3>
              <p className="text-muted-foreground mt-2">You've run out of lives.</p>
              <Button onClick={onRestart} className="mt-6"><RefreshCw className="mr-2"/>Try Again</Button>
          </div>
      );
  }


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
             <Button variant="outline" size="sm" onClick={onRestart}><RefreshCw className="mr-2"/> Restart</Button>
             <Button variant="destructive" size="sm" asChild>
                <Link href={`/playground/${gameSlug}`}><X className="mr-2"/> Quit</Link>
             </Button>
       </div>

      {bubbles.map(bubble => (
        <div
          key={bubble.id}
          className={cn(
              "absolute px-3 py-1 rounded-full text-white font-mono text-sm transition-transform duration-500 ease-linear",
               "bg-muted/80 backdrop-blur-sm border border-primary/20",
          )}
          style={{ 
              top: `${bubble.y}px`, 
              left: `${lanePositions[bubble.x]}%`,
              transform: `translateX(-50%)`
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
      <div ref={rocketRef} className="absolute bottom-4 h-12 w-10 will-change-transform z-10" style={{ transform: 'rotate(0deg)' }}>
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

const CodeEditor = forwardRef(({ level, onCodeChange }: { level: GameLevel, onCodeChange: (code: string) => void }, ref) => {
    const [code, setCode] = useState(level.starter_code || '');

    useImperativeHandle(ref, () => ({
        appendCode: (text: string) => {
            setCode(prev => {
                let newCode = prev;
                // Basic logic to handle spacing. A real implementation would be more complex.
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
                onCodeChange(newCode);
                return newCode;
            });
        },
        getCode: () => code,
        resetCode: () => {
          const initialCode = level.starter_code || '';
          setCode(initialCode);
          onCodeChange(initialCode);
        }
    }));

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

    const [feedback, setFeedback] = useState('');
    const [hint, setHint] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [isGettingHint, setIsGettingHint] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [runOutput, setRunOutput] = useState('');
    const [runOutputIsError, setRunOutputIsError] = useState(false);
    
    const [showConfetti, setShowConfetti] = useState(false);
    const [lives, setLives] = useState(3);
    const [currentCode, setCurrentCode] = useState('');
    const editorRef = useRef<{ appendCode: (text: string) => void, getCode: () => string, resetCode: () => void }>(null);


    const handleIncorrectBubble = useCallback(() => {
        setLives(l => Math.max(0, l - 1));
    }, []);
    
    const handleRestart = useCallback(() => {
        setLives(3);
        setFeedback('');
        setHint('');
        setIsCorrect(false);
        setRunOutput('');
        editorRef.current?.resetCode();
        // A key change in the game component would be a cleaner way to force a full reset
    }, []);

    const handleCorrectBubble = useCallback((text: string) => {
        editorRef.current?.appendCode(text);
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
                setCurrentCode(level.starter_code || '');
            }
            setLoading(false);
        };
        fetchDetails();
    }, [params, supabase, router]);
    
    const handleRunCode = async () => {
        if (!level || !editorRef.current) return;
        setIsChecking(true);
        setFeedback('');
        setHint('');
        setRunOutput('Running code...');
        setRunOutputIsError(false);

        const codeFromEditor = editorRef.current.getCode();

        const isSolutionCorrect = codeFromEditor.trim().replace(/\s+/g, ' ') === level.expected_output?.trim().replace(/\s+/g, ' ');

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
                    code: codeFromEditor,
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
        if (!level || !editorRef.current) return;
        setIsGettingHint(true);
        setHint('');
        const codeFromEditor = editorRef.current.getCode();
         try {
            const result = await provideHintForCodePractice({
                problemStatement: level.objective,
                userCode: codeFromEditor,
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
                        <div className="flex flex-col h-full">
                           <div className="flex-grow relative">
                             <CodeBubbleGame 
                               key={lives} // Force re-render on restart
                               level={level} 
                               onCorrectBubble={handleCorrectBubble} 
                               onIncorrectBubble={handleIncorrectBubble}
                               onRestart={handleRestart}
                               gameSlug={game.slug}
                               lives={lives}
                             />
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
                                        <CodeEditor ref={editorRef} level={level} onCodeChange={setCurrentCode} />
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
