
'use client';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function NewsletterTerminal() {
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Email Required',
        description: 'Please enter your email address to subscribe.',
      });
      return;
    }
    // Mock subscription
    toast({
      title: 'Subscribed!',
      description: `Thanks for subscribing! We'll keep ${email} updated.`,
    });
    setEmail('');
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-3xl font-bold text-center mb-2">Stay in the Loop</h2>
      <p className="text-center text-muted-foreground mb-8 max-w-xl">
        Join our newsletter for the latest updates on new courses, game challenges, and exclusive offers. No spam, just pure code.
      </p>
      <div className="card">
        <div className="terminal">
          <div className="terminal-header">
            <span className="terminal-title">
              <svg
                className="terminal-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 17l6-6-6-6M12 19h8"></path>
              </svg>
              Subscribe
            </span>
          </div>
          <div className="terminal-body">
            <form onSubmit={handleSubmit} className="command-line">
              <span className="prompt">email:</span>
              <div className="input-wrapper">
                <input
                  type="email"
                  className="input-field"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
