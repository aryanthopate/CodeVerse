
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

  if (!chat) {
    notFound();
  }
  
  // Transform DB messages to client-side format
  const transformedMessages: ChatMessage[] = (messages || []).map(msg => ({
    ...msg,
    content: [{ text: msg.content as string }]
  }));

  const activeChat: Chat & { messages: ChatMessage[] } = {
    ...chat,
    messages: transformedMessages,
  };

  return <ChatClient chats={chats || []} activeChat={activeChat} settings={settings} profile={profile} />;
}
