
'use server';

import { getUserChats, getWebsiteSettings, getUserProfile } from '@/lib/supabase/queries';
import { ChatClient } from '@/components/chat-client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function ChatPage() {
  const chats = await getUserChats();
  const settings = await getWebsiteSettings();
  const profile = await getUserProfile();

  return <ChatClient chats={chats || []} activeChat={null} settings={settings} profile={profile} />;
}
