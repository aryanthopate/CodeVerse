
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

function UpdatePasswordFormComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
         setError("Invalid or expired link. Please try resetting your password again.");
      }
      
      const errorCode = searchParams.get('error_code');
      if (errorCode === '401') {
        setError('The link has expired. Please request a new password reset link.');
      }
    }
    checkUser();
  }, [supabase, searchParams]);

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
      });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    } else {
      toast({
        title: "Password Updated",
        description: "You can now log in with your new password.",
      });
      router.push('/login');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background relative">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05] -z-10"></div>
        <Card className="mx-auto w-full max-w-md bg-card/50 border-border/50 backdrop-blur-lg">
            <CardHeader>
                <div className="flex justify-center mb-4">
                    <Logo />
                </div>
                <CardTitle className="text-3xl font-bold text-center">Update Your Password</CardTitle>
                <CardDescription className="text-center text-muted-foreground">
                    Enter a new password for your account.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {error ? (
                    <div className="text-center text-destructive p-4 bg-destructive/10 rounded-md">
                        <p>{error}</p>
                    </div>
                ) : (
                    <form onSubmit={handleUpdatePassword}>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    className="bg-background"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    required
                                    className="bg-background"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? 'Updating...' : 'Update Password'}
                            </Button>
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    </div>
  );
}


export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UpdatePasswordFormComponent />
    </Suspense>
  )
}
