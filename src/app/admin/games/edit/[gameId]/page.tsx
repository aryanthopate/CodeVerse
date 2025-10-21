
'use client';

import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { X, Plus, Trash2, Gamepad2, Upload, Image as ImageIcon, Book } from 'lucide-react';
import { useRouter, useParams, notFound } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { getGameById } from '@/lib/supabase/queries';
import type { GameWithChaptersAndLevels, GameChapter, GameLevel } from '@/lib/types';


interface GameLevelState extends Partial<GameLevel> {
    id: string;
    title: string;
    objective: string;
    starter_code?: string | null;
    expected_output?: string | null;
    reward_xp: number | string;
    order: number;
}

interface GameChapterState extends Partial<GameChapter> {
    id: string;
    title: string;
    order: number;
    game_levels: GameLevelState[];
}


export default function EditGamePage() {
    const router = useRouter();
    const params = useParams();
    const gameId = params.gameId as string;
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const supabase = createClient();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [language, setLanguage] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [isFree, setIsFree] = useState(true);
    
    const [chapters, setChapters] = useState<GameChapterState[]>([]);

    const fetchGame = useCallback(async () => {
        if (!gameId) return;
        setInitialLoading(true);
        const gameData = await getGameById(gameId);
        if (gameData) {
            setTitle(gameData.title);
            setDescription(gameData.description || '');
            setLanguage(gameData.language || '');
            setThumbnailUrl(gameData.thumbnail_url || '');
            setIsFree(gameData.is_free);
            setChapters(gameData.game_chapters.map(c => ({
                ...c,
                game_levels: c.game_levels as GameLevelState[]
            })));
        } else {
            notFound();
        }
        setInitialLoading(false);
    }, [gameId]);

    useEffect(() => {
        fetchGame();
    }, [fetchGame]);

    
    const handleAddChapter = () => {
        const newOrder = chapters.length + 1;
        setChapters([...chapters, {
            id: `chap-${Date.now()}`,
            title: `Chapter ${newOrder}`,
            order: newOrder,
            game_levels: [{ id: `lvl-${Date.now()}`, title: '', objective: '', starter_code: '', expected_output: '', reward_xp: 100, order: 1 }]
        }]);
    };

    const handleRemoveChapter = (chapterId: string) => {
        setChapters(chapters.filter(c => c.id !== chapterId));
    };

    const handleChapterChange = (chapterId: string, field: 'title', value: string) => {
        setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, [field]: value } : c));
    };

    const handleAddLevel = (chapterId: string) => {
        setChapters(prev => prev.map(c => {
            if (c.id === chapterId) {
                const newOrder = c.game_levels.length + 1;
                return { ...c, game_levels: [...c.game_levels, { id: `lvl-${Date.now()}`, title: '', objective: '', starter_code: '', expected_output: '', reward_xp: 100, order: newOrder }] };
            }
            return c;
        }));
    };

    const handleRemoveLevel = (chapterId: string, levelId: string) => {
        setChapters(prev => prev.map(c => {
            if (c.id === chapterId) {
                return { ...c, game_levels: c.game_levels.filter(l => l.id !== levelId) };
            }
            return c;
        }));
    };
    
    const handleLevelChange = (chapterId: string, levelId: string, field: keyof GameLevelState, value: any) => {
        setChapters(prev => prev.map(c => {
            if (c.id === chapterId) {
                return { ...c, game_levels: c.game_levels.map(l => l.id === levelId ? { ...l, [field]: value } : l) };
            }
            return c;
        }));
    };
    
    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setThumbnailFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setThumbnailUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        let finalThumbnailUrl = thumbnailUrl;

        if (thumbnailFile) {
            const filePath = `${gameId}/${thumbnailFile.name}`;
            const { error: uploadError } = await supabase.storage
                .from('game_thumbnails')
                .upload(filePath, thumbnailFile, { cacheControl: '3600', upsert: true });

            if (uploadError) {
                toast({ variant: 'destructive', title: 'Thumbnail Upload Failed', description: uploadError.message });
            } else {
                finalThumbnailUrl = supabase.storage.from('game_thumbnails').getPublicUrl(filePath).data.publicUrl;
            }
        }

        const { error: gameError } = await supabase.from('games').update({
            title, description, language, thumbnail_url: finalThumbnailUrl, is_free
        }).eq('id', gameId);

        if (gameError) {
            toast({ variant: 'destructive', title: 'Update Failed', description: gameError.message });
            setLoading(false);
            return;
        }

        // ... Logic to upsert chapters and levels ...
        for (const chapter of chapters) {
            const isNewChapter = chapter.id.startsWith('chap-');
            const { data: upsertedChapter, error: chapterError } = await supabase.from('game_chapters').upsert({
                id: isNewChapter ? undefined : chapter.id,
                game_id: gameId,
                title: chapter.title,
                order: chapter.order,
            }).select().single();

            if (chapterError) { console.error('Chapter upsert failed:', chapterError); continue; }

            for (const level of chapter.game_levels) {
                const isNewLevel = level.id.startsWith('lvl-');
                await supabase.from('game_levels').upsert({
                    id: isNewLevel ? undefined : level.id,
                    chapter_id: upsertedChapter!.id,
                    title: level.title,
                    objective: level.objective,
                    starter_code: level.starter_code,
                    expected_output: level.expected_output,
                    reward_xp: Number(level.reward_xp),
                    order: level.order,
                });
            }
        }


        toast({ title: "Game Updated!", description: `${title} has been saved.` });
        router.push('/admin/games');
        setLoading(false);
    };

    if (initialLoading) {
        return <AdminLayout><div>Loading game editor...</div></AdminLayout>
    }

    return (
        <AdminLayout>
             <div className="space-y-8">
                <div>
                    <h1 className="text-4xl font-bold">Edit Game</h1>
                    <p className="text-lg text-muted-foreground mt-1">Now editing: <span className="font-semibold text-foreground">{title}</span></p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Game Details Column */}
                        <div className="lg:col-span-1 space-y-6 sticky top-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Game Details</CardTitle>
                                    <CardDescription>Provide the main details for the game.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="game-title">Game Title</Label>
                                        <Input id="game-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Python Basics Adventure" required />
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="game-language">Language</Label>
                                        <Input id="game-language" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="e.g., Python" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="game-description">Description</Label>
                                        <Textarea id="game-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A brief summary of the game." className="min-h-[100px]"/>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label>Game Thumbnail</Label>
                                        <Card className="border-dashed">
                                            <CardContent className="p-4">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    {thumbnailUrl ? (
                                                        <Image src={thumbnailUrl} alt="Thumbnail preview" width={400} height={200} className="rounded-md max-h-40 w-auto object-contain"/>
                                                    ) : (
                                                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    <Input id="thumbnail-upload" type="file" className="sr-only" onChange={handleThumbnailChange} accept="image/*"/>
                                                    <Label htmlFor="thumbnail-upload" className="cursor-pointer text-primary text-sm underline">
                                                        {thumbnailUrl ? 'Change image' : 'Upload an image'}
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <Label>Free Game</Label>
                                            <CardDescription>Is this game free to play?</CardDescription>
                                        </div>
                                        <Switch
                                            checked={isFree}
                                            onCheckedChange={setIsFree}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                             <Button type="submit" size="lg" className="w-full" disabled={loading}>
                                {loading ? 'Saving Game...' : 'Save Changes'}
                            </Button>
                        </div>

                        {/* Chapters and Levels Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {chapters.map((chapter, chapterIndex) => (
                                <Card key={chapter.id} className="bg-muted/30">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div className="space-y-1.5 flex-grow mr-4">
                                            <CardTitle className="flex items-center gap-2"><Book className="text-primary"/> Chapter {chapterIndex + 1}</CardTitle>
                                            <Input placeholder="Chapter Title" value={chapter.title} onChange={e => handleChapterChange(chapter.id, 'title', e.target.value)} required className="text-lg font-semibold p-0 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"/>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveChapter(chapter.id)} disabled={chapters.length === 1}>
                                            <X className="text-destructive"/>
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {chapter.game_levels.map((level, levelIndex) => (
                                            <Card key={level.id}>
                                                <CardHeader className="flex-row items-center justify-between p-4">
                                                    <CardTitle className='text-lg flex items-center gap-2'><Gamepad2/> Level {levelIndex + 1}</CardTitle>
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveLevel(chapter.id, level.id)} disabled={chapter.game_levels.length === 1}><Trash2 className="text-destructive h-4 w-4"/></Button>
                                                </CardHeader>
                                                <CardContent className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label htmlFor={`level-title-${level.id}`}>Level Title</Label>
                                                        <Input id={`level-title-${level.id}`} value={level.title} onChange={e => handleLevelChange(chapter.id, level.id, 'title', e.target.value)} required />
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label htmlFor={`level-objective-${level.id}`}>Objective</Label>
                                                        <Textarea id={`level-objective-${level.id}`} value={level.objective} onChange={e => handleLevelChange(chapter.id, level.id, 'objective', e.target.value)} placeholder="Describe the goal of this level." className="min-h-[80px]" />
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label htmlFor={`level-starter-code-${level.id}`}>Starter Code</Label>
                                                        <Textarea id={`level-starter-code-${level.id}`} value={level.starter_code || ''} onChange={e => handleLevelChange(chapter.id, level.id, 'starter_code', e.target.value)} placeholder="Provide some initial code for the user." className="min-h-[120px] font-mono" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`level-expected-output-${level.id}`}>Expected Output</Label>
                                                        <Textarea id={`level-expected-output-${level.id}`} value={level.expected_output || ''} onChange={e => handleLevelChange(chapter.id, level.id, 'expected_output', e.target.value)} placeholder="What should the code output on success?" className="min-h-[60px] font-mono" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`level-reward-xp-${level.id}`}>Reward XP</Label>
                                                        <Input id={`level-reward-xp-${level.id}`} type="number" value={level.reward_xp} onChange={e => handleLevelChange(chapter.id, level.id, 'reward_xp', e.target.value)} placeholder="e.g., 100" />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                         <Button type="button" variant="outline" onClick={() => handleAddLevel(chapter.id)}><Plus className="mr-2"/> Add Level</Button>
                                    </CardContent>
                                </Card>
                            ))}
                             <Button type="button" onClick={handleAddChapter} className="w-full">
                                <Plus className="mr-2"/> Add Another Chapter
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
