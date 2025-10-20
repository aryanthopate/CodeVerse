'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { LayoutDashboard, BookCopy, Users, Home } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/lib/types';
import { AppHeader } from './app-header';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';

const adminNav = [
  { href: '/admin', icon: <LayoutDashboard />, label: 'Dashboard' },
  { href: '/admin/users', icon: <Users />, label: 'User Management' },
  { href: '/admin/courses', icon: <BookCopy />, label: 'Course Management' },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
          // Redundant check since middleware handles it, but good for client-side safety
          if (profileData.role !== 'admin') {
            router.push('/404');
          }
        }
      } else {
         router.push('/login');
      }
      setLoading(false);
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.push('/');
        } else if (session?.user) {
           const fetchProfile = async () => {
             const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user!.id).single();
             setProfile(profileData);
           }
           fetchProfile();
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p>Loading Admin Panel...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-muted/30 flex">
        <Sidebar className="p-0 m-0 h-full shrink-0 flex flex-col fixed left-0 top-0 w-[14rem]">
          <div className='p-2 h-full'>
            <div className="bg-card border rounded-xl h-full flex flex-col">
              <SidebarHeader>
                  <Logo />
              </SidebarHeader>
              <SidebarSeparator />
              <ScrollArea className="my-2">
                <SidebarContent className="flex-col">
                  <SidebarGroup>
                    <SidebarGroupLabel>ADMIN</SidebarGroupLabel>
                    <SidebarMenu>
                      {adminNav.map((item) => (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === item.href}
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
              </ScrollArea>
              <SidebarFooter>
                <Button variant="outline" asChild>
                    <Link href="/dashboard"><Home className="mr-2"/> Back to App</Link>
                </Button>
              </SidebarFooter>
            </div>
          </div>
        </Sidebar>

        <main className="flex-1 flex flex-col gap-2 p-2 pl-[calc(14rem+0.5rem)] h-screen">
          <div className="bg-card border rounded-xl flex flex-col">
            <AppHeader profile={profile} onLogout={handleLogout} />
          </div>
          <div className="flex-1 bg-card border rounded-xl p-4 md:p-6 lg:p-8 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
