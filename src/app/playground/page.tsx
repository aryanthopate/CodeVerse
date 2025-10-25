

'use server';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gamepad2, ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';
import { getAllGames } from '@/lib/supabase/queries';
import type { GameWithChaptersAndLevels } from '@/lib/types';
import Image from 'next/image';

export default async function PlaygroundPage() {
    const games: GameWithChaptersAndLevels[] = await getAllGames() || [];

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-grow pt-24 pb-12">
                <div className="container mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-5xl md:text-6xl font-bold font-headline bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary bg-[200%_auto] animate-gradient-x">
                            The Playground
                        </h1>
                        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                            Learn by doing. Solve interactive coding challenges, earn XP, and level up your skills in a fun, game-like environment.
                        </p>
                    </div>

                    {games.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                           {games.map(game => {
                                const totalLevels = game.game_chapters.reduce((acc, ch) => acc + ch.game_levels.length, 0);
                                return (
                               <Card key={game.id} className="bg-card/50 border-border/50 backdrop-blur-sm h-full flex flex-col transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20 overflow-hidden group">
                                    <CardHeader className="p-0 relative">
                                        <Link href={`/playground/${game.slug}`} className="block">
                                            <Image 
                                                src={game.thumbnail_url || `https://picsum.photos/seed/${game.id}/600/400`} 
                                                alt={game.title} 
                                                width={600} 
                                                height={400} 
                                                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                                                data-ai-hint="abstract game design"
                                            />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <div className="text-white font-semibold flex items-center gap-2">
                                                    View Game Map <ArrowRight className="h-4 w-4"/>
                                                </div>
                                            </div>
                                        </Link>
                                    </CardHeader>
                                    <CardContent className="p-6 flex-grow flex flex-col">
                                        <CardTitle className="text-xl font-bold mb-2">
                                            <Link href={`/playground/${game.slug}`} className="hover:text-primary">{game.title}</Link>
                                        </CardTitle>
                                        <CardDescription className="text-sm flex-grow">
                                            {game.description}
                                        </CardDescription>
                                        <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                                            <span>{totalLevels} Levels</span>
                                            {game.is_free ? (
                                                <span className="font-bold text-primary">Free</span>
                                            ) : (
                                                <span className="font-bold text-yellow-400">Premium</span>
                                            )}
                                        </div>
                                    </CardContent>
                                    <div className="p-4 pt-0">
                                        <Button asChild className="w-full">
                                            <Link href={`/playground/${game.slug}`}><Play className="mr-2"/> Start Game</Link>
                                        </Button>
                                    </div>
                               </Card>
                           )})}
                        </div>
                    ) : (
                        <Card className="bg-card/50 border-border/50 text-center py-20">
                            <CardHeader>
                                <div className="mx-auto bg-muted rounded-full p-4 w-fit mb-4">
                                  <Gamepad2 className="h-12 w-12 text-muted-foreground" />
                                </div>
                                <CardTitle className="text-2xl">The Playground is Quiet...</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">No games have been created yet. Check back soon!</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
