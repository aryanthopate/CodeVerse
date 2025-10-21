
'use server';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getGameById } from '@/lib/supabase/queries';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { CheckCircle, Lock, PlayCircle, Star, Swords } from 'lucide-react';
import Link from 'next/link';

export default async function GameDetailPage({ params }: { params: { gameId: string } }) {
    const game = await getGameById(params.gameId);

    if (!game) {
        notFound();
    }

    // This is a placeholder for user progress. In a real app, you'd fetch this.
    const userProgress = {
        completed_levels: [],
    };

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-grow pt-24 pb-12">
                <div className="container mx-auto">
                    {/* Game Header */}
                    <div className="relative rounded-xl overflow-hidden min-h-[300px] flex items-center justify-center p-8">
                        <Image
                            src={game.thumbnail_url || `https://picsum.photos/seed/${game.id}/1200/400`}
                            alt={game.title}
                            fill
                            className="object-cover -z-10"
                            data-ai-hint="dark neon abstract"
                        />
                         <div className="absolute inset-0 bg-black/70 -z-10"></div>
                        <div className="text-center text-white space-y-4">
                            <h1 className="text-5xl font-bold">{game.title}</h1>
                            <p className="text-lg max-w-3xl mx-auto text-white/80">{game.description}</p>
                            <div className="flex justify-center gap-4">
                                {game.is_free ? (
                                    <Button size="lg" asChild>
                                        <Link href={`/playground/${game.id}/${game.game_levels[0]?.id}`}>
                                            Start Playing <PlayCircle className="ml-2"/>
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button size="lg">Unlock Game</Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Levels List */}
                    <div className="mt-12">
                        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3"><Swords className="text-primary"/> Levels</h2>
                        <div className="space-y-4">
                            {game.game_levels.map((level, index) => {
                                const isCompleted = userProgress.completed_levels.includes(level.id as never);
                                const isLocked = !game.is_free; // Placeholder logic for locked levels
                                
                                return (
                                <Link key={level.id} href={isLocked ? '#' : `/playground/${game.id}/${level.id}`}>
                                    <div className="bg-card/50 border border-border/50 rounded-lg p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-full flex items-center justify-center text-xl font-bold text-primary">
                                            {index + 1}
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="text-lg font-semibold">{level.title}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-1">{level.objective}</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-yellow-400 font-semibold">
                                            <Star className="w-4 h-4" /> {level.reward_xp} XP
                                        </div>
                                        <div className="w-24 text-right">
                                             {isCompleted ? (
                                                <CheckCircle className="w-8 h-8 text-green-500" />
                                            ) : isLocked ? (
                                                <Lock className="w-8 h-8 text-muted-foreground" />
                                            ) : (
                                                <PlayCircle className="w-8 h-8 text-primary opacity-50 group-hover:opacity-100" />
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            )})}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
