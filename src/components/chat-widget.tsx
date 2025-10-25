
'use client';
import { Button } from '@/components/ui/button';
import { Bot, X, Send, Paperclip } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from './ui/input';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // In a real implementation, you would fetch user's recent chats
  const recentChats = [
    { id: '1', title: 'How to use React Hooks' },
    { id: '2', title: 'Explaining Python decorators' },
  ]

  // Do not render the widget on any playground pages
  if (pathname.startsWith('/playground')) {
    return null;
  }

  return (
    <>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-8 right-8 h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30 transform transition-transform hover:scale-110"
          aria-label="AI Tutor"
        >
          {open ? <X className="h-8 w-8" /> : <Bot className="h-8 w-8" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 mr-4 mb-2 bg-card/80 backdrop-blur-lg border-primary/20 p-0 overflow-hidden">
        <div className="flex flex-col h-[60vh]">
          <div className="p-4 border-b border-border/50">
             <h4 className="font-medium leading-none">Chatlify AI</h4>
             <p className="text-sm text-muted-foreground mt-1">Your personal coding assistant.</p>
          </div>
          
          <div className="flex-grow p-4 space-y-4 overflow-y-auto">
             {/* This is where the chat messages would go */}
             <div className="text-center text-sm text-muted-foreground pt-12">
                Start a new conversation to see your messages here.
            </div>
          </div>
          
          <div className="p-4 border-t border-border/50">
            <div className="relative">
                <Input placeholder="Ask anything..." className="pr-20" />
                <div className="absolute top-1/2 right-2 transform -translate-y-1/2 flex gap-1">
                    <Button variant="ghost" size="icon">
                        <Paperclip className="h-5 w-5" />
                    </Button>
                    <Button size="icon">
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
    </>
  );
}
