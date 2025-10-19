'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, BarChart, BookOpen, Star, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { mockCourses } from '@/lib/mock-data'; // Keep for now for course structure

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(profileData);
      }
      setLoading(false);
    }
    fetchProfile();
  }, [supabase]);

  // Keep mock for UI structure until courses are in DB
  const lastTopic = mockCourses[0].chapters[0].topics[1];
  const lastCourse = mockCourses[0];
  
  const stats = [
    { title: 'XP Earned', value: `${profile?.xp || 0} XP`, icon: <Star className="text-yellow-400" /> },
    { title: 'Courses in Progress', value: 0, icon: <BookOpen className="text-blue-400" /> },
    { title: 'Weekly Streak', value: `${profile?.streak || 0} days`, icon: <TrendingUp className="text-green-400" /> },
    { title: 'Leaderboard Rank', value: '#- / -', icon: <BarChart className="text-red-400" /> },
  ];

  if (loading) {
    return <AppLayout><div>Loading...</div></AppLayout>
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="p-8 rounded-xl bg-gradient-to-br from-primary/80 to-accent/80 text-primary-foreground">
          <h1 className="text-4xl font-bold">Welcome back, {profile?.full_name || 'Explorer'} 👋</h1>
          <p className="text-lg mt-2 text-primary-foreground/80">Ready to continue your coding adventure?</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Continue Learning - This can be updated when progress is stored in DB */}
          <Card className="lg:col-span-2 bg-card/50 border-border/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Continue Learning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-6 items-center p-4 rounded-lg bg-muted/50">
                <Image src={lastCourse.imageUrl} alt={lastCourse.name} width={150} height={100} className="rounded-md object-cover" data-ai-hint="abstract technology" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{lastCourse.name} / {lastCourse.chapters[0].title}</p>
                  <h3 className="text-xl font-semibold mt-1">{lastTopic.title}</h3>
                  <Progress value={0} className="mt-4 h-2" />
                </div>
                <Button asChild>
                  <Link href={`/courses/${lastCourse.slug}/${lastTopic.slug}`}>
                    Jump Back In <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Your Stats */}
          <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">{stat.icon}<h4 className="text-sm font-medium">{stat.title}</h4></div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recommended For You */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Recommended For You</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockCourses.slice(0, 4).map(course => (
              <Link key={course.id} href={`/courses/${course.slug}`}>
                <Card className="bg-card/50 border-border/50 backdrop-blur-sm overflow-hidden group transform transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-primary/10">
                    <Image src={course.imageUrl} alt={course.name} width={400} height={200} className="w-full h-32 object-cover" data-ai-hint="code background" />
                    <CardContent className="p-4">
                      <h3 className="font-semibold truncate">{course.name}</h3>
                      <p className="text-sm text-muted-foreground">{course.description.substring(0, 40)}...</p>
                    </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
