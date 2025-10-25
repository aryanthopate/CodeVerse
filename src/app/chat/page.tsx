

import { getUserChats, getWebsiteSettings } from '@/lib/supabase/queries';
import { ChatClient } from './chat-client';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const chats = await getUserChats();
  const settings = await getWebsiteSettings();

  return <ChatClient chats={chats} activeChat={null} settings={settings} />;
}
