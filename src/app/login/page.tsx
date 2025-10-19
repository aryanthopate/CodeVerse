'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Pencil } from 'lucide-react';


export default function LoginPage() {
  const [email, setEmail] = useState('m@example.com');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [timer, setTimer] = useState(60);
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOtpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      // Optional: auto-reset or enable resend button
    }
    return () => clearInterval(interval);
  }, [isOtpSent, timer]);

  const handleSendOtp = () => {
    // Logic to send OTP would go here
    setIsOtpSent(true);
    setTimer(60); // Reset timer on send/resend
    setIsEditingEmail(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset state when dialog is closed
      setIsOtpSent(false);
      setTimer(60);
      setIsEditingEmail(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background relative">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05] -z-10"></div>
      <Card className="mx-auto w-full max-w-md bg-card/50 border-border/50 backdrop-blur-lg">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-3xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                className="bg-background"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                 <AlertDialog onOpenChange={handleOpenChange}>
                    <AlertDialogTrigger asChild>
                        <Button variant="link" className="ml-auto inline-block text-sm underline p-0 h-auto">
                            Forgot your password?
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Reset Password</AlertDialogTitle>
                        <AlertDialogDescription>
                            {isOtpSent 
                                ? `An OTP has been sent to your email. Please enter it below.`
                                : "We'll send a One-Time Password (OTP) to your email to reset your password."
                            }
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        
                        <div className="space-y-4 my-4">
                             <div className="flex items-center gap-2">
                                {isEditingEmail || !isOtpSent ? (
                                    <Input 
                                        type="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-input"
                                    />
                                ) : (
                                    <p className="font-medium text-sm flex-1">{email}</p>
                                )}
                                {isOtpSent && (
                                    <Button variant="ghost" size="icon" onClick={() => setIsEditingEmail(!isEditingEmail)}>
                                        <Pencil className="w-4 h-4"/>
                                    </Button>
                                )}
                            </div>
                            
                            {isOtpSent && (
                                <div className="grid gap-2">
                                    <Label htmlFor="otp">Enter OTP</Label>
                                    <Input id="otp" placeholder="_ _ _ _ _ _" className="tracking-[0.5em] text-center bg-input" maxLength={6}/>
                                </div>
                            )}
                        </div>

                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            {!isOtpSent ? (
                                <AlertDialogAction onClick={handleSendOtp}>Send OTP</AlertDialogAction>
                            ) : (
                               <div className="flex items-center gap-4">
                                     <Button
                                        variant="secondary"
                                        onClick={handleSendOtp}
                                        disabled={timer > 0}
                                    >
                                        Resend OTP {timer > 0 && `in ${timer}s`}
                                    </Button>
                                    <AlertDialogAction>Verify & Reset</AlertDialogAction>
                               </div>
                            )}
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </div>
              <Input id="password" type="password" required className="bg-background"/>
            </div>
            <Button type="submit" className="w-full" asChild>
                <Link href="/dashboard">Login</Link>
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline text-primary">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}