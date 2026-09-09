import React from 'react';

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

const MessageBubble = ({ message, text, isUser }) => {
  const content = cleanContent(text || message || '');
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div 
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm
          ${isUser 
            ? 'bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white rounded-br-none shadow-md font-medium' 
            : 'theme-card theme-heading rounded-bl-none border'
          }
        `}
      >
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
};

export default MessageBubble;
