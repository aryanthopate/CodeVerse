
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import './futuristic-button.css';
import './help-section.css';
import './newsletter-terminal.css';
import './newsletter-bg.css';
import './matrix-bg.css';
import { ChatWidget } from '@/components/chat-widget';
import { FloatingNav } from '@/components/floating-nav';

export const metadata: Metadata = {
  title: 'CodeVerse - Learn to Code, Playfully.',
  description: 'A next-gen coding learning platform with AI-powered guidance, interactive quizzes, and hands-on practice.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        {children}
        <Toaster />
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-end justify-center gap-2">
            <FloatingNav />
            <ChatWidget />
        </div>
      </body>
    </html>
  );
}
