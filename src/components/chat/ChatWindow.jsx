import React, { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import StreamingResponse from './StreamingResponse';
import { streamChatResponse } from '../../api/chatStream';
import { Bot, Send, X } from 'lucide-react';

const ChatWindow = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const endRef = useRef(null);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamText]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setInput('');
    setIsStreaming(true);
    setStreamText('');

    try {
      await streamChatResponse(
        userMessage,
        (chunk) => {
          setStreamText(prev => prev + chunk);
        },
        (fullResponse) => {
          setIsStreaming(false);
          setStreamText('');
          setMessages(prev => [...prev, { text: fullResponse || "Processing completed.", isUser: false }]);
        },
        () => {
          setIsStreaming(false);
          setMessages(prev => [...prev, { text: "Error communicating with AI agent.", isUser: false }]);
        }
      );
    } catch (err) {
      console.error(err);
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full theme-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b theme-border flex justify-between items-center theme-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FF5A14]/15 text-[#FF5A14] flex items-center justify-center border border-[#FF5A14]/20">
            <Bot size={18} />
          </div>
          <div>
            <h2 className="font-bold theme-heading text-xs sm:text-sm">VPM AI Copilot</h2>
            <p className="text-[11px] theme-muted">Direct interface to RAG memory & risk engine</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="theme-muted hover:text-[#FF5A14] transition-colors p-1">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isStreaming && (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-2xl bg-[#FF5A14]/10 text-[#FF5A14] flex items-center justify-center mx-auto mb-3">
              <Bot size={24} />
            </div>
            <h3 className="text-sm font-bold theme-heading mb-1">Autonomous Copilot Ready</h3>
            <p className="text-xs theme-muted max-w-xs mx-auto">
              Ask about vendor milestones, budget burn, active blockers, or contract SLAs.
            </p>
          </div>
        )}

        {messages.map((m, idx) => (
          <MessageBubble key={idx} text={m.text} isUser={m.isUser} />
        ))}

        {isStreaming && <StreamingResponse text={streamText} />}

        <div ref={endRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t theme-border flex items-center gap-2 theme-subtle">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about program performance..."
          className="flex-1 px-4 py-2.5 text-xs theme-input rounded-xl focus:outline-none focus:border-[#FF5A14] transition-colors"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] text-white text-xs font-bold disabled:opacity-40 transition-all flex items-center gap-1 shadow-sm hover:brightness-110"
        >
          <span>Send</span>
          <Send size={13} />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
