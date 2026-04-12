import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import '../copilot.css';

import api from '../api/client.js';

export default function CopilotWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hi there! I am OmniCampus Copilot. How can I help you navigate the campus or use the platform today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // If not logged in, don't render (or maybe render a restricted version, but hiding is simpler)
  if (!user) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await api.post('/copilot/chat', {
        message: userMsg,
        pagePath: window.location.pathname,
        userRole: user.role || 'student'
      });

      const data = res.data;

      setMessages(prev => [
        ...prev, 
        { 
          role: 'ai', 
          content: data.answer,
          cached: data.cached,
          similarity: data.similarity
        }
      ]);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setMessages(prev => [
        ...prev, 
        { role: 'ai', content: `Oops, something went wrong: ${errorMsg}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // Markdown-like simplifier (very basic)
  const formatText = (text) => {
    // Bold **text**
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <>
      <div 
        className="copilot-fab" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Copilot"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="copilot-panel"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20, pointerEvents: 'none' }}
            transition={{ duration: 0.25, ease: [0.175, 0.885, 0.32, 1.275] }}
          >
            <div className="copilot-header">
              <h3 className="copilot-header__title">
                <span className="copilot-header__status"></span> OmniCampus Copilot
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="copilot-body">
              {messages.map((msg, idx) => (
                <motion.div 
                  key={idx} 
                  className={`copilot-msg copilot-msg--${msg.role}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {formatText(msg.content)}
                  {msg.cached && (
                    <div className="copilot-msg__meta">
                      <span className="copilot-msg__cached-badge" title={`Vector similarity: ${msg.similarity}`}>
                        ⚡ Cached
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
              
              {isLoading && (
                <div className="copilot-msg copilot-msg--ai copilot-typing">
                  <span /> <span /> <span />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="copilot-input-area">
              <form onSubmit={handleSubmit} className="copilot-form">
                <input 
                  type="text" 
                  className="copilot-input"
                  placeholder="Ask me anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                />
                <button type="submit" className="copilot-submit" disabled={!input.trim() || isLoading}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
