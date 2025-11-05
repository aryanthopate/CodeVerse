
'use client';

import React from 'react';
import { CodeBlock } from './code-block';

interface MarkdownRendererProps {
    content: string;
}

// More advanced regex-based markdown parser
const parseMarkdown = (text: string) => {
    const elements: React.ReactNode[] = [];
    let remainingText = text;
    let key = 0;

    const parsers = [
        { regex: /\[-----]([\s\S]*?)\[-----]/g, render: (match: RegExpMatchArray) => <CodeBlock key={key++} code={match[1].trim()} /> },
        { regex: /### (.*?)(?=\n|\[-----]|$)/g, render: (match: RegExpMatchArray) => <h3 key={key++} className="text-xl font-semibold mt-4 mb-2">{match[1].trim()}</h3> },
        { regex: /## (.*?)(?=\n|\[-----]|$)/g, render: (match: RegExpMatchArray) => <h2 key={key++} className="text-2xl font-bold mt-6 mb-3">{match[1].trim()}</h2> },
        { regex: /# (.*?)(?=\n|\[-----]|$)/g, render: (match: RegExpMatchArray) => <h1 key={key++} className="text-3xl font-bold mt-8 mb-4">{match[1].trim()}</h1> },
        { regex: /(?:\n|^)((?:\*|\-)\s.*(?:\n|$))+/g, render: (match: RegExpMatchArray) => {
            const items = match[0].trim().split('\n').map((item, index) => (
                <li key={index} className="ml-5" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(item.replace(/(\*|\-)\s/, '')) }} />
            ));
            return <ul key={key++} className="list-disc pl-5 my-2">{items}</ul>;
        }},
         { regex: /(?:\n|^)((?:\d+\.)\s.*(?:\n|$))+/g, render: (match: RegExpMatchArray) => {
            const items = match[0].trim().split('\n').map((item, index) => (
                <li key={index} className="ml-5" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(item.replace(/\d+\.\s/, '')) }} />
            ));
            return <ol key={key++} className="list-decimal pl-5 my-2">{items}</ol>;
        }},
    ];

    while (remainingText.length > 0) {
        let bestMatch: { match: RegExpMatchArray, parserIndex: number } | null = null;

        for (let i = 0; i < parsers.length; i++) {
            const parser = parsers[i];
            const match = parser.regex.exec(remainingText);
            if (match && (!bestMatch || match.index < bestMatch.match.index)) {
                bestMatch = { match, parserIndex: i };
            }
        }


        if (bestMatch) {
            const { match, parserIndex } = bestMatch;
            const plainText = remainingText.substring(0, match.index);
            if (plainText) {
                elements.push(<div key={key++} className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(plainText) }} />);
            }

            elements.push(parsers[parserIndex].render(match));
            remainingText = remainingText.substring(match.index + match[0].length);
        } else {
            elements.push(<div key={key++} className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(remainingText) }} />);
            break;
        }
    }

    return elements;
};

const renderInlineMarkdown = (text: string) => {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-1 rounded text-sm font-mono">$1</code>')
        .replace(/\n/g, '<br />');
};


export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    if (!content) return null;
    const parsedElements = parseMarkdown(content);
    return <div className="prose prose-sm dark:prose-invert max-w-none break-words">{parsedElements}</div>;
};
