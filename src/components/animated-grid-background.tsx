
'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const GRID_WIDTH = 25;
const GRID_HEIGHT = 20;

export const AnimatedGridBackground = () => {
    const [grid, setGrid] = useState<boolean[][]>([]);

    useEffect(() => {
        // Initialize grid
        const initialGrid = Array(GRID_HEIGHT).fill(null).map(() => 
            Array(GRID_WIDTH).fill(false)
        );
        setGrid(initialGrid);

        const interval = setInterval(() => {
            setGrid(prevGrid => {
                const newGrid = prevGrid.map(row => [...row]);
                const x = Math.floor(Math.random() * GRID_WIDTH);
                const y = Math.floor(Math.random() * GRID_HEIGHT);
                newGrid[y][x] = !newGrid[y][x];
                return newGrid;
            });
        }, 200);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
            <div className="grid grid-cols-25 w-full h-full">
                {grid.flat().map((isLit, i) => (
                    <div
                        key={i}
                        className={cn(
                            "w-full h-full border-r border-b border-neutral-900 transition-colors duration-500",
                            "hover:bg-[#2A2B57]", // Add hover effect
                            isLit ? "bg-[#2A2B57]" : "bg-transparent"
                        )}
                    />
                ))}
            </div>
        </div>
    );
};
