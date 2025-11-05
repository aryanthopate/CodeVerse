
'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CodeBlockProps {
    code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code }) => {
    const [hasCopied, setHasCopied] = useState(false);
    const { toast } = useToast();

    const onCopy = () => {
        if (hasCopied) return;
        
        navigator.clipboard.writeText(code).then(() => {
            setHasCopied(true);
            setTimeout(() => {
                setHasCopied(false);
            }, 2000);
            toast({ title: "Code Copied!", description: "The code block has been copied to your clipboard."});
        });
    };

    return (
        <div className="relative my-4 rounded-lg bg-gray-900 font-mono text-sm text-white">
            <div className="absolute top-2 right-2">
                <button
                    onClick={onCopy}
                    className="p-1.5 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                >
                    {hasCopied ? (
                        <Check className="h-4 w-4" />
                    ) : (
                        <Copy className="h-4 w-4" />
                    )}
                    <span className="sr-only">Copy code</span>
                </button>
            </div>
            <pre className="p-4 pt-10 overflow-x-auto">
                <code>{code}</code>
            </pre>
        </div>
    );
};
