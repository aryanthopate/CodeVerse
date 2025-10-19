"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
import { FloatingAIButton } from './floating-ai-button';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { UserProfile } from '@/lib/types';


const navItems = [
  { href: '/u/dashboard', icon: <Home />, label: 'Home' },
  { href: '/courses', icon: <BookOpen />, label: 'My Courses' },
  { href: '/u/profile', icon: <BarChart2 />, label: 'Progress' },
  { href: '/u/leaderboard', icon: <BarChart2 />, label: 'Leaderboard' },
  { href: '/u/notes', icon: <NotebookText />, label: 'Notes' },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [supabase, supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const totalXpForLevel = 2000;
  const xpProgress = useMemo(() => ( (profile?.xp || 0) / totalXpForLevel) * 100, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p>Loading...</p>
      </div>
    );
  }

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
                 <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || 'User'} />
                 <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
               </Avatar>
               <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                 <span className="font-semibold">{profile?.full_name || 'User'}</span>
                 <span className="text-sm text-muted-foreground">{profile?.xp || 0} XP</span>
               </div>
             </div>
             <div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
                <Progress value={xpProgress} className="h-2 bg-background" />
             </div>
          </div>
          
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={{ children: 'Settings' }}>
                <Link href="/u/settings">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip={{ children: 'Logout' }}>
                  <LogOut />
                  <span>Logout</span>
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
