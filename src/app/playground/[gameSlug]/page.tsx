

'use server';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getGameBySlug } from '@/lib/supabase/queries';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Check, Lock, Play, Star, Swords, ShieldCheck, Crown } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import React from 'react';


// Helper function to generate SVG path data and level positions
const generateLevelMap = (levelCount: number) => {
    const levels = [];
    let pathData = "M 150 150";
    let x = 150, y = 150;
    const segmentLength = 200;

    for (let i = 0; i < levelCount; i++) {
        levels.push({ id: i, x, y });

        if (i < levelCount - 1) {
            const direction = Math.floor(i / 2) % 2 === 0 ? 1 : -1;
            const nextX = x + segmentLength;
            const nextY = y + direction * (i % 2 === 0 ? 0 : segmentLength);
            
            const cp1x = x + segmentLength / 2;
            const cp1y = y;
            const cp2x = nextX - segmentLength / 2;
            const cp2y = nextY;

            pathData += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${nextX},${nextY}`;
            x = nextX;
            y = nextY;
        }
    }
    const width = levelCount * segmentLength;
    return { levels, pathData, width };
};


export default async function GameDetailPage({ params }: { params: { gameSlug: string } }) {
    const game = await getGameBySlug(params.gameSlug);

    if (!game) {
        notFound();
    }
    
    const allLevels = game.game_chapters.flatMap(chapter => chapter.game_levels);
    const { levels: levelPositions, pathData, width } = generateLevelMap(allLevels.length);

    // This is a placeholder for user progress. In a real app, you'd fetch this.
    const userProgress = {
        completed_levels: [], // e.g. ['level_id_1', 'level_id_2']
    };
    
    let currentLevelIndex = allLevels.findIndex(l => !userProgress.completed_levels.includes(l.id as never));
    if (currentLevelIndex === -1) currentLevelIndex = allLevels.length; // All completed

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-grow pt-16 flex flex-col">
                {/* Game Header */}
                <div className="container mx-auto py-6">
                    <div className="relative rounded-xl overflow-hidden min-h-[200px] flex items-center justify-center p-8 border border-border/50">
                         <Image
                            src={game.thumbnail_url || `https://picsum.photos/seed/${game.id}/1200/400`}
                            alt={game.title}
                            fill
                            className="object-cover -z-10 opacity-30"
                            data-ai-hint="dark neon abstract"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/40 -z-10"></div>
                        <div className="text-center text-white space-y-2 z-10">
                            <h1 className="text-4xl font-bold">{game.title}</h1>
                            <p className="text-md max-w-3xl mx-auto text-white/80">{game.description}</p>
                        </div>
                    </div>
                </div>

                {/* Levels Map */}
                <div className="flex-grow w-full overflow-x-auto overflow-y-hidden relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-30 pointer-events-none group-hover:opacity-50 transition-opacity"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-30 pointer-events-none group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative w-full h-full flex items-center" style={{ minWidth: `${width}px`, minHeight: '400px' }}>
                        <svg width={width} height="400" className="absolute top-0 left-0">
                            <path 
                                d={pathData} 
                                fill="none" 
                                stroke="hsl(var(--muted))" 
                                strokeWidth="8" 
                                strokeLinecap="round"
                            />
                             <path 
                                d={pathData} 
                                fill="none" 
                                stroke="url(#line-gradient)" 
                                strokeWidth="8" 
                                strokeLinecap="round"
                                className="path-animation"
                            />
                             <defs>
                                <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                                    <stop offset="100%" stopColor="hsl(var(--accent))" />
                                </linearGradient>
                            </defs>
                            <style>{`
                                .path-animation {
                                    stroke-dasharray: 10000;
                                    stroke-dashoffset: 10000;
                                    animation: draw-path 5s linear forwards;
                                }
                                @keyframes draw-path {
                                    to {
                                        stroke-dashoffset: 0;
                                    }
                                }
                                .level-node-glow {
                                    box-shadow: 0 0 15px hsl(var(--primary)), 0 0 30px hsl(var(--primary) / 0.7);
                                }
                            `}</style>
                        </svg>

                        {allLevels.map((level, index) => {
                            const position = levelPositions[index];
                            if (!position) return null;

                            const isCompleted = userProgress.completed_levels.includes(level.id as never);
                            const isCurrent = index === currentLevelIndex;
                            const isLocked = index > currentLevelIndex;
                            
                            const chapterForLevel = game.game_chapters.find(c => c.game_levels.some(l => l.id === level.id));
                            const isFirstLevelOfChapter = chapterForLevel?.game_levels[0]?.id === level.id;
                            const isLastLevelOfChapter = chapterForLevel?.game_levels[chapterForLevel.game_levels.length - 1]?.id === level.id;


                            return (
                                <React.Fragment key={level.id}>
                                    {isFirstLevelOfChapter && index > 0 && (
                                        <div style={{ left: `${position.x - 100}px`, top: '50%', transform: 'translateY(-50%)' }} className="absolute flex flex-col items-center z-10">
                                            <div className="h-24 w-1 bg-gradient-to-b from-transparent via-primary/50 to-transparent rounded-full"></div>
                                            <div className="p-2 bg-primary/20 border border-primary rounded-full my-2">
                                                <Swords className="text-primary"/>
                                            </div>
                                            <p className="text-xs text-primary font-bold w-32 text-center">{chapterForLevel?.title}</p>
                                            <div className="h-24 w-1 bg-gradient-to-t from-transparent via-primary/50 to-transparent rounded-full"></div>
                                        </div>
                                    )}
                                    <Link
                                        href={isLocked ? '#' : `/playground/${game.slug}/${level.slug}`}
                                        className={cn(
                                            "absolute w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 z-20",
                                            "border-4",
                                            isCurrent ? "border-primary scale-110 level-node-glow bg-primary/20" : "border-border/50 bg-card",
                                            isCompleted ? "border-green-500 bg-green-500/10" : "",
                                            isLocked ? "border-muted-foreground/30 bg-muted/50 cursor-not-allowed opacity-60" : "cursor-pointer hover:scale-110 hover:border-primary",
                                        )}
                                        style={{ left: `${position.x - 48}px`, top: `${position.y - 48}px` }}
                                    >
                                        <div className="w-10 h-10 flex items-center justify-center">
                                        {isLocked ? <Lock className="w-8 h-8 text-muted-foreground" /> :
                                         isCompleted ? <ShieldCheck className="w-8 h-8 text-green-400 fill-green-500/20" /> :
                                         isLastLevelOfChapter ? <Crown className="w-8 h-8 text-yellow-400" /> :
                                         <Play className="w-8 h-8 text-primary" />
                                        }
                                        </div>
                                        <p className="text-xs font-bold mt-1 text-center truncate w-full px-1">{level.title}</p>
                                    </Link>
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

