import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot } from 'lucide-react';

const cleanStream = (raw) => {
  if (!raw) return '';
  let str = String(raw);
  // Strip leading {"response": " or {"response":"
  str = str.replace(/^\s*\{\s*"response"\s*:\s*"/, '');
  // Strip trailing "} or "
  if (str.endsWith('"}') || str.endsWith('" }')) {
    str = str.slice(0, -2);
  } else if (str.endsWith('"')) {
    str = str.slice(0, -1);
  }
  return str.replace(/\\n/g, '\n').replace(/\\"/g, '"');
};

const MarkdownComponents = {
  p: ({node, ...props}) => <p className="mb-2 last:mb-0 inline-block" {...props} />,
  strong: ({node, ...props}) => <strong className="font-bold text-[#FF5A14]" {...props} />,
  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1 marker:text-[#FF5A14]" {...props} />,
  ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1 marker:text-[#FF5A14]" {...props} />,
  li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
  h1: ({node, ...props}) => <h1 className="text-lg font-bold text-[#FF5A14] mt-3 mb-2" {...props} />,
  h2: ({node, ...props}) => <h2 className="text-base font-bold text-[#FF5A14] mt-3 mb-2" {...props} />,
  h3: ({node, ...props}) => <h3 className="text-sm font-bold text-[#FF5A14] mt-2 mb-1" {...props} />,
  a: ({node, ...props}) => <a className="text-blue-400 hover:underline hover:text-blue-300 transition-colors" {...props} />,
  code: ({node, inline, ...props}) => 
    inline 
      ? <code className="bg-[#FF5A14]/10 text-[#FF5A14] px-1 py-0.5 rounded font-mono text-[10px]" {...props} />
      : <code className="block bg-black/30 p-2 rounded-lg font-mono text-[10px] overflow-x-auto border border-white/5 my-2" {...props} />,
};

const StreamingResponse = ({ text }) => {
  const display = cleanStream(text);
  return (
    <div className="flex w-full items-center gap-3 justify-start mb-5">
      


      <div className="max-w-[80%] rounded-2xl px-5 py-3.5 text-[13px] leading-relaxed shadow-sm theme-card theme-heading border border-[#FF5A14]/20 rounded-bl-none relative bg-slate-900/60 backdrop-blur-md">
        <div className="markdown-body inline-block">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={MarkdownComponents}
          >
            {display}
          </ReactMarkdown>
          <span className="inline-block w-1.5 h-3.5 ml-1 bg-[#FF5A14] animate-pulse align-middle translate-y-[-1px]"></span>
        </div>
      </div>
    </div>
  );
};

export default StreamingResponse;
