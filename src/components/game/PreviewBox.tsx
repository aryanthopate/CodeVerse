import React from 'react';

export function PreviewBox({ htmlContent, cssContent }: { htmlContent: string, cssContent: string }) {
  const combinedSrcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          /* Base reset and dark theme defaults for the preview area */
          body { 
            margin: 0; 
            font-family: system-ui, -apple-system, sans-serif; 
            background-color: #0f172a; /* matches deep dark dashboard */
            color: #ffffff; 
            min-height: 100vh;
          }
          /* Subtle dashed grid background to help with layout visualization */
          body::before {
            content: '';
            position: absolute;
            inset: 0;
            background-image: linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px);
            background-size: 20px 20px;
            z-index: -1;
            opacity: 0.5;
          }
          
          /* User injected CSS */
          ${cssContent}
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `;

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-border/50 shadow-2xl relative bg-slate-900 group">
      {/* Decorative top bar for "browser window" feel */}
      <div className="absolute top-0 left-0 w-full h-8 bg-slate-800/80 backdrop-blur-sm border-b border-white/10 flex items-center px-3 gap-1.5 z-10 transition-opacity">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
        <span className="ml-2 text-[10px] font-mono text-slate-400 uppercase tracking-widest">Live Output</span>
      </div>
      
      <iframe 
        srcDoc={combinedSrcDoc} 
        title="Live Preview"
        className="w-full h-full border-none pt-8"
        sandbox="allow-scripts"
      />
    </div>
  );
}
