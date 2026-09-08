import React from 'react';
import ChatWindow from '../components/chat/ChatWindow';

const ChatPage = () => {
  return (
    <div className="py-2 h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="pb-2 border-b border-slate-200 dark:border-white/10">
        <h1 className="text-2xl sm:text-3xl font-black theme-heading tracking-tight">AI Copilot Assistant</h1>
        <p className="text-xs sm:text-sm theme-muted mt-1">Autonomous reasoning engine to query project health, budget variances, and vendor risks.</p>
      </div>
      
      <div className="flex-1 rounded-2xl overflow-hidden theme-card">
        <ChatWindow />
      </div>
    </div>
  );
};

export default ChatPage;
