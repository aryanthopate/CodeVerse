
'use client';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getCoursesWithChaptersAndTopics } from '@/lib/supabase/queries';
import { CourseWithChaptersAndTopics, UserCourseProgress } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ListFilter } from 'lucide-react';

export default function CoursesShopPage() {
  const [courses, setCourses] = useState<CourseWithChaptersAndTopics[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    const fetchCourses = async () => {
        const courseData = await getCoursesWithChaptersAndTopics();
        if (courseData) {
            setCourses(courseData);
        }
        setLoading(false);
    }
    fetchCourses();
  }, []);

  const filteredAndSortedCourses = useMemo(() => {
    let processedCourses = [...courses];

    // Filter by search term
    if (searchTerm) {
      processedCourses = processedCourses.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by price
    if (filterBy === 'free') {
        processedCourses = processedCourses.filter(course => !course.is_paid);
    } else if (filterBy === 'paid') {
        processedCourses = processedCourses.filter(course => course.is_paid);
    }

    // Sort courses
    switch (sortBy) {
        case 'name-asc':
            processedCourses.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            processedCourses.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'newest':
            processedCourses.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            break;
        case 'oldest':
            processedCourses.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            break;
        default:
            break;
    }

    return processedCourses;
  }, [courses, searchTerm, sortBy, filterBy]);

  if (loading) {
    return <AppLayout><div>Loading courses...</div></AppLayout>
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Explore Courses</h1>
          <p className="text-lg text-muted-foreground mt-2">Find your next coding adventure. Search, filter, and sort our growing library of courses.</p>
        </div>

        {/* Filter and Sort Controls */}
        <div className="p-4 bg-card/50 rounded-xl border border-border/50 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Search courses by name or description..."
                    className="pl-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex gap-4 w-full md:w-auto">
                <Select value={filterBy} onValueChange={setFilterBy}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <ListFilter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter by..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Sort by: Newest</SelectItem>
                        <SelectItem value="oldest">Sort by: Oldest</SelectItem>
                        <SelectItem value="name-asc">Sort by: A-Z</SelectItem>
                        <SelectItem value="name-desc">Sort by: Z-A</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAndSortedCourses.length > 0 ? (
            filteredAndSortedCourses.map(course => {
                const userProgress: UserCourseProgress | null = null; // This will be replaced with user progress data
                return (
                <Link href={`/courses/${course.slug}`} key={course.id}>
                    <Card className="bg-card/50 border-border/50 backdrop-blur-sm h-full flex flex-col transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20">
                    <CardHeader className="p-0 relative">
                        <Image src={course.image_url || `https://picsum.photos/seed/${course.slug}/600/300`} alt={course.name} width={600} height={300} className="w-full h-40 object-cover rounded-t-lg" data-ai-hint="abstract code" />
                        {course.is_paid && (
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                                PRO
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="p-6 flex-grow">
                        <CardTitle className="text-2xl font-bold">{course.name}</CardTitle>
                        <CardDescription className="mt-2 text-sm">{course.description}</CardDescription>
                    </CardContent>
                    <CardFooter className="p-6 pt-0">
                        {userProgress ? (
                        <div className="w-full">
                            <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-muted-foreground">Progress</span>
                            <span className="text-sm font-bold text-primary">{userProgress.progress_percentage}%</span>
                            </div>
                            <Progress value={userProgress.progress_percentage} className="h-2" />
                        </div>
                        ) : (
                        <p className="text-sm text-accent font-semibold">{course.is_paid ? `₹${course.price}` : 'Start Learning'}</p>
                        )}
                    </CardFooter>
                    </Card>
                </Link>
                );
            })
          ) : (
            <div className="md:col-span-2 lg:col-span-3 text-center py-16">
                <p className="text-lg text-muted-foreground">No courses found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
