
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useDebounce } from 'use-debounce';

export function CodeRunnerDialog({ code, language, children }: { code: string; language: string; children: React.ReactNode; }) {
    const [htmlCode, setHtmlCode] = useState(language === 'html' ? code : '');
    const [cssCode, setCssCode] = useState(language === 'css' ? code : '');
    const [debouncedHtml] = useDebounce(htmlCode, 300);
    const [debouncedCss] = useDebounce(cssCode, 300);
    const [srcDoc, setSrcDoc] = useState('');

    useEffect(() => {
        setSrcDoc(`
            <html>
                <body>${debouncedHtml}</body>
                <style>${debouncedCss}</style>
            </html>
        `);
    }, [debouncedHtml, debouncedCss]);
    
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="p-0 m-0 w-screen h-screen max-w-full max-h-full rounded-none border-0">
                 <ResizablePanelGroup direction="horizontal">
                    <ResizablePanel defaultSize={50}>
                        <div className="flex flex-col h-full">
                            <div className="p-2 bg-muted border-b">
                                <h3 className="text-sm font-semibold">HTML</h3>
                            </div>
                            <textarea
                                value={htmlCode}
                                onChange={(e) => setHtmlCode(e.target.value)}
                                className="w-full h-full p-4 bg-gray-900 text-white font-mono resize-none focus:outline-none flex-grow"
                                placeholder="Write your HTML here..."
                                spellCheck="false"
                            />
                            <div className="p-2 bg-muted border-t border-b">
                                <h3 className="text-sm font-semibold">CSS</h3>
                            </div>
                            <textarea
                                value={cssCode}
                                onChange={(e) => setCssCode(e.target.value)}
                                className="w-full h-full p-4 bg-gray-900 text-white font-mono resize-none focus:outline-none flex-grow"
                                placeholder="Write your CSS here..."
                                spellCheck="false"
                            />
                        </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={50}>
                         <div className="flex flex-col h-full">
                             <div className="p-2 bg-muted border-b">
                                <h3 className="text-sm font-semibold">Preview</h3>
                             </div>
                            <iframe
                                srcDoc={srcDoc}
                                title="Code Preview"
                                sandbox="allow-scripts"
                                frameBorder="0"
                                width="100%"
                                height="100%"
                                className="flex-grow"
                            />
                         </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </DialogContent>
        </Dialog>
    );
}
