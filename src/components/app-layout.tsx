"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { Home, BookOpen, BarChart2, NotebookText, Settings, LogOut, Search, User } from 'lucide-react';
import { FloatingAIButton } from './floating-ai-button';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { UserProfile } from '@/lib/types';
import { AppHeader } from './app-header';

const navItems = [
  { href: '/dashboard', icon: <Home />, label: 'Dashboard' },
  { href: '/courses', icon: <BookOpen />, label: 'My Courses' },
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
        const { data: profileData } = await supabase
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
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
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
                  isActive={pathname.startsWith(item.href)}
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
              <SidebarMenuButton onClick={handleLogout} tooltip={{ children: 'Logout' }}>
                  <LogOut />
                  <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <main className="flex-1 flex flex-col relative">
        <AppHeader profile={profile} onLogout={handleLogout} />
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </div>
        <FloatingAIButton />
      </main>
    </SidebarProvider>
  );
}
