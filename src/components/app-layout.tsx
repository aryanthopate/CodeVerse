"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarInset,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { LayoutDashboard, BookOpen, Compass, Share2 } from 'lucide-react';
import { FloatingAIButton } from './floating-ai-button';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { UserProfile } from '@/lib/types';
import { AppHeader } from './app-header';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const mainNav = [
  { href: '/dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
];

const coursesNav = [
  { href: '/courses', icon: <BookOpen />, label: 'My Courses' },
  { href: '/courses/explore', icon: <Compass />, label: 'Explore' },
]

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

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/');
      } else {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };

  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-muted/30">
        <Sidebar variant="inset" collapsible="icon" className="p-2">
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarSeparator className="my-2" />
          <SidebarContent>
              <SidebarGroup>
                  <SidebarGroupLabel>MAIN</SidebarGroupLabel>
                  <SidebarMenu>
                  {mainNav.map((item) => (
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
              </SidebarGroup>
              <SidebarGroup>
                  <SidebarGroupLabel>COURSES</SidebarGroupLabel>
                  <SidebarMenu>
                  {coursesNav.map((item) => (
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
              </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
              <Card className="bg-sidebar-accent/50 text-center p-4 m-2">
                  <CardHeader className="p-2">
                      <div className="mx-auto bg-background rounded-full p-2 w-fit">
                          <Share2 className="text-primary"/>
                      </div>
                  </CardHeader>
                  <CardContent className="p-0">
                      <CardTitle className="text-base">Share The App</CardTitle>
                      <CardDescription className="text-xs mt-1 mb-3">Invite a friend to conquer their goals with you!</CardDescription>
                      <Button size="sm" className="w-full">Invite Now</Button>
                  </CardContent>
              </Card>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
           <div className="flex flex-col w-full gap-2 p-2">
              <div style={{ marginTop: '-2px' }}>
                <AppHeader profile={profile} onLogout={handleLogout} />
              </div>
              <main className="flex-1 p-4 md:p-6 lg:p-8 bg-card rounded-xl border border-border">
                  {children}
              </main>
           </div>
          <FloatingAIButton />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
