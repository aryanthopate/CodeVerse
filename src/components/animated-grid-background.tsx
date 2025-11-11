
'use client';

import React from 'react';

export function GridAndBoxesBackground() {
    const boxes = Array.from({ length: 30 });
    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-hp-background-deep">
            <div className="absolute inset-0 bg-grid-zinc-700/20 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]"></div>
            <div className="absolute inset-0 h-full w-full">
                {boxes.map((_, i) => (
                    <div
                        key={i}
                        className="box absolute bg-gradient-to-br from-indigo-500/20 to-blue-700/10"
                        style={{
                            '--top': `${Math.random() * 100}%`,
                            '--left': `${Math.random() * 100}%`,
                            '--size': `${Math.random() * 8 + 2}rem`,
                            '--delay': `${Math.random() * 10}s`,
                            '--duration': `${Math.random() * 10 + 10}s`,
                        } as React.CSSProperties}
                    ></div>
                ))}
            </div>
            <div className="absolute inset-0 z-10 bg-gradient-to-b from-hp-background-deep/0 via-hp-background-deep to-hp-background-deep"></div>
        </div>
    );
}
