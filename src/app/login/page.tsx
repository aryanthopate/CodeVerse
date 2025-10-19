import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { Github, Code } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <Logo className="justify-center mb-2" />
            <h1 className="text-3xl font-bold">Welcome Back</h1>
            <p className="text-muted-foreground">
              Enter your email below to login to your account
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="#"
                  className="ml-auto inline-block text-sm underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <Input id="password" type="password" required className="bg-background"/>
            </div>
            <Button type="submit" className="w-full" asChild>
                <Link href="/dashboard">Login</Link>
            </Button>
            <Button variant="outline" className="w-full">
              <Github className="mr-2 h-4 w-4" />
              Login with Github
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline text-primary">
              Sign up
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative">
        <Image
          src="https://picsum.photos/seed/login/1200/1800"
          alt="Image"
          width="1200"
          height="1800"
          className="h-full w-full object-cover dark:brightness-[0.3]"
          data-ai-hint="futuristic abstract"
        />
        <div className="absolute bottom-0 left-0 p-8 text-white">
            <div className="p-4 bg-black/50 rounded-xl backdrop-blur-lg">
                <h2 className="text-3xl font-bold">"Code is like humor. When you have to explain it, it’s bad."</h2>
                <p className="text-lg mt-2">- Cory House</p>
            </div>
        </div>
      </div>
    </div>
  );
}
