
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Mail, Send, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from './ui/dialog';

export function ContactForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 0 && email) {
      setStep(1); // Move to message step
    } else if (step === 1) {
      setIsLoading(true);
      // Mock sending email
      setTimeout(() => {
        setIsLoading(false);
        setStep(2); // Show success
      }, 1500);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form on close
      setTimeout(() => {
        setStep(0);
        setEmail('');
        setIsLoading(false);
      }, 300);
    }
  }

  const beforeHoverClass = "group-hover:bg-primary/90 group-hover:-translate-x-1 group-hover:-translate-y-1";
  const afterHoverClass = "group-hover:bg-primary/50 group-hover:translate-x-1 group-hover:translate-y-1";

  return (
    <>
      <div className="group fixed bottom-28 right-8 z-50">
        <div className={`absolute inset-0.5 rounded-full bg-primary/70 blur-lg transition-all duration-300 ${afterHoverClass}`}></div>
        <div className={`absolute inset-0.5 rounded-full bg-primary/70 blur-lg transition-all duration-300 ${beforeHoverClass}`}></div>
        <Button
          size="icon"
          onClick={() => handleOpenChange(true)}
          className="relative h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30"
          aria-label="Contact Us"
        >
          <Mail className="h-8 w-8" />
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl h-[24rem] p-0 bg-black border-gray-700 overflow-hidden">
          <div className="flex flex-col h-full bg-black text-gray-300 font-mono">
            {/* Window Header */}
            <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              </div>
              <span className="text-sm text-gray-400">contact@codeverse.dev</span>
              <button onClick={() => handleOpenChange(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Terminal Body */}
            <div className="flex-grow p-6 overflow-y-auto">
              {step === 0 && (
                <div className="animate-in fade-in-0 duration-500">
                  <p><span className="text-green-400">~</span> Hey there! We're excited to link 🔗</p>
                  <p className="mt-2"><span className="text-green-400">~</span> To start, could you give us your <span className="text-cyan-400">email</span>?</p>
                  <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
                    <span className="text-green-400">→ ~</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email:"
                      className="bg-transparent border-none focus:ring-0 focus:outline-none flex-grow"
                      autoFocus
                    />
                  </form>
                </div>
              )}
              {step === 1 && (
                <div className="animate-in fade-in-0 duration-500">
                  <p><span className="text-green-400">~</span> Awesome! What's on your mind?</p>
                   <form onSubmit={handleSubmit} className="mt-4">
                    <textarea
                      placeholder="Your message..."
                      className="bg-gray-900 border border-gray-700 rounded-md w-full h-24 p-2 focus:ring-primary focus:outline-none resize-none"
                      autoFocus
                    />
                    <Button type="submit" variant="ghost" className="mt-2 text-green-400 hover:bg-green-400/10 hover:text-green-300 px-2 py-1 h-auto">
                      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Send className="w-4 h-4 mr-2" />}
                      Send Message
                    </Button>
                  </form>
                </div>
              )}
              {step === 2 && (
                 <div className="animate-in fade-in-0 duration-500">
                    <p><span className="text-green-400">~</span> Message sent successfully!</p>
                    <p className="mt-2"><span className="text-green-400">~</span> We'll get back to you at <span className="text-cyan-400">{email}</span> soon.</p>
                    <p className="mt-4"><span className="text-green-400">~</span> You can close this window now.</p>
                 </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
