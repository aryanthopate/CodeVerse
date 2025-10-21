
'use server';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getGameById } from '@/lib/supabase/queries';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Check, Lock, Play, Star, Swords } from 'lucide-react';
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


export default async function GameDetailPage({ params }: { params: { gameId: string } }) {
    const game = await getGameById(params.gameId);

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
                         <div className="absolute inset-0 bg-black/70 -z-10"></div>
                        <div className="text-center text-white space-y-2 z-10">
                            <h1 className="text-4xl font-bold">{game.title}</h1>
                            <p className="text-md max-w-3xl mx-auto text-white/80">{game.description}</p>
                        </div>
                    </div>
                </div>

                {/* Levels Map */}
                <div className="flex-grow w-full overflow-x-auto overflow-y-hidden">
                    <div className="relative w-full h-full flex items-center" style={{ minWidth: `${width}px`, minHeight: '400px' }}>
                        <svg width={width} height="400" className="absolute top-0 left-0">
                            <path 
                                d={pathData} 
                                fill="none" 
                                stroke="hsl(var(--primary) / 0.2)" 
                                strokeWidth="10" 
                                strokeLinecap="round"
                            />
                             <path 
                                d={pathData} 
                                fill="none" 
                                stroke="url(#line-gradient)" 
                                strokeWidth="10" 
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
                                    animation: draw 3s linear forwards;
                                }
                                @keyframes draw {
                                    to {
                                        stroke-dashoffset: 0;
                                    }
                                }
                            `}</style>
                        </svg>

                        {allLevels.map((level, index) => {
                            const position = levelPositions[index];
                            if (!position) return null;

                            const isCompleted = userProgress.completed_levels.includes(level.id as never);
                            const isCurrent = index === currentLevelIndex;
                            const isLocked = index > currentLevelIndex;
                            
                            // Find which chapter this level belongs to
                            const chapterForLevel = game.game_chapters.find(c => c.game_levels.some(l => l.id === level.id));
                            const isFirstLevelOfChapter = chapterForLevel?.game_levels[0]?.id === level.id;


                            return (
                                <React.Fragment key={level.id}>
                                    {isFirstLevelOfChapter && index > 0 && (
                                        <div style={{ left: `${position.x - 100}px`, top: '50%', transform: 'translateY(-50%)' }} className="absolute flex flex-col items-center z-10">
                                            <div className="h-24 w-1 bg-primary/50 rounded-full"></div>
                                            <div className="p-2 bg-primary/20 border border-primary rounded-full my-2">
                                                <Swords className="text-primary"/>
                                            </div>
                                            <p className="text-xs text-primary font-bold w-32 text-center">{chapterForLevel?.title}</p>
                                            <div className="h-24 w-1 bg-primary/50 rounded-full"></div>
                                        </div>
                                    )}
                                    <Link
                                        href={isLocked ? '#' : `/playground/${game.id}/${level.id}`}
                                        className={cn(
                                            "absolute w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 z-20",
                                            "border-4 hover:border-primary",
                                            isCurrent ? "border-primary scale-110 animate-pulse bg-primary/20" : "border-border/50 bg-card",
                                            isCompleted ? "border-green-500" : "",
                                            isLocked ? "border-muted-foreground/30 bg-muted/50 cursor-not-allowed" : "cursor-pointer hover:scale-110"
                                        )}
                                        style={{ left: `${position.x - 48}px`, top: `${position.y - 48}px` }}
                                    >
                                        {isLocked ? <Lock className="w-8 h-8 text-muted-foreground" /> :
                                        isCompleted ? <Check className="w-8 h-8 text-green-500" /> :
                                        <Play className="w-8 h-8 text-primary" />
                                        }
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
