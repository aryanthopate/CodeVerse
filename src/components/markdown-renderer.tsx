
'use client';

import React from 'react';
import { CodeBlock } from './code-block';

interface MarkdownRendererProps {
    content: string;
}

const renderInlineMarkdown = (text: string) => {
    // Escape HTML characters first to prevent them from being rendered
    let escapedText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Then apply markdown formatting
    return escapedText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>')           // Italic
        .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-1 rounded text-sm font-mono">$1</code>'); // Inline code
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    if (!content) return null;

    const parts = content.split(/(\[-----][\s\S]*?\[-----])/g);

    const elements = parts.map((part, index) => {
        if (part.startsWith('[-----]') && part.endsWith('[-----]')) {
            const code = part.substring(7, part.length - 7).trim();
            return <CodeBlock key={index} code={code} />;
        }
        
        // Handle headings and lists for non-code parts
        const lines = part.split('\n');
        const textElements = lines.map((line, lineIndex) => {
            if (line.startsWith('### ')) {
                return <h3 key={`${index}-${lineIndex}`} className="text-xl font-semibold mt-4 mb-2" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line.substring(4)) }} />;
            }
            if (line.startsWith('## ')) {
                return <h2 key={`${index}-${lineIndex}`} className="text-2xl font-bold mt-6 mb-3" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line.substring(3)) }} />;
            }
            if (line.startsWith('# ')) {
                return <h1 key={`${index}-${lineIndex}`} className="text-3xl font-bold mt-8 mb-4" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line.substring(2)) }} />;
            }
             if (line.match(/^(\*|\-)\s/)) {
                return <li key={`${index}-${lineIndex}`} className="ml-5 list-disc" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line.replace(/^(\*|\-)\s/, '')) }} />;
            }
             if (line.match(/^\d+\.\s/)) {
                return <li key={`${index}-${lineIndex}`} className="ml-5 list-decimal" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line.replace(/^\d+\.\s/, '')) }} />;
            }
            // For paragraphs, wrap in a div and handle inline markdown
            return <div key={`${index}-${lineIndex}`} dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line) || ' ' }} />;
        });
        
        return <div key={index}>{textElements}</div>;

    });

    return <div className="prose prose-sm dark:prose-invert max-w-none break-words">{elements}</div>;
};
