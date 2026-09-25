import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User } from 'lucide-react';

const cleanContent = (raw) => {
  if (!raw) return '';
  let str = String(raw).trim();
  if (str.startsWith('{') && str.includes('"response"')) {
    try {
      const parsed = JSON.parse(str);
      if (parsed.response) return parsed.response;
    } catch (e) {
      const match = str.match(/"response"\s*:\s*"([\s\S]*?)"\s*\}?$/);
      if (match) return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }
  }
  return str;
};

const MarkdownComponents = {
  p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
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

const MessageBubble = ({ message, text, isUser }) => {
  const content = cleanContent(text || message || '');
  return (
    <div className={`flex w-full items-center gap-3 mb-5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      


      <div 
        className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-[13px] leading-relaxed shadow-sm relative
          ${isUser 
            ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white rounded-br-none shadow-md font-medium' 
            : 'theme-card theme-heading rounded-bl-none border border-[#FF5A14]/20 bg-slate-900/60 backdrop-blur-md'
          }
        `}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="markdown-body">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={MarkdownComponents}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>



    </div>
  );
};

export default MessageBubble;
