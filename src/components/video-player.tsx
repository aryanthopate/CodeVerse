
'use client';

import { useState } from 'react';
import { PlayCircle, Youtube } from 'lucide-react';
import { Topic } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

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
    
    let videoSrc = topic.video_url;
    let embedUrl = '';

    if (isYoutube) {
        try {
            const url = new URL(topic.video_url);
            let videoId = url.hostname === 'youtu.be' ? url.pathname.substring(1) : url.searchParams.get('v');
            if (videoId) {
                embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
            }
        } catch (e) {
            console.error("Invalid YouTube URL:", e);
        }
    } else {
        // This is a Supabase URL, which might not be the public one.
        // We will assume it is and the policies are correct for direct playback.
        // The component does not have enough context to rebuild the public URL if it's just a path.
        videoSrc = topic.video_url;
    }

    if (!showVideo) {
        return (
            <div 
                className="aspect-video bg-muted rounded-xl flex items-center justify-center cursor-pointer group relative overflow-hidden"
                onClick={() => setShowVideo(true)}
            >
                <div className="absolute inset-0 bg-black/50 z-10"></div>
                <PlayCircle className="w-16 h-16 text-white z-20 transition-transform duration-300 group-hover:scale-110" />
                {isYoutube && <Youtube className="absolute top-4 right-4 text-white/70 z-20" />}
            </div>
        );
    }

    if (isYoutube) {
        return (
            <div className="aspect-video bg-black rounded-xl overflow-hidden">
                 {embedUrl ? (
                    <iframe
                        className="w-full h-full"
                        src={embedUrl}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    ></iframe>
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-destructive-foreground">Invalid YouTube URL.</div>
                 )}
            </div>
        );
    }

    // Default to HTML5 video player for direct links (e.g., Supabase Storage)
    return (
        <div className="aspect-video bg-black rounded-xl overflow-hidden">
            <video
                className="w-full h-full"
                controls
                autoPlay
                src={videoSrc}
            >
                Your browser does not support the video tag.
            </video>
        </div>
    );
}
