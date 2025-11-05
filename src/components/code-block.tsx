
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
        <div className="relative my-4 rounded-lg bg-gray-950 font-mono text-sm text-white border border-gray-800">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-800/50 rounded-t-lg border-b border-gray-800">
                <span className="text-xs text-gray-400">code</span>
                <button
                    onClick={onCopy}
                    className="flex items-center gap-1.5 p-1.5 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors text-xs"
                >
                    {hasCopied ? (
                        <>
                            <Check className="h-3.5 w-3.5" />
                            Copied
                        </>
                    ) : (
                        <>
                             <Copy className="h-3.5 w-3.5" />
                            Copy code
                        </>
                    )}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto bg-black/50">
                <code>{code}</code>
            </pre>
        </div>
    );
};
