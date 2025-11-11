
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X, Shield, ShoppingCart, Heart, Gamepad2, LogIn, ArrowRight, MessageSquare, BookOpen, Compass, GitCompareArrows } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from './ui/dropdown-menu';
import { LogOut, User, Settings } from 'lucide-react';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const isPlayground = pathname.startsWith('/playground');

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
      }
      setLoading(false);
    };
    getProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(data);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    router.push('/');
    router.refresh();
  };

  const navLinks = [
    { name: 'Courses', href: '/courses', icon: <BookOpen className="h-4 w-4" /> },
    { name: 'Playground', href: '/playground', icon: <Gamepad2 className="h-4 w-4" /> },
    { name: 'Chatify', href: '/chat', icon: <MessageSquare className="h-4 w-4" /> },
  ];
  
  const userDropdownLinks = [
      { name: 'Dashboard', href: '/dashboard', icon: <User className="mr-2 h-4 w-4" /> },
      { name: 'Settings', href: '/settings', icon: <Settings className="mr-2 h-4 w-4" /> },
      { name: 'Cart', href: '/cart', icon: <ShoppingCart className="mr-2 h-4 w-4" /> },
      { name: 'Wishlist', href: '/wishlist', icon: <Heart className="mr-2 h-4 w-4" /> },
      { name: 'Compare', href: '/compare', icon: <GitCompareArrows className="mr-2 h-4 w-4" /> },
  ];

  const user = profile;
  const navLinkClasses = "group flex items-center gap-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white";

  return (
    <header className={cn(
        "fixed left-0 right-0 top-0 z-50 py-3 backdrop-blur-lg",
        isPlayground ? "bg-[hsl(var(--game-bg))]/50 border-b border-[hsl(var(--game-border))]" : "bg-zinc-950/50 border-b border-zinc-800"
    )}>
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo isGameTheme={isPlayground} />
            <div className="hidden md:block">
              <ul className="flex gap-6">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className={cn(navLinkClasses, pathname.startsWith(link.href) && 'text-primary')}>
                      {link.icon}
                      <span>{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loading ? null : user ? (
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2 p-1 rounded-full h-auto">
                          <Avatar className="h-9 w-9">
                              <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || ''} />
                              <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="hidden md:inline font-semibold text-zinc-200">{user.full_name}</span>
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>{user.full_name}</DropdownMenuLabel>
                      {user.role === 'admin' && (
                          <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                              <Link href="/admin"><Shield className="mr-2 h-4 w-4" />Admin Panel</Link>
                          </DropdownMenuItem>
                          </>
                      )}
                      <DropdownMenuSeparator />
                       {userDropdownLinks.map(link => (
                           <DropdownMenuItem key={link.href} asChild>
                               <Link href={link.href}>{link.icon}{link.name}</Link>
                           </DropdownMenuItem>
                       ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                      </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                 <Button variant="ghost" asChild className="hidden sm:inline-flex text-zinc-100 transition-all hover:scale-[1.02] hover:bg-zinc-800 hover:text-zinc-50 active:scale-[0.98] rounded-md px-4 py-1 text-base">
                    <Link href="/login">Sign In</Link>
                </Button>
                 <Button asChild className="rounded-md bg-gradient-to-br from-primary to-accent text-primary-foreground ring-2 ring-primary/50 ring-offset-2 ring-offset-zinc-950 transition-all hover:scale-[1.02] hover:ring-transparent active:scale-[0.98] active:ring-primary/70 px-4 py-1.5 text-sm font-bold">
                    <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
             <div className="md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className={cn("w-full bg-zinc-950/95 backdrop-blur-xl border-l-zinc-800", isPlayground && "bg-[hsl(var(--game-bg))]/95 border-l-[hsl(var(--game-border))]")}>
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                            <Logo isGameTheme={isPlayground} />
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <X className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                        </div>
                        <nav className="flex-grow mt-8">
                             <ul className="flex flex-col gap-6">
                                {navLinks.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="flex items-center gap-3 text-lg font-medium text-zinc-200" onClick={() => setIsOpen(false)}>
                                    {link.icon}
                                    {link.name}
                                    </Link>
                                </li>
                                ))}
                            </ul>
                        </nav>
                         {user && (
                            <div className="mt-auto border-t border-zinc-800 pt-4 space-y-2">
                               {userDropdownLinks.map(link => (
                                    <Link key={link.href} href={link.href} className="flex items-center gap-3 text-md font-medium text-zinc-300" onClick={() => setIsOpen(false)}>
                                        {link.icon}
                                        {link.name}
                                    </Link>
                               ))}
                                <Button variant="outline" onClick={handleLogout} className="w-full justify-start gap-3 text-md">
                                    <LogOut className="mr-2 h-4 w-4" /> Logout
                                </Button>
                            </div>
                        )}
                    </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
