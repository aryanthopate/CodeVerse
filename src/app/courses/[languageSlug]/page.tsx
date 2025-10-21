
'use server';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { notFound } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Link from 'next/link';
import { Lock, PlayCircle, ArrowRight, LogIn, Star, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getCourseBySlug } from '@/lib/supabase/queries';
import Image from 'next/image';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ReviewAndRatingSection } from '@/components/review-rating-section';

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

export default async function LanguagePage({ params }: { params: { languageSlug: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const course = await getCourseBySlug(params.languageSlug);

  if (!course) {
    notFound();
  }
  
  const totalTopics = course.chapters.reduce((acc, chapter) => acc + chapter.topics.length, 0);
  const completedTopics = 0; // Mock data for now, will be replaced with user progress
  const progressPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
  const firstTopicSlug = course.chapters[0]?.topics[0]?.slug;

  const startCourseButton = (
    <Button size="lg" asChild className="mt-6 w-full sm:w-auto">
        <Link href={`/courses/${course.slug}/${firstTopicSlug}`}>
            {progressPercentage > 0 ? 'Continue Learning' : 'Start Course'} <ArrowRight className="ml-2"/>
        </Link>
    </Button>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto">
            <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold">{course.name}</h1>
              <p className="text-lg text-muted-foreground">{course.description}</p>
              
               <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border/50">
                    <Image src={course.image_url || `https://picsum.photos/seed/${course.slug}/1280/720`} alt={course.name} fill style={{objectFit: 'cover'}} />
               </div>

              <div className="p-6 bg-card/50 rounded-xl border border-border/50">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Course Progress</span>
                    <span>{Math.round(progressPercentage)}% Complete</span>
                </div>
                <Progress value={progressPercentage} />
                {firstTopicSlug && (
                    user ? startCourseButton : <AuthRequiredDialog>{startCourseButton}</AuthRequiredDialog>
                )}
              </div>

              <h2 className="text-3xl font-bold pt-6">Course Content</h2>
              <Accordion type="single" collapsible defaultValue={course.chapters[0]?.id} className="w-full">
                {course.chapters.map((chapter) => (
                  <AccordionItem key={chapter.id} value={chapter.id} className="bg-card/50 border-border/50 backdrop-blur-sm rounded-xl mb-4">
                    <AccordionTrigger className="p-6 text-xl font-semibold hover:no-underline">
                      {chapter.title}
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      <ul className="space-y-3">
                        {chapter.topics.map(topic => (
                          <li key={topic.id}>
                            <Link href={topic.is_free ? `/courses/${course.slug}/${topic.slug}` : '#'}>
                              <div className={`flex items-center p-4 rounded-lg transition-colors ${topic.is_free ? 'hover:bg-muted/50' : 'opacity-60 cursor-not-allowed'}`}>
                                <div className={`mr-4 ${topic.is_free ? 'text-primary' : 'text-muted-foreground'}`}>
                                  {topic.is_free ? <PlayCircle /> : <Lock />}
                                </div>
                                <span className="flex-grow">{topic.title}</span>
                                {!topic.is_free && (
                                    <Button size="sm" variant="secondary" className="bg-accent/80 text-accent-foreground hover:bg-accent">Subscribe</Button>
                                )}
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
                <div className="pt-6">
                    <ReviewAndRatingSection courseId={course.id} />
                </div>
            </div>
            
            <div className="lg:col-span-1">
                <div className="sticky top-24 p-6 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 space-y-4">
                  <h3 className="text-2xl font-bold">Unlock Full Access</h3>
                  <p className="text-muted-foreground">Subscribe to unlock all topics, AI help, certificates, and more!</p>
                  <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> All {course.name} Topics</li>
                      <li className="flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> Unlimited AI Tutor Help</li>
                      <li className="flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> Verified Certificate</li>
                  </ul>
                  <Button className="w-full" size="lg">Subscribe Now</Button>
                </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
