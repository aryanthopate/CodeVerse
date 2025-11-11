
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart } from 'lucide-react';
import { CourseWithChaptersAndTopics } from '@/lib/types';
import { cn } from '@/lib/utils';

export function CourseCard({ course }: { course: CourseWithChaptersAndTopics }) {
    
    return (
        <div className="group w-full h-[450px] [perspective:1000px]">
            <div className="relative h-full w-full rounded-xl shadow-xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                {/* Front of Card */}
                <div className="absolute inset-0">
                     <div className="relative flex w-full h-full flex-col rounded-xl bg-zinc-900 bg-clip-border text-gray-200 shadow-md">
                        <div className="relative mx-4 -mt-6 h-56 overflow-hidden rounded-xl bg-blue-gray-500 bg-clip-border text-white shadow-lg shadow-blue-500/40 bg-gradient-to-r from-blue-500 to-blue-600">
                           <Image
                                src={course.image_url || `https://picsum.photos/seed/${course.slug}/600/400`}
                                alt={course.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="p-6 flex flex-col flex-grow">
                            <h5 className="mb-2 block font-sans text-xl font-semibold leading-snug tracking-normal text-blue-gray-900 antialiased">
                                {course.name}
                            </h5>
                            <p className="block font-sans text-base font-light leading-relaxed text-inherit antialiased flex-grow">
                                {(course.description || '').substring(0, 100)}{course.description && course.description.length > 100 ? '...' : ''}
                            </p>
                        </div>
                        <div className="p-6 pt-0">
                             <Link href={`/courses/${course.slug}`} className="w-full">
                                <button
                                    className="select-none rounded-lg bg-blue-500 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/40 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                                    type="button"
                                >
                                    Read More
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Back of Card */}
                <div className="absolute inset-0 h-full w-full rounded-xl bg-zinc-900 px-12 text-center text-slate-200 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                    <div className="flex min-h-full flex-col items-center justify-center p-6">
                        <h3 className="text-xl font-bold mb-3">What you'll learn</h3>
                        <ul className="text-sm text-hp-text-muted space-y-1 mb-4 list-disc list-inside">
                             {(course.what_you_will_learn || []).slice(0, 3).map((item, index) => (
                                <li key={index} className="truncate">{item}</li>
                            ))}
                        </ul>
                         <div className="flex flex-wrap gap-2 justify-center mb-4">
                            {(course.tags || []).slice(0,3).map(tag => (
                                <Badge key={tag.text} className={cn("text-xs font-semibold", tag.color)}>
                                    {tag.text}
                                </Badge>
                            ))}
                        </div>
                        <div className="flex w-full gap-2 mt-auto">
                            <Button variant="outline" size="icon" className="border-hp-text-muted/50 hover:bg-hp-text-muted/20">
                                <Heart className="w-5 h-5" />
                            </Button>
                            <Button className="w-full bg-blue-500 hover:bg-blue-600">
                                <ShoppingCart className="mr-2 w-5 h-5"/> Add to Cart
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
