import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageSquare, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  
  const messagesEndRef = useRef(null);

  // Fetch history when opening chatbot
  const fetchChatHistory = async () => {
    try {
      const res = await axios.get('/api/chat/history');
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchChatHistory();
    }
  }, [isOpen, isAuthenticated]);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const messageText = inputText.trim();
    setInputText('');
    setLoading(true);

    // Append user message instantly
    setMessages((prev) => [...prev, { sender: 'user', text: messageText, createdAt: new Date() }]);

    try {
      const res = await axios.post('/api/chat/message', { 
        text: messageText,
        pageContext: window.location.pathname
      });
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Sorry, I failed to connect to the server. Please try again.',
          createdAt: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      
      {/* Bot Icon Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center transition hover:scale-105"
          aria-label="Open AI Assistant"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[500px] bg-card border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn text-card-foreground">
          
          {/* Header */}
          <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-white/20 p-2 rounded-lg">
                <Sparkles className="h-4 w-4 text-purple-200" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">AI Career Coach</h3>
                <span className="text-[10px] text-primary-foreground/75">Ready to assist</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.length === 0 && !loading && (
              <div className="text-center text-xs text-muted-foreground py-10 px-4 space-y-2">
                <Sparkles className="h-8 w-8 text-primary/30 mx-auto animate-pulse" />
                <p className="font-semibold text-foreground/80">Start Your Prep Conversation</p>
                <p className="leading-relaxed">Ask me any queries regarding Data Structures, coding algorithms, resume gaps, or placement roadmaps.</p>
              </div>
            )}

            {messages.map((msg, idx) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={idx}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-primary text-primary-foreground rounded-tr-none shadow-sm'
                        : 'bg-secondary/40 border text-foreground rounded-tl-none'
                    }`}
                  >
                    {/* Preserve line breaks for code blocks and list feeds */}
                    <span className="whitespace-pre-wrap font-sans">{msg.text}</span>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary/40 border p-3.5 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Thinking...
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input form */}
          <form onSubmit={handleSend} className="p-3 border-t bg-secondary/10 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about DSA, HR, resume formatting..."
              className="flex-1 bg-background border border-input rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>
      )}


    </div>
  );
};

export default FloatingChatbot;
