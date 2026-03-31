'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { getUserEnrollments } from '@/lib/supabase/queries';
import { CourseWithChaptersAndTopics, UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Edit, Loader2, Save, X, Trophy, Flame, BookOpen, User, Hexagon, PlayCircle } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

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
                 <div className="space-y-6 max-w-5xl mx-auto">
                    <Skeleton className="h-[250px] w-full rounded-2xl" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                        <Skeleton className="h-32 rounded-xl" />
                        <Skeleton className="h-32 rounded-xl" />
                        <Skeleton className="h-32 rounded-xl" />
                    </div>
                </div>
            </AppLayout>
        );
    }
    
    if (!profile) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <div className="bg-muted/30 p-8 rounded-full mb-6">
                        <User className="h-16 w-16 text-muted-foreground" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">User Not Found</h2>
                    <p className="text-muted-foreground mb-8">Please log in to view and manage your profile.</p>
                     <Button asChild size="lg" className="rounded-full shadow-lg shadow-primary/20"><Link href="/login">Login Now</Link></Button>
                </div>
            </AppLayout>
        )
    }

    const initials = profile.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'U';

    return (
        <AppLayout>
            <div className="max-w-5xl mx-auto pb-10">
                {/* Profile Header & Banner */}
                <div className="relative mb-20 sm:mb-24">
                    {/* Cover Photo Area */}
                    <div className="h-48 sm:h-64 md:h-72 w-full rounded-b-3xl sm:rounded-3xl overflow-hidden relative shadow-md bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/10">
                        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:32px_32px]"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent"></div>
                    </div>

                    {/* Avatar & Info Wrapper */}
                    <div className="absolute -bottom-16 sm:-bottom-20 left-0 w-full px-6 sm:px-10 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 w-full">
                            {/* Avatar */}
                            <div className="relative group shrink-0 z-10 w-full flex justify-center sm:w-auto sm:inline-block">
                                <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-background shadow-xl bg-card rounded-full overflow-hidden" onClick={handleAvatarClick}>
                                    <AvatarImage src={avatarPreview || ''} alt={profile.full_name} className="object-cover" />
                                    <AvatarFallback className="text-4xl sm:text-5xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
                                </Avatar>
                                {isEditing && (
                                    <div className="absolute inset-y-0 inset-x-auto w-32 h-32 sm:h-40 sm:w-40 sm:inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                        <Camera className="text-white h-8 w-8 mb-1" />
                                        <span className="text-white text-xs font-medium">Change Photo</span>
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

                            {/* Name & Basic Info - Changes based on edit mode */}
                            <div className="flex-1 text-center sm:text-left space-y-1 mb-2">
                                {isEditing ? (
                                    <div className="space-y-3 bg-card/80 backdrop-blur-md p-4 rounded-xl border border-border shadow-sm max-w-md mx-auto sm:mx-0">
                                        <div className="space-y-1.5 text-left">
                                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</label>
                                            <Input 
                                                value={fullName} 
                                                onChange={(e) => setFullName(e.target.value)} 
                                                className="text-lg font-semibold bg-background" 
                                                placeholder="Enter your full name"
                                            />
                                        </div>
                                        <div className="space-y-1.5 text-left">
                                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Learning Purpose</label>
                                            <Input 
                                                value={learningAt} 
                                                onChange={(e) => setLearningAt(e.target.value)} 
                                                className="bg-background" 
                                                placeholder="e.g., Self-taught, University XYZ"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{profile.full_name}</h1>
                                        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 text-muted-foreground justify-center sm:justify-start">
                                            <span className="flex items-center"><User className="h-4 w-4 mr-1"/> {profile.email}</span>
                                            {profile.learning_at && (
                                                <>
                                                    <span className="hidden sm:inline">&bull;</span>
                                                    <span className="flex items-center"><BookOpen className="h-4 w-4 mr-1"/> Learning at {profile.learning_at}</span>
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="mb-2 shrink-0">
                                {isEditing ? (
                                    <div className="flex gap-3 mt-4 sm:mt-0">
                                        <Button variant="outline" onClick={handleCancelEdit} disabled={saving} className="rounded-full shadow-sm"><X className="mr-2 h-4 w-4"/> Cancel</Button>
                                        <Button onClick={handleSaveChanges} disabled={saving} className="rounded-full shadow-md shadow-primary/20">
                                            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : <><Save className="mr-2 h-4 w-4"/> Save</>}
                                        </Button>
                                    </div>
                                ) : (
                                    <Button onClick={() => setIsEditing(true)} variant="secondary" className="rounded-full shadow-sm hover:shadow-md transition-all mt-4 sm:mt-0">
                                        <Edit className="mr-2 h-4 w-4"/> Edit Profile
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 sm:px-0">
                    
                    {/* Left Column - Stats */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold tracking-tight">Your Stats</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20 shadow-sm overflow-hidden relative">
                                <div className="absolute -right-4 -top-4 opacity-10"><Hexagon className="h-24 w-24 text-amber-500" fill="currentColor" /></div>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
                                            <Trophy className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Total Experience</p>
                                            <h4 className="text-3xl font-bold tracking-tight text-foreground">{profile.xp} <span className="text-base font-normal text-muted-foreground">XP</span></h4>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20 shadow-sm overflow-hidden relative">
                                <div className="absolute -right-4 -top-4 opacity-10"><Flame className="h-24 w-24 text-orange-500" fill="currentColor" /></div>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-orange-500/20 rounded-xl text-orange-600 dark:text-orange-400">
                                            <Flame className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                                            <h4 className="text-3xl font-bold tracking-tight text-foreground">{profile.streak} <span className="text-base font-normal text-muted-foreground">Days</span></h4>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        
                        {/* Member Since / Details Card */}
                        <Card className="bg-card/50 backdrop-blur-sm border-muted shadow-sm hidden lg:block">
                            <CardContent className="p-6 space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Member Since</p>
                                    <p className="font-medium text-foreground">{new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Account Type</p>
                                    <p className="font-medium text-foreground capitalize">{profile.role || 'Student'}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Enrolled Courses */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-end">
                            <h3 className="text-xl font-bold tracking-tight">My Learning Journey</h3>
                            <Button variant="link" className="text-primary p-0 h-auto" asChild>
                                <Link href="/courses">Browse Catalog</Link>
                            </Button>
                        </div>
                        
                        {enrolledCourses.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {enrolledCourses.map(course => (
                                    <Link key={course.id} href={`/courses/${course.slug}`}>
                                        <Card className="h-full bg-card hover:bg-muted/50 transition-all duration-300 border-border/50 hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 group overflow-hidden flex flex-col">
                                            <div className="relative h-40 overflow-hidden bg-muted">
                                                <Image 
                                                    src={course.image_url || `https://picsum.photos/seed/${course.slug}/400/200`} 
                                                    alt={course.name} 
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 50vw"
                                                    className="object-cover transition-transform duration-500 group-hover:scale-105" 
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                                                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                                    <span className="px-2.5 py-1 bg-primary/20 backdrop-blur-md border border-primary/30 text-primary-foreground text-xs font-medium rounded-full flex items-center shadow-lg">
                                                        <PlayCircle className="w-3 h-3 mr-1" /> Enrolled
                                                    </span>
                                                </div>
                                            </div>
                                            <CardContent className="p-5 flex-1 flex flex-col">
                                                <h3 className="font-bold text-lg line-clamp-2 mb-3 group-hover:text-primary transition-colors">{course.name}</h3>
                                                <div className="mt-auto space-y-2">
                                                    {/* Using a dummy 0% for now as progress isn't fetched here yet perfectly, but styled nicely */}
                                                    <div className="flex justify-between text-xs text-muted-foreground font-medium mb-1">
                                                        <span>Course Progress</span>
                                                        <span>Started</span>
                                                    </div>
                                                    <Progress value={5} className="h-1.5" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <Card className="bg-muted/30 border-dashed border-2 flex flex-col items-center justify-center text-center p-12">
                                <div className="bg-background rounded-full p-4 mb-4 shadow-sm border">
                                    <BookOpen className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">No Courses Yet</h3>
                                <p className="text-muted-foreground max-w-sm mb-6">You haven't enrolled in any courses. Start exploring our catalog to begin your journey!</p>
                                <Button className="rounded-full shadow-md" asChild>
                                    <Link href="/courses">Explore Courses</Link>
                                </Button>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
