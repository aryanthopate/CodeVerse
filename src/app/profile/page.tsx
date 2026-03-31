
'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { getUserEnrollments } from '@/lib/supabase/queries';
import { CourseWithChaptersAndTopics, UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Edit, Loader2, Save, X, Star, TrendingUp, ArrowRight, BookOpen } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ProfilePage() {
    const supabase = createClient();
    const { toast } = useToast();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [enrolledCourses, setEnrolledCourses] = useState<CourseWithChaptersAndTopics[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    
    // Editable fields state
    const [fullName, setFullName] = useState('');
    const [learningAt, setLearningAt] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                if (profileData) {
                    setProfile(profileData);
                    setFullName(profileData.full_name);
                    setLearningAt(profileData.learning_at);
                    setAvatarPreview(profileData.avatar_url);
                }

                const enrollmentsData = await getUserEnrollments(user.id);
                if (enrollmentsData) {
                    setEnrolledCourses(enrollmentsData.enrolledCourses);
                }
            }
            setLoading(false);
        };
        fetchUserData();
    }, [supabase]);

    const handleAvatarClick = () => {
        if (isEditing) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleCancelEdit = () => {
        if (profile) {
            setFullName(profile.full_name);
            setLearningAt(profile.learning_at);
            setAvatarFile(null);
            setAvatarPreview(profile.avatar_url);
        }
        setIsEditing(false);
    };

    const handleSaveChanges = async () => {
        if (!profile) return;
        setSaving(true);
        let avatarUrl = profile.avatar_url;

        try {
            // Upload new avatar if selected
            if (avatarFile) {
                const filePath = `avatars/${profile.id}-${Date.now()}`;
                const { error: uploadError } = await supabase.storage.from('user_assets').upload(filePath, avatarFile, {
                    cacheControl: '3600',
                    upsert: true,
                });
                if (uploadError) throw new Error(`Avatar upload failed: ${uploadError.message}`);
                
                const { data: { publicUrl } } = supabase.storage.from('user_assets').getPublicUrl(filePath);
                avatarUrl = publicUrl;
            }

            // Update profile table
            const { data: updatedProfile, error: updateError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    learning_at: learningAt,
                    avatar_url: avatarUrl,
                })
                .eq('id', profile.id)
                .select()
                .single();
            
            if (updateError) throw new Error(`Profile update failed: ${updateError.message}`);

            setProfile(updatedProfile);
            setAvatarFile(null);
            setIsEditing(false);
            toast({ title: 'Profile Updated!', description: 'Your changes have been saved.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        } finally {
            setSaving(false);
        }
    };
    
    if (loading) {
        return (
            <AppLayout>
                 <div className="space-y-6">
                    <div className="flex items-center gap-6">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-6 w-32" />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Skeleton className="h-24" />
                        <Skeleton className="h-24" />
                    </div>
                    <Skeleton className="h-48 w-full" />
                </div>
            </AppLayout>
        );
    }
    
    if (!profile) {
        return (
            <AppLayout>
                <div className="text-center">
                    <h2 className="text-2xl font-bold">User Not Found</h2>
                    <p className="text-muted-foreground">Please log in to view your profile.</p>
                     <Button asChild className="mt-4"><Link href="/login">Login</Link></Button>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="space-y-10 pb-10">
                {/* Profile Hero Header */}
                <div className="relative rounded-3xl overflow-hidden glass-card p-8 md:p-12">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/20 via-purple-500/10 to-transparent -z-10" />
                    
                    <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-8">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
                            <div className="relative group shrink-0">
                                <Avatar className="h-32 w-32 border-4 border-background shadow-2xl ring-4 ring-primary/20 transition-transform hover:scale-105" onClick={handleAvatarClick}>
                                    <AvatarImage src={avatarPreview || ''} alt={profile.full_name} className="object-cover" />
                                    <AvatarFallback className="text-4xl font-bold bg-primary/10 text-primary">
                                        {profile.full_name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                {isEditing && (
                                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm" onClick={handleAvatarClick}>
                                        <Camera className="text-white h-8 w-8" />
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="sr-only"
                                            accept="image/png, image/jpeg, image/jpg"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-3 text-center md:text-left">
                                <div className="space-y-1">
                                    {isEditing ? (
                                        <Input 
                                            value={fullName} 
                                            onChange={(e) => setFullName(e.target.value)} 
                                            className="text-4xl font-bold p-0 h-auto border-0 focus-visible:ring-0 shadow-none bg-transparent max-w-sm" 
                                            autoFocus
                                        />
                                    ) : (
                                        <h1 className="text-4xl font-black tracking-tight premium-gradient-text">{profile.full_name}</h1>
                                    )}
                                    <p className="text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        {profile.email}
                                    </p>
                                </div>
                                
                                {isEditing ? (
                                    <div className="flex items-center gap-2 bg-muted/30 rounded-full px-4 py-1.5 border border-white/5">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase">At</span>
                                        <Input 
                                            value={learningAt} 
                                            onChange={(e) => setLearningAt(e.target.value)} 
                                            className="h-7 text-sm p-0 border-0 focus-visible:ring-0 bg-transparent" 
                                        />
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-2 bg-primary/5 rounded-full px-4 py-1.5 border border-primary/10">
                                        <Edit className="w-3 h-3 text-primary/70" />
                                        <p className="text-sm font-semibold text-primary/80">Learning at {profile.learning_at}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex shrink-0">
                            {isEditing ? (
                                <div className="flex gap-3">
                                    <Button onClick={handleSaveChanges} disabled={saving} className="rounded-full px-6 shadow-lg shadow-primary/25">
                                        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : <><Save className="mr-2 h-4 w-4"/> Save Changes</>}
                                    </Button>
                                    <Button variant="outline" onClick={handleCancelEdit} disabled={saving} className="rounded-full px-6"><X className="mr-2 h-4 w-4"/> Cancel</Button>
                                </div>
                            ) : (
                                <Button onClick={() => setIsEditing(true)} variant="secondary" className="rounded-full px-6 border border-white/5 hover:bg-secondary/80">
                                    <Edit className="mr-2 h-4 w-4"/> Edit Profile
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="glass-card border-none overflow-hidden relative group transition-all duration-500 hover:premium-border-glow">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Star className="h-16 w-16 text-yellow-500" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Experience</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black">{profile.xp}</span>
                                <span className="text-lg font-bold text-primary">XP</span>
                            </div>
                            <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-primary animate-pulse" style={{ width: '65%' }} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card border-none overflow-hidden relative group transition-all duration-500 hover:premium-border-glow">
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp className="h-16 w-16 text-green-500" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Current Streak</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black">{profile.streak}</span>
                                <span className="text-lg font-bold text-green-500">Days</span>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground font-medium">Keep it up! You're on fire! 🔥</p>
                        </CardContent>
                    </Card>

                     <Card className="glass-card border-none overflow-hidden relative group transition-all duration-500 hover:premium-border-glow">
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Loader2 className="h-16 w-16 text-primary" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Courses Enrolled</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black">{enrolledCourses.length}</span>
                                <span className="text-lg font-bold text-muted-foreground">Active</span>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground font-medium">Out of 12 available courses.</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Courses Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-black tracking-tight">My Journey</h2>
                        <Button variant="link" asChild className="text-primary font-bold">
                            <Link href="/courses">Explore more <ArrowRight className="ml-1 h-4 w-4" /></Link>
                        </Button>
                    </div>
                    
                    {enrolledCourses.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {enrolledCourses.map(course => (
                                <Link key={course.id} href={`/courses/${course.slug}`}>
                                    <div className="group relative rounded-2xl overflow-hidden glass-card transition-all duration-500 hover:-translate-y-2 hover:premium-border-glow">
                                        <div className="relative h-48 w-full overflow-hidden">
                                            <Image 
                                                src={course.image_url || ''} 
                                                alt={course.name} 
                                                fill 
                                                className="object-cover transition-transform duration-700 group-hover:scale-110" 
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                                            <div className="absolute bottom-4 left-4">
                                                <div className="bg-primary/20 backdrop-blur-md border border-primary/30 px-3 py-1 rounded-full">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary-foreground">In Progress</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            <h3 className="text-lg font-black tracking-tight group-hover:text-primary transition-colors line-clamp-1">{course.name}</h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                    <span>Overall Progress</span>
                                                    <span>35%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary" style={{ width: '35%' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card rounded-3xl p-12 text-center space-y-4">
                            <div className="bg-muted w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <BookOpen className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold">No courses yet</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto font-medium">Your learning journey hasn't started yet. Enroll in a course to begin mastering code!</p>
                            <Button asChild className="rounded-full px-8 shadow-lg shadow-primary/20">
                                <Link href="/courses">Find a Course</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
