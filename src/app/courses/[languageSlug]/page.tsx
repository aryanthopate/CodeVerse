import { AppLayout } from '@/components/app-layout';
import { mockCourses } from '@/lib/mock-data';
import { notFound } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Link from 'next/link';
import { Lock, PlayCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function LanguagePage({ params }: { params: { languageSlug: string } }) {
  const course = mockCourses.find(c => c.slug === params.languageSlug);

  if (!course) {
    notFound();
  }
  
  const totalTopics = course.chapters.reduce((acc, chapter) => acc + chapter.topics.length, 0);
  const completedTopics = 3; // Mock data
  const progressPercentage = (completedTopics / totalTopics) * 100;
  const firstTopicSlug = course.chapters[0]?.topics[0]?.slug;

  return (
    <AppLayout>
      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          <h1 className="text-4xl font-bold">{course.name}</h1>
          <p className="text-lg text-muted-foreground">{course.description}</p>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Course Progress</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} />
          </div>

          {firstTopicSlug && (
            <Button size="lg" asChild>
                <Link href={`/courses/${course.slug}/${firstTopicSlug}`}>
                    Continue Learning <ArrowRight className="ml-2"/>
                </Link>
            </Button>
          )}

          <Accordion type="single" collapsible defaultValue={course.chapters[0].id} className="w-full">
            {course.chapters.map((chapter) => (
              <AccordionItem key={chapter.id} value={chapter.id} className="bg-card/50 border-border/50 backdrop-blur-sm rounded-xl mb-4">
                <AccordionTrigger className="p-6 text-xl font-semibold hover:no-underline">
                  {chapter.title}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <ul className="space-y-3">
                    {chapter.topics.map(topic => (
                      <li key={topic.id}>
                        <Link href={topic.isFree ? `/courses/${course.slug}/${topic.slug}` : '#'}>
                          <div className={`flex items-center p-4 rounded-lg transition-colors ${topic.isFree ? 'hover:bg-muted/50' : 'opacity-60 cursor-not-allowed'}`}>
                            <div className={`mr-4 ${topic.isFree ? 'text-primary' : 'text-muted-foreground'}`}>
                              {topic.isFree ? <PlayCircle /> : <Lock />}
                            </div>
                            <span className="flex-grow">{topic.title}</span>
                             {!topic.isFree && (
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
    </AppLayout>
  );
}
