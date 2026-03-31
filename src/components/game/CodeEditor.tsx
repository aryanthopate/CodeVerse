import React from 'react';

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function CodeEditor({ code, onChange, disabled = false }: CodeEditorProps) {
  return (
    <div className="w-full h-full flex flex-col bg-slate-950 rounded-2xl border-2 border-slate-800 shadow-xl overflow-hidden relative group">
      {/* Editor Header */}
      <div className="flex bg-slate-900 border-b border-white/5 h-10 px-3 py-1 shrink-0">
        <div className="flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
           <span className="text-xs font-mono text-slate-300 font-semibold uppercase tracking-wider">style.css</span>
        </div>
      </div>
      
      {/* Line numbers + Textarea wrapper */}
      <div className="flex-1 relative overflow-hidden flex bg-slate-900/40">
        {/* Fake Line Numbers */}
        <div className="w-10 bg-slate-900/80 border-r border-white/5 flex flex-col items-center py-4 text-[13px] font-mono text-slate-600 select-none hidden sm:flex shrink-0 leading-6">
          {code.split('\n').map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        
        {/* Actual Editor Textarea */}
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          spellCheck={false}
          className="flex-1 w-full h-full bg-transparent text-[#e2e8f0] font-mono text-[14px] leading-6 p-4 outline-none resize-none border-none placeholder-slate-600 focus:ring-1 focus:ring-primary/20 focus:bg-slate-800/20 transition-colors"
          placeholder="/* Write your CSS rules here */"
        />
      </div>
    </div>
  );
}
