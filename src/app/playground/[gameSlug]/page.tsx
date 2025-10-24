

'use server';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getGameBySlug, getUserGameProgress } from '@/lib/supabase/queries';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Check, Lock, Play, Star, Swords, ShieldCheck, Crown, Gate } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import React from 'react';
import { createClient } from '@/lib/supabase/server';


// Helper function to generate SVG path data and level positions
const generateLevelMap = (chapters: any[]) => {
    const levels = [];
    let pathData = "";
    let x = 150;
    const y_center = 200;
    const segmentLength = 250;
    const verticalMovement = 100;
    let levelIndex = 0;

    for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        
        // Add a gate before each chapter except the first one
        if (i > 0) {
            const gateX = x - segmentLength / 2;
            levels.push({ type: 'gate', chapterTitle: chapter.title, x: gateX, y: y_center });
        }

        for (let j = 0; j < chapter.game_levels.length; j++) {
            const level = chapter.game_levels[j];
            
            const currentY = y_center + (levelIndex % 2 === 0 ? 0 : (Math.floor(levelIndex / 2) % 2 === 0 ? -verticalMovement : verticalMovement));
            
            levels.push({ type: 'level', ...level, x, y: currentY });

            if (levelIndex > 0) {
                const prevLevel = levels[levels.length - 2].type === 'gate' ? levels[levels.length - 3] : levels[levels.length - 2];
                const prevX = prevLevel.x;
                const prevY = prevLevel.y;

                const cp1x = prevX + segmentLength * 0.6;
                const cp1y = prevY;
                const cp2x = x - segmentLength * 0.6;
                const cp2y = currentY;

                pathData += ` M ${prevX},${prevY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x},${currentY}`;
            } else {
                 pathData = `M ${x},${currentY}`;
            }

            x += segmentLength;
            levelIndex++;
        }
    }
    
    const width = x + 100;
    return { levels, pathData, width };
};


export default async function GameDetailPage({ params }: { params: { gameSlug: string } }) {
    const supabase = createClient();
    const game = await getGameBySlug(params.gameSlug);

    if (!game) {
        notFound();
    }
    
    const { levels: levelPositions, pathData, width } = generateLevelMap(game.game_chapters);

    const userProgress = await getUserGameProgress(game.id);
    const completedLevelIds = userProgress?.map(p => p.level_id) || [];
    
    const allLevelsFlat = game.game_chapters.flatMap(c => c.game_levels);
    let currentLevelIndex = allLevelsFlat.findIndex(l => !completedLevelIds.includes(l.id));
    if (currentLevelIndex === -1 && allLevelsFlat.length > 0) {
        currentLevelIndex = allLevelsFlat.length;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-900 text-white">
            <Header />
            <main className="flex-grow pt-16 flex flex-col">
                {/* Game Header */}
                <div className="container mx-auto py-6">
                    <div className="relative rounded-xl overflow-hidden min-h-[200px] flex items-center justify-center p-8 bg-gray-800/50 border border-primary/20">
                         <Image
                            src={game.thumbnail_url || `https://picsum.photos/seed/${game.id}/1200/400`}
                            alt={game.title}
                            fill
                            className="object-cover -z-10 opacity-10 blur-sm"
                            data-ai-hint="dark neon abstract"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent -z-10"></div>
                        <div className="text-center space-y-2 z-10">
                            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{game.title}</h1>
                            <p className="text-md max-w-3xl mx-auto text-gray-300">{game.description}</p>
                        </div>
                    </div>
                </div>

                {/* Levels Map */}
                <div className="flex-grow w-full overflow-x-auto overflow-y-hidden relative group py-12">
                    <div className="absolute inset-0 bg-grid-white/[0.02] animate-grid-pan"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-transparent to-gray-900 z-10 pointer-events-none"></div>

                    <div className="relative w-full h-full flex items-center" style={{ minWidth: `${width}px`, minHeight: '400px' }}>
                        <svg width={width} height="400" className="absolute top-1/2 -translate-y-1/2 left-0 h-full">
                            <path 
                                d={pathData} 
                                fill="none" 
                                stroke="hsl(var(--muted) / 0.3)" 
                                strokeWidth="6" 
                                strokeLinecap="round"
                                strokeDasharray="10 10"
                            />
                        </svg>

                        {levelPositions.map((item, index) => {
                           if (item.type === 'gate') {
                                return (
                                    <div key={`gate-${index}`} style={{ left: `${item.x}px`, top: `50%`, transform: 'translate(-50%, -50%)' }} className="absolute flex flex-col items-center z-10 text-primary">
                                        <Gate className="w-16 h-16 opacity-50" />
                                        <p className="text-xs font-bold w-32 text-center mt-2 tracking-widest uppercase">{item.chapterTitle}</p>
                                    </div>
                                )
                           }
                           
                           // It's a level
                           const level = item;
                           const levelIndex = allLevelsFlat.findIndex(l => l.id === level.id);
                           const isCompleted = completedLevelIds.includes(level.id);
                           const isCurrent = levelIndex === currentLevelIndex;
                           const isLocked = levelIndex > currentLevelIndex;
                           const chapterForLevel = game.game_chapters.find(c => c.game_levels.some(l => l.id === level.id));
                           const isLastLevelOfChapter = chapterForLevel?.game_levels[chapterForLevel.game_levels.length - 1]?.id === level.id;

                           return (
                                <Link
                                    key={level.id}
                                    href={isLocked ? '#' : `/playground/${game.slug}/${level.slug}`}
                                    className={cn(
                                        "absolute w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 z-20 group/level",
                                        "border-4 bg-gray-800 shadow-lg",
                                        isCurrent && "border-primary scale-110 shadow-primary/30 animate-glow-pulse",
                                        isCompleted ? "border-green-500 bg-green-900/50 shadow-green-500/20" : "border-gray-700",
                                        isLocked ? "border-gray-800 bg-gray-900/80 cursor-not-allowed opacity-60" : "cursor-pointer hover:scale-110 hover:border-primary",
                                    )}
                                    style={{ left: `${level.x - 56}px`, top: `${level.y - 56}px` }}
                                >
                                    <div className="w-10 h-10 flex items-center justify-center mb-1">
                                    {isLocked ? <Lock className="w-8 h-8 text-gray-500" /> :
                                     isCompleted ? <ShieldCheck className="w-8 h-8 text-green-400" /> :
                                     isCurrent ? <Play className="w-8 h-8 text-primary fill-primary/30" /> :
                                     isLastLevelOfChapter ? <Crown className="w-8 h-8 text-yellow-400" /> :
                                     <Play className="w-8 h-8 text-gray-400 group-hover/level:text-primary" />
                                    }
                                    </div>
                                    <p className="text-xs font-bold text-center truncate w-full px-1 text-gray-300 group-hover/level:text-white">{level.title}</p>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
