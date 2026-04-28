
'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, BarChart, BookOpen, Star, TrendingUp, Compass, Gamepad2, PlayCircle, Trophy } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile, CourseWithChaptersAndTopics, GameWithChaptersAndLevels, UserGameProgress, Topic, Chapter } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useRouter } from 'next/navigation';
import { getUserEnrollments, getInProgressGames } from '@/lib/supabase/queries';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

function DashboardContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<CourseWithChaptersAndTopics[]>([]);
  const [inProgressGames, setInProgressGames] = useState<GameWithChaptersAndLevels[]>([]);
  const [courseProgress, setCourseProgress] = useState<{ topic_id: string }[] | null>(null);
  const [gameProgress, setGameProgress] = useState<UserGameProgress[] | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(profileData);

        const [enrollmentsData, gamesData, allGameProgress] = await Promise.all([
          getUserEnrollments(user.id),
          getInProgressGames(user.id),
          supabase.from('user_game_progress').select('*, game_levels(reward_xp)').eq('user_id', user.id)
        ]);
        
        if (enrollmentsData) {
          setEnrolledCourses(enrollmentsData.enrolledCourses);
          setCourseProgress(enrollmentsData.progress);
        }
        if (gamesData) {
            setInProgressGames(gamesData);
        }
        if (allGameProgress.data) {
            setGameProgress(allGameProgress.data as any[]);
        }

      } else {
        router.push('/login'); // Redirect if no user
      }
      setLoading(false);
    }
    fetchInitialData();
  }, [supabase, router]);

  useEffect(() => {
    if (searchParams.get('toast')) {
      toast({
        title: 'Login Successful!',
        description: "Welcome to your dashboard!",
      });
      // Remove toast param from URL without reloading the page
      router.replace('/dashboard', {scroll: false});
    }
  }, [searchParams, toast, router]);

    const calculatedStats = useMemo(() => {
        if (!gameProgress) return { xp: 0, streak: 0 };

        const totalXp = gameProgress.reduce((acc, progress) => acc + ((progress as any).game_levels?.reward_xp || 0), 0);

        const uniqueDates = [...new Set(gameProgress.map(p => new Date(p.completed_at).toISOString().split('T')[0]))].sort();
        
        let currentStreak = 0;
        if (uniqueDates.length > 0) {
            currentStreak = 1;
            for (let i = uniqueDates.length - 1; i > 0; i--) {
                const currentDate = new Date(uniqueDates[i]);
                const previousDate = new Date(uniqueDates[i-1]);
                
                const diffTime = currentDate.getTime() - previousDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    currentStreak++;
                } else {
                    break;
                }
            }
             // Check if the most recent day is today or yesterday
            const mostRecentDate = new Date(uniqueDates[uniqueDates.length - 1]);
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);

            const isToday = mostRecentDate.toDateString() === today.toDateString();
            const isYesterday = mostRecentDate.toDateString() === yesterday.toDateString();

            if (!isToday && !isYesterday) {
                currentStreak = 0;
            }
        }
        
        return { xp: totalXp, streak: currentStreak };
    }, [gameProgress]);

  const stats = [
    { title: 'Total XP', value: calculatedStats.xp, subtitle: 'Experience points', icon: <Star className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-500/10' },
    { title: 'Active Courses', value: enrolledCourses.length, subtitle: 'Currently enrolled', icon: <BookOpen className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-500/10' },
    { title: 'Day Streak', value: calculatedStats.streak, subtitle: 'Keep it up!', icon: <TrendingUp className="w-5 h-5 text-emerald-500" />, bg: 'bg-emerald-500/10' },
    { title: 'Global Rank', value: '-', subtitle: 'Top 10%', icon: <Trophy className="w-5 h-5 text-purple-500" />, bg: 'bg-purple-500/10' },
  ];

  if (loading) {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="h-32 bg-muted/50 rounded-2xl w-full"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                <Skeleton className="h-[300px] lg:col-span-2 rounded-xl" />
                <Skeleton className="h-[300px] rounded-xl" />
            </div>
        </div>
    )
  }

  return (
      <div className="space-y-10 pb-10 max-w-7xl mx-auto">
        
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:32px_32px]"></div>
            <div className="relative p-8 md:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                        Welcome back, <span className="text-primary">{profile?.full_name?.split(' ')[0] || 'Developer'}</span>! 👋
                    </h1>
                    <p className="text-muted-foreground text-lg">Ready to conquer new coding challenges today?</p>
                </div>
                <Button size="lg" className="rounded-full shadow-lg shadow-primary/20" asChild>
                    <Link href="/courses/explore">
                        <Compass className="mr-2 h-5 w-5" /> Explore Catalog
                    </Link>
                </Button>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, i) => (
            <Card key={i} className="bg-card/50 backdrop-blur-sm border-muted hover:border-border transition-colors">
                <CardContent className="p-6 flex items-center gap-4">
                    <div className={cn("p-4 rounded-full", stat.bg)}>
                        {stat.icon}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground leading-none mb-1">{stat.title}</p>
                        <h4 className="text-2xl font-bold tracking-tight">{stat.value}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                    </div>
                </CardContent>
            </Card>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
              
            {/* Continue Learning / Playing Spotlight */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold tracking-tight">Pick Up Where You Left Off</h2>
                </div>
                
                {enrolledCourses.length > 0 ? (
                    <ContinueLearningCard courses={enrolledCourses} progress={courseProgress || []}/>
                ) : inProgressGames.length > 0 ? (
                    <ContinuePlayingCard game={inProgressGames[0]} />
                ) : (
                    <Card className="bg-muted/30 border-dashed border-2 flex flex-col items-center justify-center text-center p-12">
                        <div className="bg-background rounded-full p-4 mb-4 shadow-sm border">
                            <Compass className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold">Your Journey Awaits</h3>
                        <p className="text-muted-foreground mt-2 max-w-md">You haven't enrolled in any courses yet. Start exploring to build your skills.</p>
                        <Button variant="outline" className="mt-6 rounded-full" asChild>
                            <Link href="/courses">Browse Directory</Link>
                        </Button>
                    </Card>
                )}
            </div>

            {/* My Courses Catalog */}
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <h2 className="text-2xl font-semibold tracking-tight">My Courses</h2>
                    {enrolledCourses.length > 4 && (
                        <Button variant="link" className="text-primary p-0 h-auto" asChild>
                            <Link href="/courses">View All</Link>
                        </Button>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {enrolledCourses.length > 0 ? enrolledCourses.slice(0, 4).map(course => (
                    <Link key={course.id} href={`/courses/${course.slug}`}>
                        <Card className="h-full bg-card hover:bg-muted/50 transition-all duration-300 border-border/50 hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 group overflow-hidden flex flex-col">
                            <div className="relative h-40 overflow-hidden bg-muted">
                                <Image 
                                    src={course.image_url || `https://picsum.photos/seed/${course.slug}/400/200`} 
                                    alt={course.name} 
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                    <span className="text-sm font-medium flex items-center"><PlayCircle className="w-4 h-4 mr-2" /> Resume</span>
                                </div>
                            </div>
                            <CardContent className="p-5 flex-1 flex flex-col">
                                <h3 className="font-semibold text-lg line-clamp-1 mb-2 group-hover:text-primary transition-colors">{course.name}</h3>
                                <div className="mt-auto pt-4 space-y-2">
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                        <span>Progress</span>
                                        <span>0%</span>
                                    </div>
                                    <Progress value={0} className="h-1.5" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                    )) : (
                    <p className="text-muted-foreground col-span-2 py-4">Your enrolled courses will appear here.</p>
                    )}
                </div>
            </div>

          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            {/* My Games */}
            {inProgressGames.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                        <Gamepad2 className="w-5 h-5 text-primary" /> Active Games
                    </h2>
                    <div className="space-y-4">
                        {inProgressGames.map(game => (
                        <Link key={game.id} href={`/playground/${game.slug}`} className="block">
                            <Card className="bg-card hover:bg-muted/50 border-border/50 transition-all hover:shadow-md overflow-hidden flex items-center p-3 gap-4 group">
                                <div className="relative w-20 h-20 rounded-md overflow-hidden shrink-0">
                                    <Image 
                                        src={game.thumbnail_url || `https://picsum.photos/seed/${game.slug}/200/200`} 
                                        alt={game.title} 
                                        fill 
                                        className="object-cover group-hover:scale-110 transition-transform" 
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{game.title}</h3>
                                    <div className="mt-2 space-y-1">
                                        <Progress value={0} className="h-1.5" />
                                        <p className="text-[10px] text-muted-foreground text-right">0% Complete</p>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Activity Feed / Tips (Placeholder for future) */}
            <Card className="bg-muted/20 border-border/50 shadow-none">
                <CardHeader>
                    <CardTitle className="text-lg">Pro Tip</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground italic">&ldquo;Consistency is key. Coding for just 30 minutes every day yields better results than cramming for hours once a week.&rdquo;</p>
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
}

function ContinueLearningCard({ courses, progress }: { courses: CourseWithChaptersAndTopics[], progress: { topic_id: string }[] }) {
    const completedTopicIds = new Set(progress.map(p => p.topic_id));

    let nextTopic: Topic | null = null;
    let currentCourse: CourseWithChaptersAndTopics | null = null;
    let currentChapter: Chapter | null = null;
    let totalTopics = 0;
    let completedTopics = 0;

    // Find the first uncompleted topic from all enrolled courses
    for (const course of courses) {
        let found = false;
        totalTopics += course.chapters.reduce((acc, ch) => acc + ch.topics.length, 0);
        completedTopics += course.chapters.reduce((acc, ch) => acc + ch.topics.filter(t => completedTopicIds.has(t.id)).length, 0);

        for (const chapter of course.chapters) {
            for (const topic of chapter.topics) {
                if (!completedTopicIds.has(topic.id)) {
                    nextTopic = topic;
                    currentCourse = course;
                    currentChapter = chapter;
                    found = true;
                    break;
                }
            }
            if (found) break;
        }
        if (found) break;
    }

    // If all topics in all courses are completed, show the first topic of the first course as a fallback.
    if (!nextTopic && courses.length > 0) {
        currentCourse = courses[0];
        currentChapter = currentCourse.chapters[0];
        nextTopic = currentChapter?.topics[0] || null;
    }
    
    if (!nextTopic || !currentCourse || !currentChapter) {
        return null;
    }

    const progressPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

    return (
        <Card className="overflow-hidden border-border/60 shadow-md shadow-primary/5 bg-gradient-to-br from-card to-card/50">
            <div className="flex flex-col sm:flex-row">
                <div className="relative w-full sm:w-1/3 min-h-[160px] sm:min-h-full">
                    <Image 
                        src={currentCourse.image_url || `https://picsum.photos/seed/${currentCourse.slug}/400/300`} 
                        alt={currentCourse.name} 
                        fill
                        className="object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/90 sm:hidden"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent sm:hidden"></div>
                </div>
                
                <div className="flex-1 p-6 relative flex flex-col justify-center">
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent to-background/50 hidden sm:block w-8 -ml-8 scale-x-[-1]"></div>
                    
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                        <BookOpen className="w-3 h-3" /> Up Next
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-1">{nextTopic.title}</h3>
                    <p className="text-sm text-muted-foreground mb-6 line-clamp-1">{currentCourse.name} &bull; {currentChapter.title}</p>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-auto">
                        <div className="w-full sm:max-w-[200px] space-y-1.5">
                            <div className="flex justify-between text-xs font-medium">
                                <span>Course Progress</span>
                                <span>{Math.round(progressPercentage)}%</span>
                            </div>
                            <Progress value={progressPercentage} className="h-2" />
                        </div>
                        
                        <Button className="w-full sm:w-auto rounded-full" size="lg" asChild>
                            <Link href={`/courses/${currentCourse.slug}/${nextTopic.slug}`}>
                                Continue Lesson <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    )
}

function ContinuePlayingCard({ game }: { game: GameWithChaptersAndLevels }) {
    const [nextLevel, setNextLevel] = useState<{slug: string, title: string} | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const findNextLevel = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if(!user) { setLoading(false); return; }

            const { data: progress } = await supabase.from('user_game_progress').select('completed_level_id').eq('user_id', user.id).eq('game_id', game.id);
            const completedLevelIds = progress?.map(p => p.completed_level_id) || [];
            
            const allLevels = game.game_chapters.flatMap(c => c.game_levels);
            const firstUncompletedLevel = allLevels.find(l => !completedLevelIds.includes(l.id));

            setNextLevel(firstUncompletedLevel || allLevels[0]);
            setLoading(false);
        };
        findNextLevel();
    }, [game, supabase]);

    if (loading || !nextLevel) {
        return <Skeleton className="h-32 w-full rounded-xl" />
    }
    
    return (
        <Card className="overflow-hidden border-border/60 shadow-md shadow-primary/5">
            <div className="flex flex-col sm:flex-row">
                <div className="relative w-full sm:w-1/3 min-h-[160px] sm:min-h-full">
                    <Image 
                        src={game.thumbnail_url || `https://picsum.photos/seed/${game.slug}/400/300`} 
                        alt={game.title} 
                        fill
                        className="object-cover" 
                    />
                </div>
                
                <div className="flex-1 p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                        <Gamepad2 className="w-3 h-3" /> Continue Playing
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-1">{game.title}</h3>
                    <p className="text-sm text-muted-foreground mb-6">Level: {nextLevel.title}</p>
                    
                    <div className="mt-auto">
                        <Button className="rounded-full" asChild>
                            <Link href={`/playground/${game.slug}/${nextLevel.slug}`}>
                                Play Now <PlayCircle className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    )
}

export default function DashboardPage() {
  return (
    <AppLayout>
      <DashboardContent />
    </AppLayout>
  )
}

