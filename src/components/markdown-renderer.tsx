
'use client';

import React from 'react';
import { CodeBlock } from './code-block';
import { Lightbulb, Code } from 'lucide-react';
import { Button } from './ui/button';
import { CodeRunnerDialog } from './code-runner-dialog';

interface MarkdownRendererProps {
    content: string;
}

const renderInlineMarkdown = (text: string) => {
    let escapedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return escapedText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-muted/40 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    if (!content) return null;

    const parts = content.split(/(\[-----][\s\S]*?\[-----])/g);

    return (
        <div className="prose prose-sm dark:prose-invert max-w-none break-words space-y-4">
            {parts.map((part, index) => {
                if (part.startsWith('[-----]') && part.endsWith('[-----]')) {
                    const code = part.substring(7, part.length - 7).trim();
                    const langMatch = code.match(/^(html|css|javascript|js|python|py)\n/);
                    const lang = langMatch ? langMatch[1] : '';
                    const actualCode = langMatch ? code.substring(lang.length + 1) : code;
                    
                    const isRunnable = lang === 'html' || lang === 'css';

                    return (
                        <div key={index} className="relative group/codeblock">
                             <CodeBlock code={actualCode} />
                             {isRunnable && (
                                <div className="absolute top-2 right-2 opacity-0 group-hover/codeblock:opacity-100 transition-opacity">
                                    <CodeRunnerDialog code={actualCode} language={lang}>
                                        <Button variant="secondary" size="sm" className="h-7">
                                            <Code className="w-4 h-4 mr-2"/> Run Code
                                        </Button>
                                    </CodeRunnerDialog>
                                </div>
                             )}
                        </div>
                    );
                }

                if (!part.trim()) return null;

                const lines = part.trim().split('\n');
                const elements: React.JSX.Element[] = [];
                let listItems: string[] = [];
                let listType: 'ul' | 'ol' | null = null;

                const flushList = () => {
                    if (listItems.length > 0) {
                        const ListComponent = listType === 'ol' ? 'ol' : 'ul';
                        elements.push(
                            <ListComponent key={`list-${elements.length}`} className="list-inside space-y-1 my-2 pl-4">
                                {listItems.map((item, i) => (
                                    <li key={i} dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(item) }} />
                                ))}
                            </ListComponent>
                        );
                        listItems = [];
                        listType = null;
                    }
                };

                for (const line of lines) {
                    if (line.startsWith('# ')) {
                        flushList();
                        elements.push(<h1 key={elements.length} className="text-2xl font-bold mt-4 mb-2" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line.substring(2)) }} />);
                        continue;
                    }
                    if (line.startsWith('## ')) {
                        flushList();
                        elements.push(<h2 key={elements.length} className="text-xl font-semibold mt-3 mb-1" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line.substring(3)) }} />);
                        continue;
                    }
                    if (line.startsWith('### ')) {
                        flushList();
                        elements.push(<h3 key={elements.length} className="text-lg font-semibold mt-2 mb-1" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line.substring(4)) }} />);
                        continue;
                    }
                    if (line.startsWith('> ')) {
                        flushList();
                        elements.push(
                            <div key={elements.length} className="my-3 p-3 bg-primary/10 border-l-4 border-primary rounded-r-lg flex items-start gap-3">
                                <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <div className="flex-grow" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line.substring(2)) }} />
                            </div>
                        );
                        continue;
                    }
                    
                    const ulMatch = line.match(/^(\s*)(\*|-)\s+(.*)/);
                    if (ulMatch) {
                        if (listType !== 'ul') flushList();
                        listType = 'ul';
                        listItems.push(ulMatch[3]);
                        continue;
                    }
                    
                    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);
                    if (olMatch) {
                        if (listType !== 'ol') flushList();
                        listType = 'ol';
                        listItems.push(olMatch[3]);
                        continue;
                    }
                    
                    flushList();
                    if (line.trim() !== '') {
                        elements.push(<p key={elements.length} dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line) }} />);
                    }
                }
                flushList();

                return <div key={index}>{elements}</div>;
            })}
        </div>
    );
};
