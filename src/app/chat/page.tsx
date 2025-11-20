
'use server';

import { getUserChats, getWebsiteSettings, getUserProfile } from '@/lib/supabase/queries';
import { ChatClient } from '@/components/chat-client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function ChatPage() {
  const chats = await getUserChats();
  const settings = await getWebsiteSettings();
  const profile = await getUserProfile();

  const chatHomepageContent = (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <h1 className="text-3xl font-bold">Chatlify AI</h1>
        <p className="mt-2 text-muted-foreground max-w-md">Your personal AI coding assistant. Start a new conversation to ask questions, get code explanations, and more.</p>
        <div className="mt-6">
             <Button asChild>
                <Link href="/chat">
                    <Plus className="mr-2"/> New Chat
                </Link>
            </Button>
        </div>
    </div>
  );


  return <ChatClient chats={chats || []} activeChat={null} settings={settings} profile={profile} homepageContent={chatHomepageContent} />;
}
