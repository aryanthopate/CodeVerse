
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Gamepad2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Playground', href: '/playground', icon: Gamepad2 },
  { name: 'Courses', href: '/courses', icon: BookOpen },
];

export function FloatingNav() {
  const pathname = usePathname();

  // Hide the floating nav on admin pages or the main landing page
  if (pathname.startsWith('/admin') || pathname === '/') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
        <div className="group flex items-center gap-2 bg-white/90 dark:bg-black/80 backdrop-blur-lg p-2 rounded-full border border-white/10 shadow-lg transition-all duration-300 hover:gap-3">
        <TooltipProvider>
            {navItems.map((item) => (
            <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                <Link href={item.href}>
                    <div
                    className={cn(
                        'flex items-center gap-2 p-3 rounded-full transition-colors duration-300',
                        pathname.startsWith(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-black dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-800'
                    )}
                    >
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm font-medium hidden group-hover:block transition-all duration-300">
                        {item.name}
                    </span>
                    </div>
                </Link>
                </TooltipTrigger>
                <TooltipContent side="top" className="block group-hover:hidden">
                    <p>{item.name}</p>
                </TooltipContent>
            </Tooltip>
            ))}
        </TooltipProvider>
        </div>
    </div>
  );
}
