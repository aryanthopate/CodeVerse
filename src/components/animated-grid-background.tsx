
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

const GRID_WIDTH = 25;
const GRID_HEIGHT = 20;

export const AnimatedGridBackground = () => {
    return (
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
            <div 
                className="absolute inset-0 w-full h-full"
                style={{
                    backgroundColor: 'hsl(var(--hp-background))',
                    backgroundImage: `
                        linear-gradient(hsl(var(--hp-grid)) 1px, transparent 1px),
                        linear-gradient(to right, hsl(var(--hp-grid)) 1px, transparent 1px)
                    `,
                    backgroundSize: '3rem 3rem',
                    animation: 'pan-grid 15s linear infinite',
                }}
            />
        </div>
    );
};
