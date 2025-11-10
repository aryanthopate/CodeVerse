
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

const GRID_WIDTH = 25;
const GRID_HEIGHT = 20;

export const AnimatedGridBackground = () => {
    return (
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
            <div className="grid grid-cols-25 w-full h-full">
                {Array.from({ length: GRID_WIDTH * GRID_HEIGHT }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "w-full h-full border-r border-b border-neutral-900 bg-black/0 transition-colors",
                            "hover:bg-[#2A2B57] hover:duration-100"
                        )}
                    />
                ))}
            </div>
        </div>
    );
};
