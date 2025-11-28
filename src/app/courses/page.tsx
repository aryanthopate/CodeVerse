
'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, BookOpen, Compass } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { CourseWithChaptersAndTopics } from '@/lib/types';
import { getUserEnrollments } from '@/lib/supabase/queries';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyCoursesPage() {
    const [enrolledCourses, setEnrolledCourses] = useState<CourseWithChaptersAndTopics[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchEnrolledCourses = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const enrollmentsData = await getUserEnrollments(user.id);
                if (enrollmentsData) {
                    setEnrolledCourses(enrollmentsData.enrolledCourses);
                }
            }
            setLoading(false);
        };
        fetchEnrolledCourses();
    }, [supabase]);

    if (loading) {
        return (
             <AppLayout>
                <div className="space-y-6">
                    <h1 className="text-3xl font-bold">My Courses</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Skeleton className="h-64" />
                        <Skeleton className="h-64" />
                        <Skeleton className="h-64" />
                    </div>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">My Courses</h1>
                {enrolledCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enrolledCourses.map(course => {
                            // Dummy progress for now
                            const progress = 30;
                            return (
                                <Card key={course.id} className="overflow-hidden">
                                    <Link href={`/courses/${course.slug}`}>
                                        <Image src={course.image_url || `https://picsum.photos/seed/${course.slug}/400/200`} alt={course.name} width={400} height={200} className="w-full h-40 object-cover" />
                                    </Link>
                                    <CardHeader>
                                        <CardTitle className="truncate">{course.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between items-center mb-2 text-sm text-muted-foreground">
                                            <span>Progress</span>
                                            <span className="font-semibold text-primary">{progress}%</span>
                                        </div>
                                        <Progress value={progress} className="h-2" />
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <Card className="text-center py-16">
                        <CardHeader>
                             <div className="mx-auto bg-muted rounded-full p-4 w-fit mb-4">
                                <BookOpen className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <CardTitle>No Courses Yet</CardTitle>
                            <CardDescription>You haven't enrolled in any courses. Time to start learning!</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Button asChild>
                                <Link href="/courses/explore">
                                    Explore Courses <Compass className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    )
}
