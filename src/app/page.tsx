
'use server';

import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight, Bot, Code, Film, Star, Zap, BookOpen, Clock, Trophy, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getCoursesWithChaptersAndTopics } from '@/lib/supabase/queries';
import { CourseWithChaptersAndTopics, UserProfile } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';
import { FuturisticButton } from '@/components/futuristic-button';
import { NewsletterTerminal } from '@/components/newsletter-terminal';
import { ContactForm } from '@/components/contact-form';
import { AnimatedGridBackground } from '@/components/animated-grid-background';

async function TopXpLeaderboard() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, xp')
    .order('xp', { ascending: false })
    .limit(5);

  if (error || !data) {
    console.error("Error fetching XP leaderboard data:", error);
    return <p className="text-zinc-400">Could not load XP leaderboard.</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((profile, index) => (
        <div
          key={`xp-${profile.full_name}-${index}`}
          className="flex items-center gap-4 rounded-lg bg-zinc-900/50 p-3 border border-zinc-800 transition-all hover:bg-zinc-800/60 hover:border-hp-accent/50"
        >
          <div className="flex items-center gap-3 flex-1">
            <span className="text-xl font-bold text-zinc-400 w-8 text-center">{index + 1}</span>
            <Avatar>
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || ''} />
              <AvatarFallback>{profile.full_name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-white truncate">{profile.full_name}</span>
          </div>
          <div className="font-semibold text-hp-accent">{profile.xp} XP</div>
           {index < 3 && <Crown className="w-6 h-6 text-yellow-400 fill-yellow-500" />}
        </div>
      ))}
    </div>
  );
}

async function TopStreakLeaderboard() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, streak')
    .order('streak', { ascending: false })
    .limit(5);

  if (error || !data) {
    console.error("Error fetching streak leaderboard data:", error);
    return <p className="text-zinc-400">Could not load streak leaderboard.</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((profile, index) => (
        <div
          key={`streak-${profile.full_name}-${index}`}
          className="flex items-center gap-4 rounded-lg bg-zinc-900/50 p-3 border border-zinc-800 transition-all hover:bg-zinc-800/60 hover:border-hp-accent/50"
        >
          <div className="flex items-center gap-3 flex-1">
            <span className="text-xl font-bold text-zinc-400 w-8 text-center">{index + 1}</span>
            <Avatar>
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || ''} />
              <AvatarFallback>{profile.full_name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-white truncate">{profile.full_name}</span>
          </div>
          <div className="flex items-center justify-end gap-2 text-orange-400">
            <Zap className="h-4 w-4" />
            <span className="font-semibold">{profile.streak} days</span>
          </div>
           {index < 3 && <Crown className="w-6 h-6 text-yellow-400 fill-yellow-500" />}
        </div>
      ))}
    </div>
  );
}


