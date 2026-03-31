
'use server';

import { getUserChats, getWebsiteSettings, getUserProfile } from '@/lib/supabase/queries';
import { ChatClient } from '@/components/chat-client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function ChatPage() {
  const chats = await getUserChats();
  const settings = await getWebsiteSettings();
  const profile = await getUserProfile();

  const chatHomepageContent = (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <h1 className="text-4xl font-black tracking-tight mb-4">Chatlify AI</h1>
        <p className="mt-2 text-muted-foreground max-w-md font-medium text-lg mb-8">Your personal AI coding assistant. Start a new conversation to ask questions, get code explanations, and more.</p>
        <div className="mt-6">
            <Link href="/chat">
                <Button className="rounded-full px-8 h-12 text-base font-bold shadow-lg shadow-primary/20">
                    Start a New Chat
                </Button>
            </Link>
        </div>
    </div>
  );


  return <ChatClient chats={chats || []} activeChat={null} settings={settings} profile={profile} homepageContent={chatHomepageContent} />;
}
