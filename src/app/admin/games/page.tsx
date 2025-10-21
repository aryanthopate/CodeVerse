
'use client';
import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminGamesPage() {
    return (
        <AdminLayout>
             <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold">Game Management</h1>
                        <p className="text-lg text-muted-foreground mt-1">Create and manage coding games.</p>
                    </div>
                    <Button asChild>
                        <Link href="/admin/games/new">
                            <PlusCircle className="mr-2"/>
                            Add New Game
                        </Link>
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Existing Games</CardTitle>
                        <CardDescription>A list of all games on the platform.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Game list will be rendered here */}
                        <p className="text-muted-foreground">No games created yet.</p>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    )
}
