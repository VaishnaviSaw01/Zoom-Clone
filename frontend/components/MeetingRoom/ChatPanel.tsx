"use client";

import { useState } from "react";
import { X, Send } from "lucide-react";

interface ChatPanelProps {
  onClose: () => void;
}

export default function ChatPanel({ onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<{ id: number; text: string; sender: string; time: string }[]>([
    { id: 1, text: "Welcome to the meeting chat!", sender: "System", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [input, setInput] = useState("");

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([
      ...messages,
      {
        id: Date.now(),
        text: input.trim(),
        sender: "You",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setInput("");
  }

  return (
    <aside className="w-80 bg-zoom-dark-2 border-l border-white/5 flex flex-col animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
        <h2 className="text-sm font-semibold text-white">Chat</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col">
            <div className="flex items-baseline gap-2 mb-1">
              <span className={`text-xs font-semibold ${msg.sender === "You" ? "text-zoom-blue" : "text-gray-300"}`}>
                {msg.sender}
              </span>
              <span className="text-[10px] text-gray-500">{msg.time}</span>
            </div>
            <p className="text-sm text-gray-200 break-words">{msg.text}</p>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/5 flex-shrink-0">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-white/10 border border-white/20 rounded-xl pl-3 pr-10 py-2.5 
                       text-sm text-white placeholder:text-gray-400 focus:outline-none focus:border-zoom-blue"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 p-1.5 rounded-lg text-zoom-blue hover:bg-zoom-blue/10 
                       disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
