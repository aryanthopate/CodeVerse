
'use server';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { notFound } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Link from 'next/link';
import { Lock, PlayCircle, ArrowRight, LogIn, Star, Edit, Heart, GitCompareArrows, ShoppingCart, Zap, Book, Clock } from 'lucide-react';
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
import { ReviewAndRatingSection } from '@/components/review-rating-section';
import { Badge } from '@/components/ui/badge';

function AuthRequiredDialog({ children, fullWidth = false }: { children: React.ReactNode, fullWidth?: boolean }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild className={fullWidth ? 'w-full' : ''}>
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

async function CourseActionCard({ course, user }: { course: Awaited<ReturnType<typeof getCourseBySlug>>, user: any }) {
  if (!course) return null;
  const totalTopics = course.chapters.reduce((acc, chapter) => acc + chapter.topics.length, 0);
  const firstTopicSlug = course.chapters[0]?.topics[0]?.slug;

  const startCourseButton = (
    <Button size="lg" asChild className="w-full">
        <Link href={`/courses/${course.slug}/${firstTopicSlug}`}>
            Start Course <ArrowRight className="ml-2"/>
        </Link>
    </Button>
  );

  const enrollButton = (
    <Button size="lg" className="w-full">
        Enroll Now
    </Button>
  );

  const paidActions = (
    <div className="space-y-2">
        <div className="flex items-center gap-4">
            <p className="text-3xl font-bold text-foreground">{`₹${course.price}`}</p>
            {/* Optional: Discount price can go here */}
        </div>
        <div className="flex items-center gap-2">
            <Button size="lg" className="flex-1"><ShoppingCart className="mr-2"/> Add to Cart</Button>
            <Button size="icon" variant="outline"><Heart /></Button>
        </div>
        <Button size="lg" variant="outline" className="w-full">Buy Now</Button>
    </div>
  );

  return (
    <div className="sticky top-24 w-full">
        <div className="rounded-xl border bg-card text-card-foreground shadow-lg backdrop-blur-lg bg-card/50">
            <div className="relative w-full aspect-video rounded-t-xl overflow-hidden group">
                <Image src={course.image_url || `https://picsum.photos/seed/${course.slug}/1280/720`} alt={course.name} fill style={{objectFit: 'cover'}} />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <PlayCircle className="w-16 h-16 text-white" />
                </div>
            </div>
            <div className="p-6 space-y-4">
                {course.is_paid ? (
                    user ? paidActions : <AuthRequiredDialog fullWidth>{paidActions}</AuthRequiredDialog>
                ) : (
                    firstTopicSlug ? (user ? startCourseButton : <AuthRequiredDialog fullWidth>{enrollButton}</AuthRequiredDialog>) : null
                )}
                
                <p className="text-xs text-center text-muted-foreground">30-Day Money-Back Guarantee</p>
                
                <div className="border-t border-border/50 pt-4">
                    <h3 className="font-semibold text-foreground mb-2">This course includes:</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2"><Book className="w-4 h-4 text-primary" /> {course.chapters.length} chapters</li>
                        <li className="flex items-center gap-2"><Book className="w-4 h-4 text-primary" /> {totalTopics} topics</li>
                        {course.total_duration_hours && (
                             <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> {course.total_duration_hours} hours on-demand video</li>
                        )}
                    </ul>
                </div>
                <div className="flex justify-around pt-4 border-t border-border/50">
                    <Button variant="link" size="sm" className="text-muted-foreground">Share</Button>
                    <Button variant="link" size="sm" className="text-muted-foreground">Gift this course</Button>
                </div>
            </div>
        </div>
    </div>
  )
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
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <div className="bg-card/30 border-b border-border/50">
        <div className="container mx-auto py-12">
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <nav className="text-sm text-muted-foreground">
                        <Link href="/courses" className="hover:text-primary">Courses</Link>
                        <span className="mx-2">&gt;</span>
                        <span>{course.name}</span>
                    </nav>
                    
                    <h1 className="text-4xl md:text-5xl font-bold">{course.name}</h1>
                    <p className="text-lg text-muted-foreground">{course.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm flex-wrap">
                        <Badge variant="secondary" className="bg-yellow-400/20 text-yellow-300 border-none">Bestseller</Badge>
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold text-yellow-400">{course.rating?.toFixed(1) || 'N/A'}</span>
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        </div>
                        <p className="text-muted-foreground">(1,234 ratings)</p>
                        <p className="text-muted-foreground">12,345 students</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <main className="flex-grow py-12">
        <div className="container mx-auto">
            <div className="grid lg:grid-cols-3 gap-12 items-start">
            
            <div className="lg:col-span-2 space-y-12">
              
              {/* What you'll learn */}
              <div className="p-6 bg-card/50 rounded-xl border border-border/50">
                <h2 className="text-3xl font-bold mb-4">What you'll learn</h2>
                 <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-muted-foreground">
                    <li className="flex items-start gap-3"><span className="text-primary mt-1">✓</span><span>Key takeaway one for this amazing course.</span></li>
                    <li className="flex items-start gap-3"><span className="text-primary mt-1">✓</span><span>Another important skill you will master.</span></li>
                    <li className="flex items-start gap-3"><span className="text-primary mt-1">✓</span><span>Build real-world applications from scratch.</span></li>
                    <li className="flex items-start gap-3"><span className="text-primary mt-1">✓</span><span>Understand the fundamental concepts of the language.</span></li>
                </ul>
              </div>

              {/* Course Content Accordion */}
              <div>
                <h2 className="text-3xl font-bold">Course Content</h2>
                <div className="flex justify-between items-baseline text-sm text-muted-foreground my-2">
                    <span>{course.chapters.length} chapters • {totalTopics} topics</span>
                    <Button variant="link" className="text-primary">Expand all sections</Button>
                </div>
                <Accordion type="single" collapsible defaultValue={course.chapters[0]?.id} className="w-full space-y-2">
                    {course.chapters.map((chapter) => (
                    <AccordionItem key={chapter.id} value={chapter.id} className="bg-card/50 border-border/50 backdrop-blur-sm rounded-xl">
                        <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline">
                        {chapter.title}
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                        <ul className="space-y-2">
                            {chapter.topics.map(topic => (
                            <li key={topic.id}>
                                {user ? (
                                    <Link href={`/courses/${course.slug}/${topic.slug}`}>
                                        <div className={`flex items-center p-3 rounded-lg transition-colors ${topic.is_free ? 'hover:bg-muted/50' : 'hover:bg-muted/50'}`}>
                                            <div className={`mr-4 ${topic.is_free ? 'text-primary' : 'text-muted-foreground'}`}>
                                                {topic.is_free || !course.is_paid ? <PlayCircle /> : <Lock />}
                                            </div>
                                            <span className="flex-grow">{topic.title}</span>
                                        </div>
                                    </Link>
                                ) : (
                                    <AuthRequiredDialog>
                                        <div className={`flex items-center p-3 rounded-lg transition-colors ${topic.is_free ? 'hover:bg-muted/50 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}>
                                            <div className={`mr-4 ${topic.is_free ? 'text-primary' : 'text-muted-foreground'}`}>
                                                {topic.is_free ? <PlayCircle /> : <Lock />}
                                            </div>
                                            <span className="flex-grow">{topic.title}</span>
                                            {!topic.is_free && course.is_paid && (
                                                <Button size="sm" variant="secondary" className="bg-accent/80 text-accent-foreground hover:bg-accent" onClick={(e) => e.stopPropagation()}>Subscribe</Button>
                                            )}
                                        </div>
                                    </AuthRequiredDialog>
                                )}
                            </li>
                            ))}
                        </ul>
                        </AccordionContent>
                    </AccordionItem>
                    ))}
                </Accordion>
              </div>

              {/* Reviews Section */}
              <div className="pt-6">
                  <ReviewAndRatingSection courseId={course.id} />
              </div>
            </div>
            
            <div className="lg:col-span-1">
                <CourseActionCard course={course} user={user} />
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
