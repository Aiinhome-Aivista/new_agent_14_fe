import React from 'react';

const MessageBubble = ({ message, text, isUser }) => {
  const content = text || message || '';
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
