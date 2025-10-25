

'use client';

import Link from 'next/link';
import { Check, Lock, Play, Crown, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';
import type { GameWithChaptersAndLevels, UserGameProgress } from '@/lib/types';

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
        
        // Add a gate before each chapter
        const gateX = x - segmentLength / 2;
        levels.push({ type: 'gate', chapterTitle: chapter.title, x: gateX, y: y_center });

        for (let j = 0; j < chapter.game_levels.length; j++) {
            const level = chapter.game_levels[j];
            
            const currentY = y_center + (levelIndex % 2 === 0 ? 0 : (Math.floor(levelIndex / 2) % 2 === 0 ? -verticalMovement : verticalMovement));
            
            levels.push({ type: 'level', ...level, x, y: currentY });

            const prevItem = levels[levels.length - 2];
            const prevX = prevItem.x;
            const prevY = prevItem.y;

            const cp1x = prevX + segmentLength * 0.6;
            const cp1y = prevY;
            const cp2x = x - segmentLength * 0.6;
            const cp2y = currentY;

            pathData += ` M ${prevX},${prevY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x},${currentY}`;
            
            x += segmentLength;
            levelIndex++;
        }
    }
    
    const width = x + 100;
    return { levels, pathData, width };
};

export function GameMapClient({ game, userProgress }: { game: GameWithChaptersAndLevels, userProgress: UserGameProgress[] | null }) {
    const { levels: levelPositions, pathData, width } = generateLevelMap(game.game_chapters);
    const completedLevelIds = userProgress?.map(p => p.completed_level_id) || [];
    
    const allLevelsFlat = game.game_chapters.flatMap(c => c.game_levels);
    let currentLevelIndex = allLevelsFlat.findIndex(l => !completedLevelIds.includes(l.id));
    if (currentLevelIndex === -1 && allLevelsFlat.length > 0) {
        currentLevelIndex = allLevelsFlat.length;
    }

    return (
        <div className="flex-grow w-full overflow-x-auto overflow-y-hidden relative group py-12 bg-gradient-to-b from-gray-900 to-black">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse"></div>
            <div className="absolute inset-0 bg-grid-white/[0.02] animate-grid-pan"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-transparent to-gray-900 z-10 pointer-events-none w-[200%]"></div>
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-gray-900 to-transparent z-10 pointer-events-none"></div>

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
                                <div className="w-16 h-16 rounded-full bg-gray-800 border-4 border-dashed border-primary/50 flex items-center justify-center font-bold text-lg">{index + 1}</div>
                                <p className="text-xs font-bold w-48 text-center mt-2 tracking-widest uppercase text-primary/80">{item.chapterTitle}</p>
                            </div>
                        )
                   }
                   
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
                                isCurrent && "border-primary scale-110 shadow-primary/30 animate-pulse",
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
    );
}
