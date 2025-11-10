
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

const GRID_WIDTH = 25;
const GRID_HEIGHT = 20;

export const AnimatedGridBackground = () => {
    const [glowingSquares, setGlowingSquares] = useState<Set<number>>(new Set());
    const timeouts = useRef<Map<number, NodeJS.Timeout>>(new Map());

    const handleMouseEnter = (index: number) => {
        // Clear any pending fade-out for this square
        if (timeouts.current.has(index)) {
            clearTimeout(timeouts.current.get(index));
            timeouts.current.delete(index);
        }

        setGlowingSquares(prev => {
            const newSet = new Set(prev);
            newSet.add(index);
            return newSet;
        });
    };

    const handleMouseLeave = (index: number) => {
        const timeoutId = setTimeout(() => {
            setGlowingSquares(prev => {
                const newSet = new Set(prev);
                newSet.delete(index);
                return newSet;
            });
            timeouts.current.delete(index);
        }, 1000); // 1-second delay before fading out

        timeouts.current.set(index, timeoutId);
    };
    
    // Cleanup timeouts on component unmount
    useEffect(() => {
        return () => {
            timeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
        };
    }, []);

    return (
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
            <div className="grid grid-cols-25 w-full h-full">
                {Array.from({ length: GRID_WIDTH * GRID_HEIGHT }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "w-full h-full border-r border-b border-neutral-900 bg-black/0 transition-colors duration-500",
                            glowingSquares.has(i) ? "bg-[#2A2B57]" : "bg-black/0"
                        )}
                        onMouseEnter={() => handleMouseEnter(i)}
                        onMouseLeave={() => handleMouseLeave(i)}
                    />
                ))}
            </div>
        </div>
    );
};
