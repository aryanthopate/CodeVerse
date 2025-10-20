'use client';

import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCoursesWithChaptersAndTopics } from '@/lib/supabase/queries';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CourseWithChaptersAndTopics } from '@/lib/types';


export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<CourseWithChaptersAndTopics[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            const fetchedCourses = await getCoursesWithChaptersAndTopics();
            if (fetchedCourses) {
                setCourses(fetchedCourses);
            }
            setLoading(false);
        }
        fetchCourses();
    }, []);

    if (loading) {
        return <AdminLayout><div>Loading courses...</div></AdminLayout>
    }

    return (
        <AdminLayout>
             <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold">Course Management</h1>
                        <p className="text-lg text-muted-foreground mt-1">Edit, add, or remove courses.</p>
                    </div>
                    <Button asChild>
                        <Link href="/admin/courses/new">
                            <PlusCircle className="mr-2"/>
                            Add New Course
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Existing Courses</CardTitle>
                        <CardDescription>A list of all courses in the platform.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Course Name</TableHead>
                                    <TableHead>Chapters</TableHead>
                                    <TableHead>Topics</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {courses.map(course => (
                                    <TableRow key={course.id}>
                                        <TableCell className="font-medium">{course.name}</TableCell>
                                        <TableCell>{course.chapters.length}</TableCell>
                                        <TableCell>{course.chapters.reduce((acc, ch) => acc + ch.topics.length, 0)}</TableCell>
                                        <TableCell className="text-right">
                                             <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal />
                                                </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem>Edit</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    )
}