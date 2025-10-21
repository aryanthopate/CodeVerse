
'use client';
import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, PlusCircle, Gamepad2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAllGames } from '@/lib/supabase/queries';
import { seedDemoGames } from '@/lib/supabase/actions';
import type { GameWithLevels } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';


export default function AdminGamesPage() {
    const [games, setGames] = useState<GameWithLevels[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const { toast } = useToast();

    const fetchGames = async () => {
        const gamesData = await getAllGames();
        if (gamesData) {
            setGames(gamesData);
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchGames();
    }, []);

    const handleSeedGames = async () => {
        setSeeding(true);
        const result = await seedDemoGames();
        if (result.success) {
            toast({
                title: 'Games Seeded!',
                description: 'The demo games have been added to your database.',
            });
            await fetchGames(); // Refresh the list
        } else {
            toast({
                variant: 'destructive',
                title: 'Seeding Failed',
                description: result.error,
            });
        }
        setSeeding(false);
    }

    return (
        <AdminLayout>
             <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold">Game Management</h1>
                        <p className="text-lg text-muted-foreground mt-1">Create and manage coding games.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleSeedGames} disabled={seeding}>
                            {seeding ? <Loader2 className="mr-2 animate-spin"/> : <Gamepad2 className="mr-2"/>}
                            {seeding ? 'Seeding...' : 'Seed Demo Games'}
                        </Button>
                        <Button asChild>
                            <Link href="/admin/games/new">
                                <PlusCircle className="mr-2"/>
                                Add New Game
                            </Link>
                        </Button>
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Existing Games</CardTitle>
                        <CardDescription>A list of all games on the platform.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {loading ? (
                            <p>Loading games...</p>
                        ) : games.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Game Title</TableHead>
                                        <TableHead>Levels</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {games.map(game => (
                                        <TableRow key={game.id}>
                                            <TableCell className="font-medium">{game.title}</TableCell>
                                            <TableCell>{game.game_levels.length}</TableCell>
                                            <TableCell>{game.is_free ? 'Free' : 'Paid'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-muted-foreground">No games created yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    )
}
