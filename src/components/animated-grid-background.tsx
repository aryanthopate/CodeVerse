
'use client';

import React from 'react';

export const AnimatedGridBackground = () => {
    return (
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden dark-grid-background">
            <div 
                className="absolute inset-0 w-full h-full"
                style={{
                    animation: 'pan-grid 15s linear infinite',
                }}
            />
            <div className="absolute inset-0 z-10 bg-gradient-to-b from-hp-background-deep/0 via-hp-background-deep/80 to-hp-background-deep"></div>
        </div>
    );
};
