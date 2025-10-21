

'use client'

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlayCircle, ArrowRight, ShoppingCart, Heart, LogIn, Book, Clock, GitCompareArrows } from 'lucide-react';
import type { CourseWithChaptersAndTopics } from '@/lib/types';
import type { User } from '@supabase/supabase-js';
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
} from "@/components/ui/alert-dialog";

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

export function CourseActionCard({ course, user }: { course: CourseWithChaptersAndTopics, user: User | null }) {
  if (!course) return null;
  const totalTopics = course.chapters.reduce((acc, chapter) => acc + chapter.topics.length, 0);
  const firstTopicSlug = course.chapters[0]?.topics[0]?.slug;

  const totalDurationMinutes = course.chapters.reduce((total, chapter) => {
    return total + chapter.topics.reduce((chapterTotal, topic) => {
      return chapterTotal + (topic.duration_minutes || 0);
    }, 0);
  }, 0);

  const totalDurationHours = course.total_duration_hours ? parseFloat(course.total_duration_hours as any).toFixed(1) : null;


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
                {course.is_paid 
                    ? user ? paidActions : <AuthRequiredDialog fullWidth>{paidActions}</AuthRequiredDialog>
                    : firstTopicSlug ? (user ? startCourseButton : <AuthRequiredDialog fullWidth>{enrollButton}</AuthRequiredDialog>) : null
                }
                
                <p className="text-xs text-center text-muted-foreground">30-Day Money-Back Guarantee</p>
                
                <div className="border-t border-border/50 pt-4">
                    <h3 className="font-semibold text-foreground mb-2">This course includes:</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2"><Book className="w-4 h-4 text-primary" /> {course.chapters.length} chapters</li>
                        <li className="flex items-center gap-2"><Book className="w-4 h-4 text-primary" /> {totalTopics} topics</li>
                        {totalDurationHours && (
                             <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> {totalDurationHours} hours on-demand video</li>
                        )}
                    </ul>
                </div>
                <div className="flex justify-around pt-4 border-t border-border/50">
                    <Button variant="link" size="sm" className="text-muted-foreground"><Heart className="mr-2 h-4 w-4" /> Add to Wishlist</Button>
                    <Button variant="link" size="sm" className="text-muted-foreground"><GitCompareArrows className="mr-2 h-4 w-4" /> Compare</Button>
                </div>
            </div>
        </div>
    </div>
  )
}
