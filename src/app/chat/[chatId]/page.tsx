
import { getUserChats, getChat, getWebsiteSettings, getUserProfile } from '@/lib/supabase/queries';
import { ChatClient } from '../chat-client';
import { notFound } from 'next/navigation';
import type { Chat, ChatMessage } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function SpecificChatPage({ params }: { params: { chatId: string }}) {
  const chats = await getUserChats();
  const { chat, messages } = await getChat(params.chatId);
  const settings = await getWebsiteSettings();
  const profile = await getUserProfile();

  // A temporary ID means it's a new chat being created client-side.
  // We can treat it as valid here, but the getChat function will return null.
  // The client will handle the optimistic UI.
  if (!chat && !params.chatId.startsWith('temp-')) {
    notFound();
  }
  
  const activeChat: Chat & { messages: ChatMessage[] } | null = chat ? {
    ...chat,
    messages: (messages as unknown as ChatMessage[]) || [],
  } : null;

  return <ChatClient chats={chats || []} activeChat={activeChat} settings={settings} profile={profile} />;
}
