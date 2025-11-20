
import { getUserChats, getWebsiteSettings, getUserProfile } from '@/lib/supabase/queries';
import { ChatClient } from './chat-client';
import { NewChatDialog } from '@/components/new-chat-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const chats = await getUserChats();
  const settings = await getWebsiteSettings();
  const profile = await getUserProfile();

  // For the base /chat page, we show the "Chat Homepage" view
  // by passing activeChat as null.
  const chatHomepageContent = (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-3xl font-bold">Chatlify AI</h1>
        <p className="mt-2 text-muted-foreground max-w-md">Your personal AI coding assistant. Start a new conversation to ask questions, get code explanations, and more.</p>
        <div className="mt-6">
            <NewChatDialog>
                <Button>
                    <Plus className="mr-2"/> New Chat
                </Button>
            </NewChatDialog>
        </div>
    </div>
  );


  return <ChatClient chats={chats || []} activeChat={null} settings={settings} profile={profile} homepageContent={chatHomepageContent} />;
}
