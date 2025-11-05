
'use client';

import React from 'react';
import { CodeBlock } from './code-block';

interface MarkdownRendererProps {
    content: string;
}

// Simple regex-based markdown parser
const parseMarkdown = (text: string) => {
    let remainingText = text;
    const elements = [];
    let key = 0;

    const codeBlockRegex = /\[CODE_STARTED\]([\s\S]*?)\[CODE_ENDED\]/g;
    
    let lastIndex = 0;
    let match;

    while((match = codeBlockRegex.exec(remainingText)) !== null) {
        // Text before the code block
        if (match.index > lastIndex) {
            const plainText = remainingText.substring(lastIndex, match.index);
            elements.push(<span key={key++} dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(plainText) }} />);
        }

        // The code block itself
        const code = match[1].trim();
        elements.push(<CodeBlock key={key++} code={code} />);

        lastIndex = match.index + match[0].length;
    }
    
    // Any remaining text after the last code block
    if (lastIndex < remainingText.length) {
        const plainText = remainingText.substring(lastIndex);
        elements.push(<span key={key++} dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(plainText) }} />);
    }

    return elements;
};

// This handles simple inline markdown like bold and italic.
const renderInlineMarkdown = (text: string) => {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>')
        .replace(/\n/g, '<br />'); // Convert newlines to breaks for simple text
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    const parsedElements = parseMarkdown(content);
    return <div className="prose prose-sm dark:prose-invert max-w-none break-words whitespace-pre-wrap">{parsedElements}</div>;
};
