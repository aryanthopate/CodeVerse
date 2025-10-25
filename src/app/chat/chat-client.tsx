
'use client';

import { useState, useEffect, useRef, startTransition } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Bot, User, Send, Paperclip, Plus, MessageSquare, Loader2, Home, LayoutDashboard, ChevronDown, MoreHorizontal, Archive, Trash2, Pin, ArrowUpRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Chat, ChatMessage, UserProfile, WebsiteSettings } from '@/lib/types';
import { chat as streamChat } from '@/ai/flows/chat';
import { createNewChat, saveChat, updateChat, deleteChat as deleteChatAction } from '@/lib/supabase/actions';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


interface ActiveChat extends Chat {
    messages: ChatMessage[];
}

export function ChatClient({ chats: initialChats, activeChat: initialActiveChat, settings, profile }: { chats: Chat[] | null, activeChat: ActiveChat | null, settings: WebsiteSettings | null, profile: UserProfile | null }) {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [chats, setChats] = useState(initialChats);
    const [activeChat, setActiveChat] = useState(initialActiveChat);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    useEffect(() => {
        setActiveChat(initialActiveChat);
    }, [initialActiveChat]);

    useEffect(() => {
        setChats(initialChats);
    }, [initialChats]);

    const scrollToBottom = () => {
        setTimeout(() => {
            if (scrollAreaRef.current) {
                const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
                if (viewport) {
                    viewport.scrollTop = viewport.scrollHeight;
                }
            }
        }, 100);
    };
    
    useEffect(() => {
        scrollToBottom();
    }, [activeChat?.messages, isStreaming]);

    const handleNewChat = () => {
        if (!params.chatId) {
             setActiveChat(null); // Clear view if already on new chat page
        } else {
             router.push('/chat');
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isStreaming) return;
        
        const userInput = { role: 'user', content: [{ text: input }] };
        const currentInput = input;
        setInput('');

        let currentChatId = activeChat?.id;
        let isNewChat = !activeChat || activeChat.id === 'anonymous';

        // Optimistically update UI
        setActiveChat(prev => {
            const newMessages = [...(prev?.messages || []), userInput as unknown as ChatMessage];
            if (isNewChat) {
                return {
                    id: 'anonymous',
                    title: currentInput,
                    user_id: profile?.id || 'anonymous',
                    created_at: new Date().toISOString(),
                    is_archived: false,
                    is_pinned: false,
                    messages: newMessages,
                };
            }
            return { ...prev!, messages: newMessages };
        });

        setIsStreaming(true);
        
        try {
             // 1. Create chat record if it's a new chat
            if (isNewChat && profile) {
                const newChat = await createNewChat(currentInput);
                if (newChat) {
                    isNewChat = false;
                    currentChatId = newChat.id;
                    // Replace URL and update client state without full reload
                    router.replace(`/chat/${newChat.id}`, { scroll: false });
                    setChats(prev => [newChat, ...(prev || [])]);
                    setActiveChat(prev => ({...prev!, id: newChat.id}));
                } else {
                    throw new Error("Failed to create new chat session.");
                }
            }
            
            const messagesForApi = activeChat ? [...activeChat.messages, userInput as ChatMessage] : [userInput as ChatMessage];

            const stream = await streamChat({ messages: messagesForApi as any });

            if (!stream) {
                 throw new Error("The AI service did not return a stream.");
            }
            
            setActiveChat(prev => ({
                ...prev!,
                messages: [...prev!.messages, { role: 'model', content: [{ text: '' }] } as unknown as ChatMessage]
            }));

            const reader = stream.getReader();
            const decoder = new TextDecoder();
            let streamedResponse = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                streamedResponse += chunk;

                setActiveChat(prev => {
                    if (!prev) return null;
                    const latestMessages = [...prev.messages];
                    const lastMessage = latestMessages[latestMessages.length - 1];
                    if (lastMessage && lastMessage.role === 'model') {
                        lastMessage.content = [{ text: streamedResponse }];
                    }
                    return { ...prev, messages: latestMessages };
                });
            }
            
            if (profile && currentChatId && currentChatId !== 'anonymous') {
                const finalMessages = [
                    ...messagesForApi,
                    { role: 'model', content: [{text: streamedResponse}] } as ChatMessage
                ];
                await saveChat(currentChatId, finalMessages);
                router.refresh();
            }

        } catch(error: any) {
            console.error("Error streaming chat:", error);
            toast({
                variant: 'destructive',
                title: "An error occurred",
                description: error.message || "Could not get a response from the AI. Please try again.",
            });
            // Rollback optimistic updates
            setActiveChat(prev => {
                if (!prev) return null;
                const rolledBackMessages = prev.messages.filter(m => m.role !== 'model'); // remove placeholder
                return {
                    ...prev,
                    messages: rolledBackMessages.slice(0, -1) // remove user message
                };
            });
        } finally {
            setIsStreaming(false);
        }
    };
    
    const handleChatAction = async (chatId: string, action: 'pin' | 'unpin' | 'archive' | 'unarchive' | 'delete') => {
        if (!profile) return;
        
        const chatToUpdate = chats?.find(c => c.id === chatId);
        if (!chatToUpdate) return;
        
        if (action === 'delete') {
            await deleteChatAction(chatId);
        } else {
             const updates: Partial<Chat> = {};
            if (action === 'pin') updates.is_pinned = true;
            if (action === 'unpin') updates.is_pinned = false;
            if (action === 'archive') updates.is_archived = true;
            if (action === 'unarchive') updates.is_archived = false;

            await updateChat(chatId, updates);
        }
        
        if (params.chatId === chatId && (action === 'delete' || action === 'archive')) {
            router.push('/chat');
        } else {
             // Re-fetch or optimistically update
            startTransition(() => {
                router.refresh();
            });
        }
    }

    if (!isClient) {
        return null; // Or a loading skeleton
    }

    const pinnedChats = chats?.filter(c => c.is_pinned && !c.is_archived) || [];
    const recentChats = chats?.filter(c => !c.is_pinned && !c.is_archived) || [];
    const archivedChats = chats?.filter(c => c.is_archived) || [];


    return (
        <div className="flex h-screen bg-background">
            <aside className="w-80 border-r border-border/50 flex-col hidden md:flex">
                <div className="p-4 border-b border-border/50">
                    <Button className="w-full rounded-xl" onClick={handleNewChat}>
                        <Plus className="mr-2" /> New Chat
                    </Button>
                </div>
                <ScrollArea className="flex-1">
                    <nav className="p-2 space-y-4">
                        {pinnedChats.length > 0 && (
                            <div>
                                <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pinned</h3>
                                <div className="space-y-1 mt-2">
                                    {pinnedChats.map(chatItem => (
                                        <ChatItem key={chatItem.id} chat={chatItem} onAction={handleChatAction} />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div>
                            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent</h3>
                            <div className="space-y-1 mt-2">
                                {recentChats.map(chatItem => (
                                    <ChatItem key={chatItem.id} chat={chatItem} onAction={handleChatAction} />
                                ))}
                            </div>
                        </div>
                    </nav>
                </ScrollArea>
                <div className="p-4 border-t border-border/50 space-y-2">
                     <Popover>
                        <PopoverTrigger asChild>
                           <Button variant="ghost" className="w-full justify-start text-muted-foreground">
                                <Archive className="mr-2"/> Archived Chats
                           </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-2" side="top" align="start">
                            <h3 className="p-2 font-semibold">Archived</h3>
                            {archivedChats.length > 0 ? (
                                <ScrollArea className="max-h-60">
                                {archivedChats.map(chatItem => (
                                    <ChatItem key={chatItem.id} chat={chatItem} onAction={handleChatAction} isArchived />
                                ))}
                                </ScrollArea>
                            ) : <p className="p-2 text-sm text-muted-foreground">No archived chats.</p>}
                        </PopoverContent>
                    </Popover>
                    <Popover>
                        <PopoverTrigger asChild>
                           <Button variant="outline" className="w-full rounded-xl justify-between">
                                Go Back
                               <ChevronDown className="w-4 h-4" />
                           </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-2" side="top" align="start">
                            <Link href="/dashboard" className="flex items-center p-2 text-sm rounded-md hover:bg-muted"><LayoutDashboard className="mr-2"/>Dashboard</Link>
                            <Link href="/" className="flex items-center p-2 text-sm rounded-md hover:bg-muted"><Home className="mr-2"/>Homepage</Link>
                        </PopoverContent>
                    </Popover>
                </div>
            </aside>

            <main className="flex-1 flex flex-col">
                <header className="p-4 border-b border-border/50 flex items-center justify-between gap-2 md:gap-4 shrink-0">
                    <div className='flex items-center gap-2'>
                        <Button className="md:hidden" variant="ghost" size="icon" asChild>
                            <Link href="/dashboard"><Home /></Link>
                        </Button>
                        <h1 className="text-xl font-semibold truncate">{activeChat?.title || 'Chatlify AI'}</h1>
                    </div>
                     {profile && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Avatar className="h-9 w-9 cursor-pointer">
                                    <AvatarImage src={profile.avatar_url || ''} />
                                    <AvatarFallback>{profile.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>Profile</DropdownMenuItem>
                                <DropdownMenuItem>Settings</DropdownMenuItem>
                                <DropdownMenuItem>Logout</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </header>
                <ScrollArea className="flex-1" ref={scrollAreaRef}>
                    <div className="p-6 space-y-6">
                        {activeChat?.messages.map((message, index) => {
                             const isUser = message.role === 'user';
                             const textContent = (message.content as any[])?.find(p => p.text)?.text || '';
                             
                             return (
                                <div key={index} className={cn("flex items-start gap-4", isUser ? 'justify-end' : 'justify-start')}>
                                     {!isUser && (
                                        <Avatar>
                                            <AvatarImage src={settings?.chat_bot_avatar_url || ''} />
                                            <AvatarFallback><Bot /></AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={cn(
                                        "max-w-2xl p-4 rounded-2xl prose prose-sm dark:prose-invert prose-p:my-0", 
                                        isUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                                    )}>
                                        <p className="whitespace-pre-wrap">{textContent}</p>
                                    </div>
                                    {isUser && profile && (
                                        <Avatar>
                                            <AvatarImage src={profile.avatar_url || ''} />
                                            <AvatarFallback>{profile.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                        </Avatar>
                                    )}
                                     {isUser && !profile && (
                                        <Avatar>
                                            <AvatarFallback><User /></AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                             )
                        })}
                         {(isStreaming && (!activeChat?.messages.length || activeChat.messages[activeChat.messages.length - 1]?.role !== 'model')) && (
                             <div className="flex items-start gap-4 justify-start">
                                <Avatar>
                                    <AvatarImage src={settings?.chat_bot_avatar_url || ''} />
                                    <AvatarFallback><Bot /></AvatarFallback>
                                </Avatar>
                                <div className="max-w-xl p-4 rounded-2xl bg-muted rounded-bl-none flex items-center">
                                    <Loader2 className="animate-spin text-muted-foreground w-5 h-5"/>
                                </div>
                            </div>
                        )}

                        {!activeChat && (
                            <div className="text-center text-muted-foreground pt-24">
                                <Bot className="mx-auto h-12 w-12" />
                                <h2 className="mt-2 text-lg font-semibold">Start a new conversation</h2>
                                <p>Ask me anything about code, concepts, or your courses.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="p-4 md:p-6 border-t border-border/50 shrink-0">
                     <div className="flex items-center gap-2">
                         <Button type="button" variant="ghost" size="icon" disabled={isStreaming} className="shrink-0">
                            <Paperclip className="h-5 w-5" />
                         </Button>
                        <form onSubmit={handleSubmit} className="flex-grow relative">
                            <Input
                                placeholder="Ask anything..."
                                className="pr-12 rounded-full h-12 bg-muted border-muted-foreground/20"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isStreaming}
                            />
                             <Button type="submit" size="icon" className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full disabled:cursor-not-allowed hover:scale-110 transition-transform" disabled={!input.trim() || isStreaming}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}


function ChatItem({ chat, onAction, isArchived = false }: { chat: Chat, onAction: (chatId: string, action: 'pin' | 'unpin' | 'archive' | 'unarchive' | 'delete') => void, isArchived?: boolean }) {
    const params = useParams();
    
    return (
        <div className="relative group">
            <Link href={`/chat/${chat.id}`} className="block">
                <div className={cn(
                    "flex items-center gap-3 p-3 rounded-xl text-sm hover:bg-muted",
                    params.chatId === chat.id && "bg-muted"
                )}>
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span className="truncate flex-1">{chat.title}</span>
                </div>
            </Link>
             <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                         {isArchived ? (
                             <DropdownMenuItem onClick={() => onAction(chat.id, 'unarchive')}>
                                 <Archive className="mr-2 h-4 w-4" /> Unarchive
                            </DropdownMenuItem>
                         ) : (
                            <>
                                <DropdownMenuItem onClick={() => onAction(chat.id, chat.is_pinned ? 'unpin' : 'pin')}>
                                    <Pin className="mr-2 h-4 w-4" /> {chat.is_pinned ? 'Unpin' : 'Pin'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onAction(chat.id, 'archive')}>
                                     <Archive className="mr-2 h-4 w-4" /> Archive
                                </DropdownMenuItem>
                            </>
                         )}
                        <DropdownMenuItem className="text-destructive" onClick={() => onAction(chat.id, 'delete')}>
                             <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

    