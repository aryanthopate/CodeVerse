
'use client';

import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { X, Plus, Trash2, Gamepad2, Upload, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { createGame } from '@/lib/supabase/actions';
import { createClient } from '@/lib/supabase/client';

interface GameLevelState {
    id: string;
    title: string;
    objective: string;
    starter_code: string;
    expected_output: string;
    reward_xp: number | string;
    order: number;
}

export default function NewGamePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [isFree, setIsFree] = useState(true);
    
    const [levels, setLevels] = useState<GameLevelState[]>([
        { id: `lvl-${Date.now()}`, title: '', objective: '', starter_code: '', expected_output: '', reward_xp: 100, order: 1 }
    ]);
    
    const handleAddLevel = () => {
        setLevels([...levels, { id: `lvl-${Date.now()}`, title: '', objective: '', starter_code: '', expected_output: '', reward_xp: 100, order: levels.length + 1 }]);
    };

    const handleRemoveLevel = (levelId: string) => {
        setLevels(levels.filter(l => l.id !== levelId));
    };

    const handleLevelChange = (levelId: string, field: keyof GameLevelState, value: any) => {
        setLevels(prev => prev.map(l => l.id === levelId ? { ...l, [field]: value } : l));
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

        let finalThumbnailUrl = '';

        const gamePayload = {
            title,
            description,
            thumbnail_url: '', // Will be updated after upload
            is_free: isFree,
            levels: levels.map(l => ({...l, reward_xp: Number(l.reward_xp)}))
        };

        const result = await createGame(gamePayload as any);

        if (result.success && result.gameId) {
             if (thumbnailFile) {
                const filePath = `${result.gameId}/${thumbnailFile.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('game_thumbnails')
                    .upload(filePath, thumbnailFile, {
                        cacheControl: '3600',
                        upsert: true,
                    });
                
                if(uploadError) {
                    toast({ variant: 'destructive', title: 'Thumbnail Upload Failed', description: uploadError.message });
                    setLoading(false);
                    // Consider deleting the created game for consistency
                    return;
                }

                const { data: { publicUrl } } = supabase.storage.from('game_thumbnails').getPublicUrl(filePath);
                
                // Update the game with the thumbnail URL
                const { error: updateError } = await supabase
                    .from('games')
                    .update({ thumbnail_url: publicUrl })
                    .eq('id', result.gameId);

                 if (updateError) {
                    toast({ variant: 'destructive', title: 'Failed to link thumbnail', description: updateError.message });
                }
            }

            toast({
                title: "Game Created!",
                description: `${title} has been successfully added.`,
            });
            router.push('/admin/games');

        } else {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: result.error || "Could not save the game.",
            });
        }
        
        setLoading(false);
    };

    return (
        <AdminLayout>
             <div className="space-y-8">
                <div>
                    <h1 className="text-4xl font-bold">Create a New Game</h1>
                    <p className="text-lg text-muted-foreground mt-1">Fill out the details to add a new coding game.</p>
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
                                {loading ? 'Saving Game...' : 'Save and Publish Game'}
                            </Button>
                        </div>

                        {/* Levels Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {levels.map((level, levelIndex) => (
                                <Card key={level.id} className="bg-muted/30">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div className="space-y-1.5 flex-grow mr-4">
                                            <CardTitle className="flex items-center gap-2"><Gamepad2 className="text-primary"/> Level {levelIndex + 1}</CardTitle>
                                            <Input placeholder="Level Title" value={level.title} onChange={e => handleLevelChange(level.id, 'title', e.target.value)} required className="text-lg font-semibold p-0 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"/>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveLevel(level.id)} disabled={levels.length === 1}>
                                            <X className="text-destructive"/>
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                         <div className="space-y-2">
                                            <Label htmlFor={`level-objective-${level.id}`}>Objective</Label>
                                            <Textarea id={`level-objective-${level.id}`} value={level.objective} onChange={e => handleLevelChange(level.id, 'objective', e.target.value)} placeholder="Describe the goal of this level." className="min-h-[80px]" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor={`level-starter-code-${level.id}`}>Starter Code</Label>
                                            <Textarea id={`level-starter-code-${level.id}`} value={level.starter_code} onChange={e => handleLevelChange(level.id, 'starter_code', e.target.value)} placeholder="Provide some initial code for the user." className="min-h-[120px] font-mono" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor={`level-expected-output-${level.id}`}>Expected Output</Label>
                                            <Textarea id={`level-expected-output-${level.id}`} value={level.expected_output} onChange={e => handleLevelChange(level.id, 'expected_output', e.target.value)} placeholder="What should the code output on success?" className="min-h-[60px] font-mono" />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor={`level-reward-xp-${level.id}`}>Reward XP</Label>
                                            <Input id={`level-reward-xp-${level.id}`} type="number" value={level.reward_xp} onChange={e => handleLevelChange(level.id, 'reward_xp', e.target.value)} placeholder="e.g., 100" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                             <Button type="button" onClick={handleAddLevel} className="w-full">
                                <Plus className="mr-2"/> Add Another Level
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
