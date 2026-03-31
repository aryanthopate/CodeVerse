
'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, BarChart, BookOpen, Star, TrendingUp, Compass, Gamepad2 } from 'lucide-react';
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
    { title: 'XP Earned', value: `${calculatedStats.xp} XP`, icon: <Star className="text-yellow-400" /> },
    { title: 'Courses in Progress', value: enrolledCourses.length, icon: <BookOpen className="text-blue-400" /> },
    { title: 'Weekly Streak', value: `${calculatedStats.streak} days`, icon: <TrendingUp className="text-green-400" /> },
    { title: 'Leaderboard Rank', value: '#- / -', icon: <BarChart className="text-red-400" /> },
  ];

  if (loading) {
    return (
        <div className="space-y-8 w-full animate-pulse">
            {/* Hero row: 2/3 card + 1/3 stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
                <div className="lg:col-span-2 h-[260px] rounded-3xl bg-white/5" />
                <div className="h-[260px] rounded-3xl bg-white/5" />
            </div>
            {/* Active Courses row */}
            <div className="space-y-4 w-full">
                <div className="h-7 w-40 rounded-lg bg-white/5" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                    <div className="h-44 rounded-2xl bg-white/5" />
                    <div className="h-44 rounded-2xl bg-white/5" />
                    <div className="h-44 rounded-2xl bg-white/5 hidden lg:block" />
                    <div className="h-44 rounded-2xl bg-white/5 hidden lg:block" />
                </div>
            </div>
        </div>
    )
  }

  return (
      <div className="space-y-12 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Continue Learning or Game Card */}
          {enrolledCourses.length > 0 ? (
             <div className="lg:col-span-2 glass-card rounded-3xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-5 -z-10 group-hover:opacity-10 transition-opacity">
                    <Compass className="h-40 w-40" />
                </div>
                <div className="p-8 md:p-10">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Continue Your Journey</h2>
                    </div>
                    <ContinueLearningCard courses={enrolledCourses} progress={courseProgress || []}/>
                </div>
            </div>
          ) : inProgressGames.length > 0 ? (
             <div className="lg:col-span-2 glass-card rounded-3xl overflow-hidden relative group">
                 <div className="absolute top-0 right-0 p-8 opacity-5 -z-10 group-hover:opacity-10 transition-opacity">
                    <Gamepad2 className="h-40 w-40" />
                </div>
                <div className="p-8 md:p-10">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Resume Mission</h2>
                    </div>
                    <ContinuePlayingCard game={inProgressGames[0]} />
                </div>
            </div>
          ) : (
             <div className="lg:col-span-2 glass-card rounded-3xl flex flex-col items-center justify-center text-center p-12 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent -z-10" />
                <div className="mx-auto bg-primary/10 rounded-2xl p-6 w-fit mb-6 border border-primary/20 shadow-xl group-hover:scale-110 transition-transform">
                    <Compass className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-3xl font-black tracking-tight mb-2">Ready to Level Up?</h2>
                <p className="text-muted-foreground max-w-sm font-medium mb-8">You haven't started any courses or games yet. Let's find something to master!</p>
                <Button asChild className="rounded-full px-8 h-12 text-base font-bold shadow-lg shadow-primary/20">
                    <Link href="/courses">Explore the Catalog</Link>
                </Button>
            </div>
          )}

          {/* Your Stats */}
          <div className="glass-card rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
                <BarChart className="h-24 w-24" />
            </div>
            <div>
                <h2 className="text-xl font-black tracking-tight mb-8">Quick Stats</h2>
                <div className="grid grid-cols-1 gap-4">
                  {stats.map((stat, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-background/50 shadow-inner">
                            {stat.icon}
                        </div>
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.title}</h4>
                      </div>
                      <p className="text-lg font-black">{stat.value}</p>
                    </div>
                  ))}
                </div>
            </div>
            <Button variant="link" asChild className="mt-6 text-primary h-auto p-0 font-bold self-start group">
                <Link href="/profile">View full profile <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" /></Link>
            </Button>
          </div>
        </div>

        {/* My Courses */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight">Active Courses</h2>
            <Button variant="outline" asChild className="rounded-full text-xs font-bold border-white/5">
                <Link href="/courses">Explore All</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {enrolledCourses.length > 0 ? enrolledCourses.map(course => (
              <Link key={course.id} href={`/courses/${course.slug}`}>
                <div className="glass-card rounded-2xl overflow-hidden group transform transition-all duration-500 hover:-translate-y-2 hover:premium-border-glow">
                    <div className="relative h-32 w-full overflow-hidden">
                        <Image 
                            src={course.image_url || `https://picsum.photos/seed/${course.slug}/400/200`} 
                            alt={course.name} 
                            fill 
                            className="object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    </div>
                    <div className="p-4 space-y-3">
                      <h3 className="font-black text-sm tracking-tight line-clamp-1 group-hover:text-primary transition-colors">{course.name}</h3>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            <span>Progress</span>
                            <span>45%</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: '45%' }} />
                        </div>
                      </div>
                    </div>
                </div>
              </Link>
            )) : (
              <div className="col-span-full py-12 glass-card rounded-2xl text-center">
                <p className="text-muted-foreground font-medium">Your enrolled courses will appear here.</p>
              </div>
            )}
          </div>
        </div>

         {/* My Games */}
        {inProgressGames.length > 0 && (
            <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tight">Game Missions</h2>
                 <Button variant="outline" asChild className="rounded-full text-xs font-bold border-white/5">
                    <Link href="/playground">Launch Playground</Link>
                </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {inProgressGames.map(game => (
                <Link key={game.id} href={`/playground/${game.slug}`}>
                    <div className="glass-card rounded-2xl overflow-hidden group transform transition-all duration-500 hover:-translate-y-2 hover:premium-border-glow">
                         <div className="relative h-32 w-full overflow-hidden">
                            <Image 
                                src={game.thumbnail_url || `https://picsum.photos/seed/${game.slug}/400/200`} 
                                alt={game.title} 
                                fill 
                                className="object-cover transition-transform duration-700 group-hover:scale-110" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                        </div>
                        <div className="p-4 space-y-3">
                            <h3 className="font-black text-sm tracking-tight line-clamp-1 group-hover:text-primary transition-colors">{game.title}</h3>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    <span>XP Rank</span>
                                    <span>Level 4</span>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500" style={{ width: '60%' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </Link>
                ))}
            </div>
            </div>
        )}
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
        return (
            <div className="flex items-center justify-center p-8">
                <p>Unable to determine next lesson. Please go to a course page.</p>
            </div>
        )
    }

    const progressPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

    return (
        <div className="flex flex-col md:flex-row gap-8 items-center p-6 rounded-3xl bg-white/5 border border-white/5 shadow-inner">
            <div className="relative w-full md:w-48 h-32 rounded-2xl overflow-hidden shrink-0 shadow-2xl">
                <Image src={currentCourse.image_url || `https://picsum.photos/seed/${currentCourse.slug}/150/100`} alt={currentCourse.name} fill className="object-cover" />
            </div>
            <div className="flex-1 space-y-4 text-center md:text-left">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">{currentCourse.name} / {currentChapter.title}</p>
                    <h3 className="text-2xl font-black tracking-tight">{nextTopic.title}</h3>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <span>Course Completion</span>
                        <span>{Math.round(progressPercentage)}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${progressPercentage}%` }} />
                    </div>
                </div>
            </div>
            <Button asChild className="rounded-xl px-4 h-12 shadow-lg shadow-primary/20 shrink-0">
                <Link href={`/courses/${currentCourse.slug}/${nextTopic.slug}`}>
                    Resume Lesson <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
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

            setNextLevel(firstUncompletedLevel || allLevels[0]); // Default to first level if all completed? Or link to map.
            setLoading(false);
        };
        findNextLevel();
    }, [game, supabase]);

    if (loading || !nextLevel) {
        return <div className="p-4 rounded-lg bg-muted/50"><Skeleton className="h-24 w-full" /></div>
    }
    
    return (
         <div className="flex flex-col md:flex-row gap-8 items-center p-6 rounded-3xl bg-white/5 border border-white/5 shadow-inner">
            <div className="relative w-full md:w-48 h-32 rounded-2xl overflow-hidden shrink-0 shadow-2xl">
                <Image src={game.thumbnail_url || `https://picsum.photos/seed/${game.slug}/150/100`} alt={game.title} fill className="object-cover" />
            </div>
            <div className="flex-1 space-y-4 text-center md:text-left">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-green-500/80">Active Mission: {game.title}</p>
                    <h3 className="text-2xl font-black tracking-tight">Level: {nextLevel.title}</h3>
                </div>
                 <div className="flex items-center justify-center md:justify-start gap-4">
                    <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-xs font-bold">500 XP Reward</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-xs font-bold">Hard Difficulty</span>
                    </div>
                </div>
            </div>
            <Button asChild className="rounded-xl px-4 h-12 shadow-lg shadow-green-500/20 bg-green-600 hover:bg-green-500 shrink-0 border-none">
                <Link href={`/playground/${game.slug}/${nextLevel.slug}`}>
                Play Now <Gamepad2 className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
    )
}

export default function DashboardPage() {
  return (
    <AppLayout>
      <DashboardContent />
    </AppLayout>
  )
}
