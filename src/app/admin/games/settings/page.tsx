
'use client';

import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Progress } from '@/components/ui/progress';

interface GameSettings {
    placeholder_image_url: string | null;
    rocket_image_url: string | null;
}

export default function GameSettingsPage() {
    const { toast } = useToast();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<GameSettings>({ placeholder_image_url: null, rocket_image_url: null });
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number | undefined }>({});

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('game_settings')
                .select('*')
                .eq('id', 1)
                .single();
            
            if (data) {
                setSettings(data);
            } else if (error) {
                toast({ variant: 'destructive', title: 'Error fetching settings', description: error.message });
            }
            setLoading(false);
        };
        fetchSettings();
    }, [supabase, toast]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof GameSettings) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const filePath = `public/${file.name}`;
        setUploadProgress(prev => ({...prev, [field]: 0}));

        const { error: uploadError } = await supabase.storage
            .from('game_assets')
            .upload(filePath, file, { cacheControl: '3600', upsert: true });

        if (uploadError) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: uploadError.message });
            setUploadProgress(prev => ({...prev, [field]: undefined}));
            return;
        }

        const { data: { publicUrl } } = supabase.storage.from('game_assets').getPublicUrl(filePath);

        setSettings(prev => ({ ...prev, [field]: publicUrl }));
        setUploadProgress(prev => ({...prev, [field]: 100}));
        
        toast({ title: 'Upload Complete!', description: `${file.name} has been uploaded.`});
        setTimeout(() => setUploadProgress(prev => ({...prev, [field]: undefined})), 3000);
    };

    const handleSave = async () => {
        setSaving(true);
        const { error } = await supabase
            .from('game_settings')
            .update({
                placeholder_image_url: settings.placeholder_image_url,
                rocket_image_url: settings.rocket_image_url,
                updated_at: new Date().toISOString(),
            })
            .eq('id', 1);

        if (error) {
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
        } else {
            toast({ title: 'Settings Saved!', description: 'Your game assets have been updated.' });
        }
        setSaving(false);
    };

    if (loading) {
        return <AdminLayout><div>Loading game settings...</div></AdminLayout>;
    }

    return (
        <AdminLayout>
             <div className="space-y-8 max-w-2xl mx-auto">
                <div>
                    <h1 className="text-4xl font-bold">Game Asset Settings</h1>
                    <p className="text-lg text-muted-foreground mt-1">Manage global images used across all games.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Game Images</CardTitle>
                        <CardDescription>Upload the images that will be used in the coding games.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Homepage Placeholder Image */}
                        <div className="space-y-2">
                            <Label>Homepage Game Placeholder</Label>
                            <p className="text-sm text-muted-foreground">This image appears on the homepage for the "Play & Learn" section. Recommended size: 600x600.</p>
                            <Card className="border-dashed">
                                <CardContent className="p-4">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        {settings.placeholder_image_url ? (
                                            <Image src={settings.placeholder_image_url} alt="Placeholder preview" width={200} height={200} className="rounded-md h-40 w-40 object-cover"/>
                                        ) : (
                                            <div className="w-40 h-40 bg-muted rounded-lg flex items-center justify-center">
                                                <ImageIcon className="w-12 h-12 text-muted-foreground" />
                                            </div>
                                        )}
                                        <Input id="placeholder-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e, 'placeholder_image_url')} accept="image/png, image/jpeg, image/jpg"/>
                                        <Label htmlFor="placeholder-upload" className="cursor-pointer text-primary text-sm underline">
                                            {settings.placeholder_image_url ? 'Change image' : 'Upload an image'}
                                        </Label>
                                         {uploadProgress['placeholder_image_url'] !== undefined && (
                                            <div className="w-full mt-2 space-y-1">
                                                <Progress value={uploadProgress['placeholder_image_url']} className="h-2" />
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        
                        {/* Rocket Image */}
                        <div className="space-y-2">
                            <Label>In-Game Rocket Sprite</Label>
                             <p className="text-sm text-muted-foreground">This is the player's ship in the bubble shooter game. Recommended size: 40x48 (transparent PNG preferred).</p>
                            <Card className="border-dashed">
                                <CardContent className="p-4">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        {settings.rocket_image_url ? (
                                            <Image src={settings.rocket_image_url} alt="Rocket preview" width={40} height={48} className="rounded-md object-contain"/>
                                        ) : (
                                            <div className="w-20 h-24 bg-muted rounded-lg flex items-center justify-center">
                                                <ImageIcon className="w-12 h-12 text-muted-foreground" />
                                            </div>
                                        )}
                                        <Input id="rocket-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e, 'rocket_image_url')} accept="image/png, image/jpeg, image/jpg"/>
                                        <Label htmlFor="rocket-upload" className="cursor-pointer text-primary text-sm underline">
                                            {settings.rocket_image_url ? 'Change image' : 'Upload an image'}
                                        </Label>
                                        {uploadProgress['rocket_image_url'] !== undefined && (
                                            <div className="w-full mt-2 space-y-1">
                                                <Progress value={uploadProgress['rocket_image_url']} className="h-2" />
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                         <Button onClick={handleSave} disabled={saving}>
                            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Settings'}
                        </Button>
                    </CardContent>
                </Card>
             </div>
        </AdminLayout>
    );
}
