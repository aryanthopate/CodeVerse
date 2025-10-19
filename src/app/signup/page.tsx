import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { Github } from 'lucide-react';
import Image from 'next/image';

export default function SignupPage() {
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <Logo className="justify-center mb-2" />
            <h1 className="text-3xl font-bold">Join CodeVerse</h1>
            <p className="text-balance text-muted-foreground">
              Start your playful coding journey today.
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input id="full-name" placeholder="Aryan Sharma" required className="bg-background"/>
            </div>
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
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required className="bg-background"/>
            </div>
            <Button type="submit" className="w-full" asChild>
                <Link href="/dashboard">Create an account</Link>
            </Button>
            <Button variant="outline" className="w-full">
              <Github className="mr-2 h-4 w-4" />
              Sign up with GitHub
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline text-primary">
              Login
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative">
        <Image
          src="https://picsum.photos/seed/signup/1200/1800"
          alt="Image"
          width="1200"
          height="1800"
          className="h-full w-full object-cover dark:brightness-[0.3]"
          data-ai-hint="neon data stream"
        />
         <div className="absolute bottom-0 left-0 p-8 text-white">
            <div className="p-4 bg-black/50 rounded-xl backdrop-blur-lg">
                <h2 className="text-3xl font-bold">"The best way to predict the future is to invent it."</h2>
                <p className="text-lg mt-2">- Alan Kay</p>
            </div>
        </div>
      </div>
    </div>
  );
}
