

'use server';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Star, Globe2, Clock, RefreshCw } from 'lucide-react';
import { getCourseBySlug } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { CourseActionCard, CourseContentAccordion, ReviewAndRatingSection } from '@/components';
import Image from 'next/image';
import { format } from 'date-fns';


export default async function LanguagePage({ params }: { params: { languageSlug: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const course = await getCourseBySlug(params.languageSlug);

  if (!course) {
    notFound();
  }
  
  return (
    <div class="flex flex-col min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <div class="bg-card/30 border-b border-border/50">
        <div class="container mx-auto py-12">
            <div class="grid lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2 space-y-4">
                    <nav class="text-sm text-muted-foreground">
                        <Link href="/courses" class="hover:text-primary">Courses</Link>
                        <span class="mx-2">&gt;</span>
                        <span>{course.name}</span>
                    </nav>
                    
                    <h1 class="text-4xl md:text-5xl font-bold">{course.name}</h1>
                    <p class="text-lg text-muted-foreground">{course.description}</p>
                    
                    <div class="flex items-center gap-4 text-sm flex-wrap">
                        {course.is_bestseller && <Badge variant="secondary" class="bg-yellow-400/20 text-yellow-300 border-none">Bestseller</Badge>}
                        <div class="flex items-center gap-1.5">
                            <span class="font-bold text-yellow-400">{course.rating?.toFixed(1) || 'N/A'}</span>
                            <Star class="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        </div>
                        <p class="text-muted-foreground">(1,234 ratings)</p>
                        <p class="text-muted-foreground">{course.students_enrolled || 0} students</p>
                    </div>
                     <div class="flex items-center gap-6 text-sm text-muted-foreground">
                        {course.language && <div class="flex items-center gap-2"><Globe2 class="w-4 h-4" /><span>{course.language}</span></div>}
                        <div class="flex items-center gap-2"><RefreshCw class="w-4 h-4" /><span>Last updated {format(new Date(course.created_at), 'MM/yyyy')}</span></div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <main class="flex-grow py-12">
        <div class="container mx-auto">
            <div class="grid lg:grid-cols-3 gap-12">
            
            <div class="lg:col-span-2 space-y-12">
              
              {/* What you'll learn */}
              <div class="p-6 bg-card/50 rounded-xl border border-border/50">
                <h2 class="text-3xl font-bold mb-4">What you'll learn</h2>
                 <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-muted-foreground">
                    {(course.what_you_will_learn || []).map((item, index) => (
                        <li key={index} class="flex items-start gap-3"><span class="text-primary mt-1">✓</span><span>{item}</span></li>
                    ))}
                </ul>
              </div>

              {/* Course Content Accordion */}
              <CourseContentAccordion course={course} user={user} />

              {/* Related Courses */}
              {course.related_courses && course.related_courses.length > 0 && (
                  <div class="pt-6">
                      <h2 class="text-3xl font-bold mb-4">Related Courses</h2>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {course.related_courses.map(related => (
                              <Link key={related.id} href={`/courses/${related.slug}`}>
                                  <div class="p-4 bg-card/50 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors flex items-center gap-4">
                                      <Image src={related.image_url || ''} alt={related.name} width={120} height={80} class="rounded-md object-cover" />
                                      <div>
                                          <h4 class="font-semibold">{related.name}</h4>
                                          <p class="text-sm text-muted-foreground line-clamp-2">{related.description}</p>
                                      </div>
                                  </div>
                              </Link>
                          ))}
                      </div>
                  </div>
              )}

              {/* Reviews Section */}
              <div class="pt-6">
                  <ReviewAndRatingSection courseId={course.id} />
              </div>
            </div>
            
            <div class="lg:col-span-1 relative">
                <div class="sticky top-24 w-full">
                    <CourseActionCard course={course} user={user} />
                </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
