'use client';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from './ui/input';

export function FloatingAIButton() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-8 right-8 h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30 transform transition-transform hover:scale-110 animate-glow-pulse"
          aria-label="AI Tutor"
        >
          <Bot className="h-8 w-8" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 mr-4 mb-2 bg-card/80 backdrop-blur-lg border-primary/20">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">AI Tutor</h4>
            <p className="text-sm text-muted-foreground">
              Ask me anything about your code!
            </p>
          </div>
          <div className="grid gap-2">
            <Input placeholder="e.g., Explain this function..." />
            <Button>Ask</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
