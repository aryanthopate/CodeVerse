"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { Home, BookOpen, BarChart2, NotebookText, User, Settings, LogOut } from 'lucide-react';
import { mockUser } from '@/lib/mock-data';
import { FloatingAIButton } from './floating-ai-button';

const navItems = [
  { href: '/dashboard', icon: <Home />, label: 'Home' },
  { href: '/courses', icon: <BookOpen />, label: 'My Courses' },
  { href: '/profile', icon: <BarChart2 />, label: 'Progress' },
  { href: '/leaderboard', icon: <BarChart2 />, label: 'Leaderboard' },
  { href: '/notes', icon: <NotebookText />, label: 'Notes' },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const totalXpForLevel = 2000;
  const xpProgress = useMemo(() => (mockUser.xp / totalXpForLevel) * 100, []);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{ children: item.label }}
                >
                  <Link href={item.href}>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex flex-col gap-3 p-2 rounded-lg bg-sidebar-accent/50 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:bg-transparent">
             <div className="flex items-center gap-3 p-2 group-data-[collapsible=icon]:p-0">
               <Avatar className="h-10 w-10">
                 <AvatarImage src={mockUser.avatarUrl} alt={mockUser.name} />
                 <AvatarFallback>{mockUser.name.charAt(0)}</AvatarFallback>
               </Avatar>
               <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                 <span className="font-semibold">{mockUser.name}</span>
                 <span className="text-sm text-muted-foreground">{mockUser.xp} XP</span>
               </div>
             </div>
             <div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
                <Progress value={xpProgress} className="h-2 bg-background" />
             </div>
          </div>
          
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={{ children: 'Settings' }}>
                <Link href="/settings">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={{ children: 'Logout' }}>
                <Link href="/">
                  <LogOut />
                  <span>Logout</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <main className="flex-1 p-4 md:p-8 overflow-auto relative">
          {children}
          <FloatingAIButton />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
