
'use server';

import { getUserChats, getWebsiteSettings, getUserProfile } from '@/lib/supabase/queries';
import { ChatClient } from '@/components/chat-client';
import { NewChatDialog } from '@/components/new-chat-dialog';

export default async function ChatPage() {
  const chats = await getUserChats();
  const settings = await getWebsiteSettings();
  const profile = await getUserProfile();

  const chatHomepageContent = (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <h1 className="text-3xl font-bold">Chatlify AI</h1>
        <p className="mt-2 text-muted-foreground max-w-md">Your personal AI coding assistant. Start a new conversation to ask questions, get code explanations, and more.</p>
        <div className="mt-6">
            <NewChatDialog>
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                    Start a New Chat
                </button>
            </NewChatDialog>
        </div>
    </div>
  );


  return <ChatClient chats={chats || []} activeChat={null} settings={settings} profile={profile} homepageContent={chatHomepageContent} />;
}