export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const courses: CourseWithChaptersAndTopics[] = await getCoursesWithChaptersAndTopics() || [];
  
  const features = [
    {
      icon: <Film className="w-6 h-6 text-hp-accent" />,
      title: 'Interactive Video Lessons',
      description: 'Learn step-by-step with our engaging and modern video player.',
    },
    {
      icon: <Bot className="w-6 h-6 text-hp-accent" />,
      title: 'AI-Powered Guidance',
      description: 'Get instant explanations, code reviews, and hints from your personal AI tutor.',
    },
    {
      icon: <Code className="w-6 h-6 text-hp-accent" />,
      title: 'Hands-on Code Practice',
      description: 'Apply what you learn in our interactive code editor with AI feedback.',
    },
    {
      icon: <Zap className="w-6 h-6 text-hp-accent" />,
      title: 'Engaging Quizzes & Games',
      description: 'Test your knowledge with quizzes and solidify skills in our coding playground.',
    },
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Computer Science Student',
      avatar: 'https://picsum.photos/seed/priya/100/100',
      comment: 'CodeVerse made learning Java feel like a game! The AI tutor is a lifesaver for tricky concepts.',
    },
    {
      name: 'Rohan Verma',
      role: 'Aspiring Developer',
      avatar: 'https://picsum.photos/seed/rohan/100/100',
      comment: 'I finally understand Python lists and dictionaries thanks to the bite-sized videos and practice sessions.',
    },
     {
      name: 'Anika Singh',
      role: 'Hobbyist Coder',
      avatar: 'https://picsum.photos/seed/anika/100/100',
      comment: 'The UI is just so cool and motivating. I love the progress tracking and earning XP!',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-hp-background-deep text-hp-text">
      <Header />
      <main className="flex-grow">
        
        {/* Hero Section */}
        <section className="relative pt-40 pb-28 text-center">
            <AnimatedGridBackground />
            <div className="container mx-auto relative z-10">
                <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-300">
                Learn to Code. Play to Master.
                </h1>
                <p className="mt-6 max-w-2xl mx-auto text-lg text-hp-text-muted">
                Interactive coding, AI mentors, and courses built for your future. CodeVerse is an interactive learning platform that makes mastering programming fun. Through AI-powered guidance, gamified challenges, and hands-on projects, you'll go from novice to pro in no time.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                <Button size="lg" asChild className="bg-hp-accent text-white hover:bg-hp-accent/90 shadow-lg shadow-hp-accent/30 ring-2 ring-hp-accent/50 ring-offset-2 ring-offset-hp-background-deep transition-all hover:scale-105 active:scale-95">
                    <Link href="/signup">Start Learning Free</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="bg-transparent hover:bg-white/10 text-white border-white/20 hover:border-white/40">
                    <Link href="/courses">Explore Courses</Link>
                </Button>
                </div>
            </div>
        </section>

        {/* New Leaderboard Section */}
        <section className="py-20 container mx-auto">
            <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-4xl font-bold text-white flex items-center justify-center gap-3"><Trophy className="text-yellow-400"/> Hall of Heroes</h2>
                <p className="text-lg text-hp-text-muted mt-4">See who's topping the charts. Earn XP by completing levels and build your daily streak!</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mt-12">
              <div>
                <h3 className="text-2xl font-bold text-center mb-6 text-hp-accent">Top XP Earners</h3>
                <TopXpLeaderboard />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-center mb-6 text-orange-400">Longest Streaks</h3>
                <TopStreakLeaderboard />
              </div>
            </div>
        </section>

        {/* Course Preview */}
        <section className="py-20 container mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-white">Featured Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {courses.slice(0,3).map((course) => {
                const totalTopics = course.chapters.reduce((acc, ch) => acc + (ch.topics?.length || 0), 0);
                return (
                  <Link key={course.id} href={`/courses/${course.slug}`} className="block group">
                    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 h-full flex flex-col overflow-hidden transition-all duration-300 hover:border-hp-accent/50 hover:shadow-2xl hover:shadow-hp-accent/10">
                      <div className="relative aspect-video overflow-hidden">
                        <Image 
                          src={course.image_url || `https://picsum.photos/seed/${course.slug}/600/400`}
                          alt={course.name}
                          width={600}
                          height={400}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      </div>
                      <div className="p-6 flex-grow flex flex-col">
                        <h3 className="text-xl font-bold mb-2 text-white">{course.name}</h3>
                        <p className="text-sm text-hp-text-muted flex-grow line-clamp-2">{course.description}</p>
                        <div className="flex justify-between items-center text-xs text-zinc-500 mt-4 pt-4 border-t border-zinc-800">
                          <div className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5"/><span>{course.chapters.length} Chapters</span></div>
                          <div className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5"/><span>{totalTopics} Topics</span></div>
                          {course.total_duration_hours && <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/><span>{course.total_duration_hours} hours</span></div>}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
            <div className="container mx-auto">
                <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-4xl font-bold text-white">A better way to learn code</h2>
                    <p className="text-lg text-hp-text-muted mt-4">CodeVerse isn't just another video tutorial platform. It's an interactive ecosystem designed to make you a better developer, faster.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
                    {features.map((feature, i) => (
                        <Card key={i} className="bg-zinc-900/50 border-zinc-800 p-6">
                           <div className="p-3 bg-hp-accent/10 rounded-lg w-fit mb-4">{feature.icon}</div>
                           <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                           <p className="text-sm text-hp-text-muted mt-2">{feature.description}</p>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        {/* New Play & Learn Section */}
        <section className="py-20">
            <div className="relative min-h-[80vh] flex flex-col items-center justify-center bg-black text-center p-8">
                <AnimatedGridBackground />
                <div className="container mx-auto relative z-10 flex flex-col items-center">
                    <h2 className="text-6xl md:text-8xl font-black text-white uppercase">
                        ENTER THE PLAYGROUND
                    </h2>
                    <p className="mt-6 max-w-xl mx-auto text-lg text-neutral-300">
                        Don't just watch, do! Solidify your skills by solving challenges in our interactive coding games. Earn XP, climb the leaderboard, and learn by playing.
                    </p>
                    <div className="mt-8">
                        <FuturisticButton />
                    </div>
                </div>
            </div>
        </section>

        {/* Testimonials */}
        <section className="py-20">
           <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-white">Loved by Learners</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.name} className="bg-zinc-900/50 border-zinc-800 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex text-yellow-400 mb-4">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                    </div>
                    <p className="text-white mb-4">"{testimonial.comment}"</p>
                  </div>
                  <div className="flex items-center gap-4 mt-auto pt-4 border-t border-zinc-800">
                    <Avatar>
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                      <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-white">{testimonial.name}</p>
                      <p className="text-sm text-hp-text-muted">{testimonial.role}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter & Help Section */}
        <section className="py-20 container mx-auto">
            <div className="relative rounded-2xl overflow-hidden p-8 flex flex-col items-center justify-center min-h-[400px] dark-circuit-wrapper">
                <div className="dark-circuit-background"></div>
                <div className="relative z-10 text-center flex flex-col items-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Stay Up-to-Date</h2>
                    <p className="text-neutral-300 max-w-2xl mb-8">
                        Join our newsletter to get the latest updates on new courses, game releases, and special offers delivered straight to your inbox.
                    </p>
                    <div className="flex justify-center">
                        <NewsletterTerminal />
                    </div>
                    <div className="mt-8">
                       <p className="text-sm text-neutral-400 mb-2">Or get in touch with us directly.</p>
                       <ContactForm>
                            <Button variant="outline" className="bg-transparent text-white border-white/50 hover:bg-white/10 hover:text-white">
                                Get Help
                            </Button>
                        </ContactForm>
                    </div>
                </div>
            </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
