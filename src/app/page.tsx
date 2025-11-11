
'use server';

import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight, Bot, Code, Film, Star, Zap, LogIn, Gamepad2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getCoursesWithChaptersAndTopics, getGameSettings } from '@/lib/supabase/queries';
import { CourseWithChaptersAndTopics } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { AnimatedGridBackground } from '@/components/animated-grid-background';
import { cn } from '@/lib/utils';
import { FuturisticButton } from '@/components/futuristic-button';
import { NewsletterTerminal } from '@/components/newsletter-terminal';
import { ContactForm } from '@/components/contact-form';


function AuthRequiredDialog({ children }: { children: React.ReactNode }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex justify-center mb-2">
                        <LogIn className="w-12 h-12 text-primary"/>
                    </div>
                    <AlertDialogTitle className="text-center text-2xl">Authentication Required</AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                        Please log in or create an account to start your learning journey.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Link href="/login">Login</Link>
                    </AlertDialogAction>
                    <AlertDialogAction asChild>
                        <Link href="/signup">Sign Up</Link>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const courses: CourseWithChaptersAndTopics[] = await getCoursesWithChaptersAndTopics() || [];
  
  const features = [
    {
      icon: <Film className="w-6 h-6 text-primary" />,
      title: 'Interactive Video Lessons',
      description: 'Learn step-by-step with our engaging and modern video player.',
    },
    {
      icon: <Bot className="w-6 h-6 text-primary" />,
      title: 'AI-Powered Guidance',
      description: 'Get instant explanations, code reviews, and hints from your personal AI tutor.',
    },
    {
      icon: <Code className="w-6 h-6 text-primary" />,
      title: 'Hands-on Code Practice',
      description: 'Apply what you learn in our interactive code editor with AI feedback.',
    },
    {
      icon: <Zap className="w-6 h-6 text-primary" />,
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
    <div className="flex flex-col min-h-screen bg-background dark-grid-background">
      <Header />
      <main className="flex-grow">
        
        {/* Hero Section */}
        <section className="pt-32 pb-20 text-center container mx-auto relative z-10">
          <Badge variant="outline" className="mb-6 border-primary/30 bg-primary/10 text-primary animate-float">
            <Sparkles className="w-3 h-3 mr-2" /> Exciting announcement
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold font-headline bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-300">
            Learn to Code,
            <br />
            The Fun Way
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            Build beautiful applications for your startup, clients, and side projects, without having to think about the design.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/40 transform hover:-translate-y-1 transition-all duration-300">
              <Link href="/signup">Try it free <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
            <Button size="lg" variant="link" asChild className="text-muted-foreground hover:text-white">
              <Link href="/courses">Learn more</Link>
            </Button>
          </div>
        </section>

        {/* Course Preview */}
        <section className="py-20">
            <div className="container mx-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.slice(0, 3).map((course) => {
                    const totalTopics = course.chapters.reduce((acc, ch) => acc + ch.topics.length, 0);
                    return (
                        <Link key={course.id} href={`/courses/${course.slug}`}>
                            <Card className="bg-card/50 border-border/50 h-full flex flex-col group overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10">
                                <CardHeader className="p-0">
                                    <Image src={course.image_url || `https://picsum.photos/seed/${course.slug}/600/400`} alt={course.name} width={600} height={400} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                                </CardHeader>
                                <CardContent className="p-6 flex-grow">
                                    <h3 className="text-xl font-bold mb-2">{course.name}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    )
                })}
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
            <div className="container mx-auto">
                <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-4xl font-bold">A better way to learn code</h2>
                    <p className="text-lg text-muted-foreground mt-4">CodeVerse isn't just another video tutorial platform. It's an interactive ecosystem designed to make you a better developer, faster.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
                    {features.map((feature, i) => (
                        <Card key={i} className="bg-card/50 border-border/50 p-6">
                           <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">{feature.icon}</div>
                           <h3 className="text-lg font-bold">{feature.title}</h3>
                           <p className="text-sm text-muted-foreground mt-2">{feature.description}</p>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        {/* New Play & Learn Section */}
        <section className="py-20">
            <div className="container mx-auto">
                <div className="relative min-h-[80vh] flex flex-col items-center justify-center rounded-2xl overflow-hidden bg-black text-center p-8 transition-colors duration-100">
                    <AnimatedGridBackground />
                    <div className="relative z-10 flex flex-col items-center">
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
            </div>
        </section>

        {/* Testimonials */}
        <section className="py-20">
           <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Loved by Learners</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.name} className="bg-card/50 border-border/50 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex text-yellow-400 mb-4">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                    </div>
                    <p className="text-foreground mb-4">"{testimonial.comment}"</p>
                  </div>
                  <div className="flex items-center gap-4 mt-auto pt-4 border-t border-border/50">
                    <Avatar>
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                      <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
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
