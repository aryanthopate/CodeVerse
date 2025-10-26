
'use client';

import { useState } from 'react';
import { PlayCircle, Youtube } from 'lucide-react';
import { Topic } from '@/lib/types';
import Image from 'next/image';

export function VideoPlayer({ topic }: { topic: Topic }) {
    const [showVideo, setShowVideo] = useState(false);

    if (!topic.video_url) {
        return (
            <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
                <p className="text-muted-foreground">No video available for this topic.</p>
            </div>
        );
    }

    const isYoutube = topic.video_url.includes('youtube.com') || topic.video_url.includes('youtu.be');
    
    let embedUrl = '';
    if (isYoutube) {
        try {
            const url = new URL(topic.video_url);
            let videoId = url.hostname === 'youtu.be' ? url.pathname.substring(1) : url.searchParams.get('v');
            if (videoId) {
                embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1&rel=0`;
            }
        } catch (e) {
            console.error("Invalid YouTube URL:", e);
        }
    } else {
        // Assume it's a direct Supabase or other video URL
        embedUrl = topic.video_url;
    }

    if (!showVideo) {
        return (
            <div 
                className="aspect-video bg-muted rounded-xl flex items-center justify-center cursor-pointer group relative overflow-hidden"
                onClick={() => setShowVideo(true)}
            >
                <div className="absolute inset-0 bg-black/50 z-10"></div>
                <Image 
                    src={`https://img.youtube.com/vi/${embedUrl.split('/').pop()?.split('?')[0]}/maxresdefault.jpg`}
                    alt={topic.title}
                    fill
                    className="object-cover"
                    unoptimized
                />
                <PlayCircle className="w-20 h-20 text-white/80 z-20 transition-all duration-300 group-hover:scale-110 group-hover:text-white" />
                {isYoutube && <Youtube className="absolute top-4 right-4 text-white/70 z-20" />}
            </div>
        );
    }

    return (
        <div className="aspect-video bg-black rounded-xl overflow-hidden">
             {embedUrl ? (
                isYoutube ? (
                    <iframe
                        className="w-full h-full"
                        src={embedUrl}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    ></iframe>
                ) : (
                     <video
                        className="w-full h-full"
                        controls
                        autoPlay
                        src={embedUrl}
                        controlsList="nodownload"
                    >
                        Your browser does not support the video tag.
                    </video>
                )
             ) : (
                <div className="w-full h-full flex items-center justify-center text-destructive-foreground">Invalid video URL provided.</div>
             )}
        </div>
    );
}
