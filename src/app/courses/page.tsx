'use client';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { mockCourses } from '@/lib/mock-data';
import Image from 'next/image';
import Link from 'next/link';

// We'll continue to use mockCourses for the list of available courses
// until that data is moved to the database.
// User-specific progress will be fetched from Supabase in a real scenario.

export default function CoursesPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold">My Courses</h1>
          <p className="text-lg text-muted-foreground mt-2">Continue your learning journey and explore new skills.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockCourses.map(course => {
            // In a real app, user progress would be fetched and matched here.
            // For now, we'll show a generic state.
            const userProgress = null; 
            return (
              <Link href={`/courses/${course.slug}`} key={course.id}>
                <Card className="bg-card/50 border-border/50 backdrop-blur-sm h-full flex flex-col transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20">
                  <CardHeader className="p-0">
                    <Image src={course.imageUrl} alt={course.name} width={600} height={300} className="w-full h-40 object-cover rounded-t-lg" data-ai-hint="abstract code" />
                  </CardHeader>
                  <CardContent className="p-6 flex-grow">
                    <CardTitle className="text-2xl font-bold">{course.name}</CardTitle>
                    <CardDescription className="mt-2">{course.description}</CardDescription>
                  </CardContent>
                  <CardFooter className="p-6 pt-0">
                    {userProgress ? (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-sm text-muted-foreground">Progress</span>
                           <span className="text-sm font-bold text-primary">{userProgress.percentage}%</span>
                        </div>
                        <Progress value={userProgress.percentage} className="h-2" />
                      </div>
                    ) : (
                       <p className="text-sm text-accent">Start Learning</p>
                    )}
                  </CardFooter>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
