

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Bot, User, Send, Paperclip, Plus, MessageSquare, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Chat, ChatMessage, WebsiteSettings } from '@/lib/types';
import { chat as streamChat } from '@/ai/flows/chat';

interface ActiveChat extends Chat {
    messages: ChatMessage[];
}

export function ChatClient({ chats: initialChats, activeChat: initialActiveChat, settings }: { chats: Chat[] | null, activeChat: ActiveChat | null, settings: WebsiteSettings | null }) {
    const router = useRouter();
    const params = useParams();
    const [chats, setChats] = useState(initialChats);
    const [activeChat, setActiveChat] = useState(initialActiveChat);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        setActiveChat(initialActiveChat);
    }, [initialActiveChat]);

    useEffect(() => {
        setChats(initialChats);
    }, [initialChats]);

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    };
    
    useEffect(() => {
        scrollToBottom();
    }, [activeChat?.messages]);


    const handleNewChat = () => {
        router.push('/chat');
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isStreaming) return;
        
        const userInput = { role: 'user', content: [{ text: input }] };
        setInput('');
        
        // This is a temporary update for immediate UI feedback.
        setActiveChat(prev => {
            if (!prev) {
                return {
                    id: 'temp-id',
                    title: 'New Chat',
                    created_at: new Date().toISOString(),
                    user_id: '',
                    messages: [userInput as unknown as ChatMessage]
                };
            }
            return {
                ...prev,
                messages: [...prev.messages, userInput as unknown as ChatMessage]
            };
        });

        setIsStreaming(true);
        const allMessages = activeChat ? [...activeChat.messages, userInput] : [userInput];

        try {
            const { chunks } = await streamChat({ messages: allMessages as any });
            let streamedResponse = '';

            for await (const chunk of chunks) {
                streamedResponse += chunk;
                setActiveChat(prev => {
                    const latestMessages = prev!.messages;
                    const lastMessage = latestMessages[latestMessages.length - 1];

                    if (lastMessage.role === 'model') {
                        // Update existing model message
                         const updatedContent = [{ text: streamedResponse }];
                         lastMessage.content = updatedContent;
                         return { ...prev!, messages: [...latestMessages] };

                    } else {
                        // Add new model message
                        return {
                            ...prev!,
                            messages: [...latestMessages, { role: 'model', content: [{ text: streamedResponse }] } as unknown as ChatMessage]
                        };
                    }
                });
            }
            
            // After streaming, force revalidation to get the real data from the server.
            router.refresh();


        } catch(error) {
            console.error("Error streaming chat:", error);
            // Optionally show an error message in the UI
        } finally {
            setIsStreaming(false);
        }
    };


    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-72 border-r border-border/50 flex flex-col">
                <div className="p-4 border-b border-border/50">
                    <Button className="w-full" onClick={handleNewChat}>
                        <Plus className="mr-2" /> New Chat
                    </Button>
                </div>
                <ScrollArea className="flex-1">
                    <nav className="p-2 space-y-1">
                        {chats?.map(chatItem => (
                            <Link key={chatItem.id} href={`/chat/${chatItem.id}`}>
                                <div className={cn(
                                    "flex items-center gap-2 p-2 rounded-md text-sm hover:bg-muted",
                                    params.chatId === chatItem.id && "bg-primary/20 text-primary-foreground"
                                )}>
                                    <MessageSquare className="w-4 h-4" />
                                    <span className="truncate flex-1">{chatItem.title}</span>
                                </div>
                            </Link>
                        ))}
                    </nav>
                </ScrollArea>
                <div className="p-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">User settings will go here.</p>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col">
                <header className="p-4 border-b border-border/50">
                    <h1 className="text-xl font-semibold">{activeChat?.title || 'Chatlify AI'}</h1>
                </header>
                <div className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
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
                                    <div className={cn("max-w-2xl p-4 rounded-lg", isUser ? "bg-primary text-primary-foreground" : "bg-muted")}>
                                        <p className="whitespace-pre-wrap">{textContent}</p>
                                    </div>
                                    {isUser && (
                                        <Avatar>
                                            <AvatarFallback><User /></AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                             )
                        })}
                         {isStreaming && activeChat?.messages[activeChat.messages.length - 1]?.role !== 'model' && (
                             <div className="flex items-start gap-4 justify-start">
                                <Avatar>
                                    <AvatarImage src={settings?.chat_bot_avatar_url || ''} />
                                    <AvatarFallback><Bot /></AvatarFallback>
                                </Avatar>
                                <div className="max-w-2xl p-4 rounded-lg bg-muted">
                                    <Loader2 className="animate-spin"/>
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
                </div>
                <div className="p-6 border-t border-border/50">
                    <form onSubmit={handleSubmit} className="relative">
                        <Input
                            placeholder="Ask anything..."
                            className="pr-24"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isStreaming}
                        />
                        <div className="absolute top-1/2 right-2 transform -translate-y-1/2 flex gap-1">
                            <Button type="button" variant="ghost" size="icon" disabled={isStreaming}>
                                <Paperclip className="h-5 w-5" />
                            </Button>
                            <Button type="submit" size="icon" disabled={!input.trim() || isStreaming}>
                                <Send className="h-5 w-5" />
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}

