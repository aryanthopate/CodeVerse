
'use client';

import React, { useState, useEffect } from 'react';

interface Box {
    top: string;
    left: string;
    size: string;
    delay: string;
    duration: string;
}

export function AnimatedGridBackground() {
    const [boxes, setBoxes] = useState<Box[]>([]);

    useEffect(() => {
        const generateBoxes = () => {
            return Array.from({ length: 30 }).map(() => ({
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                size: `${Math.random() * 8 + 2}rem`,
                delay: `${Math.random() * 10}s`,
                duration: `${Math.random() * 10 + 10}s`,
            }));
        };
        setBoxes(generateBoxes());
    }, []);


    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-hp-background-deep">
            <div className="absolute inset-0 bg-grid-zinc-700/20 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]"></div>
            <div className="absolute inset-0 h-full w-full">
                {boxes.map((box, i) => (
                    <div
                        key={i}
                        className="box absolute bg-gradient-to-br from-indigo-500/20 to-blue-700/10"
                        style={{
                            '--top': box.top,
                            '--left': box.left,
                            '--size': box.size,
                            '--delay': box.delay,
                            '--duration': box.duration,
                        } as React.CSSProperties}
                    ></div>
                ))}
            </div>
            <div className="absolute inset-0 z-10 bg-gradient-to-b from-hp-background-deep/0 via-hp-background-deep to-hp-background-deep"></div>
        </div>
    );
}
