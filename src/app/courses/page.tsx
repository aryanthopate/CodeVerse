
'use client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getCoursesWithChaptersAndTopics } from '@/lib/supabase/queries';
import { CourseWithChaptersAndTopics, UserCourseProgress } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ListFilter, ShoppingCart, Heart, GitCompareArrows, Zap, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useDebounce } from 'use-debounce';

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
                        Please log in or create an account to perform this action.
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


export default function CoursesShopPage() {
  const [courses, setCourses] = useState<CourseWithChaptersAndTopics[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');
  const [user, setUser] = useState<User | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchInitialData = async () => {
        setLoading(true);
        const courseData = await getCoursesWithChaptersAndTopics();
        if (courseData) {
            setCourses(courseData);
        }
        
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        setLoading(false);
    }
    fetchInitialData();
  }, [supabase]);

  const filteredAndSortedCourses = useMemo(() => {
    let processedCourses = [...courses];

    // Filter by search term
    if (debouncedSearchTerm) {
      processedCourses = processedCourses.filter(course =>
        course.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
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
  }, [courses, debouncedSearchTerm, sortBy, filterBy]);
  
    const ActionButtons = () => {
        const buttonActions = (
            <div className="w-full flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <p className="text-xl text-primary font-bold">{courses[0]?.is_paid ? `₹${courses[0]?.price}` : 'Free'}</p>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon"><Heart className="h-5 w-5 text-muted-foreground hover:text-red-500"/></Button>
                        <Button variant="ghost" size="icon"><GitCompareArrows className="h-5 w-5 text-muted-foreground hover:text-primary"/></Button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button className="w-full"><ShoppingCart className="mr-2 h-4 w-4"/> Add to Cart</Button>
                    <Button variant="secondary" className="w-full"><Zap className="mr-2 h-4 w-4"/> Buy Now</Button>
                </div>
            </div>
        );

        if (!user) {
            return <AuthRequiredDialog>{buttonActions}</AuthRequiredDialog>
        }
        return buttonActions;
    }


  return (
    <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow pt-24 pb-12">
            <div className="container mx-auto space-y-8">
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
            
            {loading ? (
                <div className="text-center py-16">Loading courses...</div>
            ) : (
                /* Course Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAndSortedCourses.length > 0 ? (
                    filteredAndSortedCourses.map(course => {
                        const userProgress: UserCourseProgress | null = null; // This will be replaced with user progress data
                        
                        const actionButtons = (
                            <div className="w-full flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <p className="text-xl text-primary font-bold">{course.is_paid ? `₹${course.price}` : 'Free'}</p>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon"><Heart className="h-5 w-5 text-muted-foreground hover:text-red-500"/></Button>
                                        <Button variant="ghost" size="icon"><GitCompareArrows className="h-5 w-5 text-muted-foreground hover:text-primary"/></Button>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button className="w-full"><ShoppingCart className="mr-2 h-4 w-4"/> Add to Cart</Button>
                                    <Button variant="secondary" className="w-full"><Zap className="mr-2 h-4 w-4"/> Buy Now</Button>
                                </div>
                            </div>
                        );

                        return (
                        <Card key={course.id} className="bg-card/50 border-border/50 backdrop-blur-sm h-full flex flex-col transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20 overflow-hidden">
                            <Link href={`/courses/${course.slug}`} className="block">
                                <CardHeader className="p-0 relative">
                                    <Image src={course.image_url || `https://picsum.photos/seed/${course.slug}/600/300`} alt={course.name} width={600} height={300} className="w-full h-40 object-cover" data-ai-hint="abstract code" />
                                    {course.is_paid && (
                                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                                            PRO
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent className="p-6 flex-grow">
                                    <CardTitle className="text-xl font-bold">{course.name}</CardTitle>
                                    <CardDescription className="mt-2 text-sm">
                                    {(course.description || '').substring(0, 100)}{course.description && course.description.length > 100 ? '...' : ''}
                                    </CardDescription>
                                </CardContent>
                            </Link>
                            <CardFooter className="p-6 pt-0 mt-auto bg-muted/30">
                                {userProgress ? (
                                    <div className="w-full">
                                        <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-muted-foreground">Progress</span>
                                        <span className="text-sm font-bold text-primary">{userProgress.progress_percentage}%</span>
                                        </div>
                                        <Progress value={userProgress.progress_percentage} className="h-2" />
                                    </div>
                                ) : (
                                    !user ? <AuthRequiredDialog>{actionButtons}</AuthRequiredDialog> : actionButtons
                                )}
                            </CardFooter>
                        </Card>
                        );
                    })
                ) : (
                    <div className="md:col-span-2 lg:col-span-3 text-center py-16">
                        <p className="text-lg text-muted-foreground">No courses found matching your criteria.</p>
                    </div>
                )}
                </div>
            )}
            </div>
        </main>
        <Footer />
    </div>
  );
}

    