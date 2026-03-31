
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { createNewChat } from '@/lib/supabase/actions';
import { Loader2 } from 'lucide-react';

export function NewChatDialog({ children, onChatCreated }: { children: React.ReactNode; onChatCreated?: (chatId: string) => void; }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleCreateChat = async () => {
    if (!title.trim()) {
      toast({
        variant: 'destructive',
        title: 'Title is required',
        description: 'Please enter a title for your new chat.',
      });
      return;
    }

    setLoading(true);
    const newChat = await createNewChat(title);
    setLoading(false);

    if (newChat) {
      toast({
        title: 'Chat Created!',
        description: `Your new chat "${title}" is ready.`,
      });
      setRedirecting(true);
      if (onChatCreated) {
        onChatCreated(newChat.id);
        setIsOpen(false);
        setTitle('');
        setRedirecting(false);
      } else {
        router.push(`/chat/${newChat.id}`);
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to create chat',
        description: 'An unexpected error occurred. Please try again.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setTitle('');
        setLoading(false);
        setRedirecting(false);
      }
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a New Chat</DialogTitle>
          <DialogDescription>
            Give your new conversation a title to easily find it later.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="chat-title" className="sr-only">
            Chat Title
          </Label>
          <Input
            id="chat-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Python List Comprehensions"
            onKeyDown={(e) => { if (e.key === 'Enter' && !loading && !redirecting) handleCreateChat() }}
            disabled={loading || redirecting}
          />
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setIsOpen(false)} disabled={loading || redirecting}>
            Cancel
          </Button>
          <Button onClick={handleCreateChat} disabled={loading || redirecting}>
            {(loading || redirecting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Creating...' : redirecting ? 'Redirecting...' : 'Create Chat'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
