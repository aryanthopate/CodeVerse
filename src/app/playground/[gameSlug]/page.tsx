
'use server';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getGameBySlug, getUserGameProgress } from '@/lib/supabase/queries';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { GameMapClient } from '@/components/game-map-client';


export default async function GameDetailPage({ params }: { params: { gameSlug: string } }) {
    const supabase = createClient();
    const game = await getGameBySlug(params.gameSlug);

    if (!game) {
        notFound();
    }
    
    const userProgress = await getUserGameProgress(game.id);
    
    return (
        <div className="flex flex-col min-h-screen bg-gray-900 text-white">
            <Header />
            <main className="flex-grow pt-16 flex flex-col">
                {/* Game Header */}
                <div className="container mx-auto py-6">
                    <div className="relative rounded-xl overflow-hidden min-h-[200px] flex items-center justify-center p-8 bg-gray-800/50 border border-primary/20">
                         <Image
                            src={game.thumbnail_url || `https://picsum.photos/seed/${game.id}/1200/400`}
                            alt={game.title}
                            fill
                            className="object-cover -z-10 opacity-10 blur-sm"
                            data-ai-hint="dark neon abstract"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent -z-10"></div>
                        <div className="text-center space-y-2 z-10">
                            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{game.title}</h1>
                            <p className="text-md max-w-3xl mx-auto text-gray-300">{game.description}</p>
                        </div>
                    </div>
                </div>

                {/* Levels Map */}
                <GameMapClient game={game} userProgress={userProgress} />

            </main>
            <Footer />
        </div>
    );
}

