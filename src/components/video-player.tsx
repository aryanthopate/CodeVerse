
'use client';

import { useState } from 'react';
import { PlayCircle, Youtube } from 'lucide-react';
import { Topic } from '@/lib/types';

export function VideoPlayer({ topic }: { topic: Topic }) {
    const [showVideo, setShowVideo] = useState(false);

    if (!topic.video_url) {
        return (
            <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
                <p className="text-muted-foreground">No video available for this topic.</p>
            </div>
        );
    }

    const isYoutubeVideo = topic.video_url.includes('youtube.com') || topic.video_url.includes('youtu.be');

    let embedUrl = '';
    if (isYoutubeVideo) {
        let videoId = '';
        try {
             if (topic.video_url.includes('youtu.be')) {
                videoId = new URL(topic.video_url).pathname.substring(1);
            } else {
                videoId = new URL(topic.video_url).searchParams.get('v') || '';
            }
            if (videoId) {
                embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
            }
        } catch (e) {
            console.error("Invalid URL:", e);
        }
    } else {
        embedUrl = topic.video_url;
    }


    if (!showVideo) {
        return (
            <div 
                className="aspect-video bg-muted rounded-xl flex items-center justify-center cursor-pointer group relative overflow-hidden"
                onClick={() => embedUrl && setShowVideo(true)}
            >
                <div className="absolute inset-0 bg-black/50 z-10"></div>
                <PlayCircle className="w-16 h-16 text-white z-20 transition-transform duration-300 group-hover:scale-110" />
                {isYoutubeVideo && <Youtube className="absolute top-4 right-4 text-white/70 z-20" />}
            </div>
        );
    }

    if (!embedUrl) {
         return (
            <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
                <p className="text-destructive-foreground">Could not load video. Invalid URL.</p>
            </div>
        );
    }

    return (
        <div className="aspect-video bg-black rounded-xl overflow-hidden">
            <iframe
                className="w-full h-full"
                src={embedUrl}
                title="Video lesson player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
            ></iframe>
        </div>
    );
}
