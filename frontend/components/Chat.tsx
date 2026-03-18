'use client';
import React from 'react';
import { apiAsk } from '@/lib/api';

type Citation = { title: string; section?: string; text?: string };
type Message = {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  chunks?: Citation[];
  error?: boolean;
};

function CitationChip({ citation, chunk }: { citation: Citation; chunk?: Citation }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="citation-wrapper">
      <button
        className={`citation-chip ${open ? 'active' : ''}`}
        onClick={() => setOpen(o => !o)}
        title={citation.section || ''}
      >
        <span className="citation-dot" />
        <span className="citation-title">{citation.title}</span>
        {citation.section && <span className="citation-section">{citation.section}</span>}
        <span className="citation-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && chunk?.text && (
        <div className="citation-expanded">
          <div className="citation-meta">
            {chunk.title}{chunk.section ? ` — ${chunk.section}` : ''}
          </div>
          <div className="citation-text">{chunk.text}</div>
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <span /><span /><span />
    </div>
  );
}

export default function Chat() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [q, setQ] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const query = q.trim();
    if (!query || loading) return;
    setError(null);
    setMessages(m => [...m, { role: 'user', content: query }]);
    setQ('');
    setLoading(true);
    try {
      const res = await apiAsk(query);
      setMessages(m => [...m, {
        role: 'assistant',
        content: res.answer,
        citations: res.citations,
        chunks: res.chunks,
      }]);
    } catch (e: any) {
      const msg = e?.message || 'Something went wrong. Please try again.';
      setError(msg);
      setMessages(m => [...m, { role: 'assistant', content: msg, error: true }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      <style>{`
        .chat-container { display: flex; flex-direction: column; height: 520px; background: #fff; border: 1px solid #e8e8e8; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        .chat-header { padding: 16px 20px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; gap: 10px; }
        .chat-header-dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 0 2px #dcfce7; }
        .chat-header-title { font-size: 14px; font-weight: 600; color: #111; letter-spacing: -0.01em; }
        .chat-header-sub { font-size: 12px; color: #999; margin-left: auto; }
        .chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; scroll-behavior: smooth; }
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-track { background: transparent; }
        .chat-messages::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 2px; }
        .chat-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #bbb; }
        .chat-empty-icon { font-size: 32px; opacity: 0.4; }
        .chat-empty-text { font-size: 13px; }
        .message-row { display: flex; flex-direction: column; gap: 4px; animation: fadeUp 0.2s ease; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .message-row.user { align-items: flex-end; }
        .message-row.assistant { align-items: flex-start; }
        .message-label { font-size: 11px; font-weight: 500; color: #aaa; letter-spacing: 0.03em; text-transform: uppercase; margin-bottom: 2px; }
        .message-bubble { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.6; }
        .message-row.user .message-bubble { background: #111; color: #fff; border-bottom-right-radius: 4px; }
        .message-row.assistant .message-bubble { background: #f7f7f7; color: #111; border-bottom-left-radius: 4px; border: 1px solid #efefef; }
        .message-row.assistant .message-bubble.error { background: #fff5f5; color: #c0392b; border-color: #fecaca; }
        .citations-area { display: flex; flex-direction: column; gap: 4px; max-width: 85%; margin-top: 2px; }
        .citation-wrapper { display: flex; flex-direction: column; }
        .citation-chip { display: flex; align-items: center; gap: 6px; padding: 5px 10px; background: #f0f7ff; border: 1px solid #bfdbfe; border-radius: 20px; cursor: pointer; font-size: 12px; color: #1d4ed8; transition: all 0.15s; text-align: left; width: fit-content; }
        .citation-chip:hover { background: #dbeafe; }
        .citation-chip.active { background: #dbeafe; border-color: #93c5fd; }
        .citation-dot { width: 6px; height: 6px; background: #3b82f6; border-radius: 50%; flex-shrink: 0; }
        .citation-title { font-weight: 500; }
        .citation-section { color: #60a5fa; font-size: 11px; }
        .citation-arrow { font-size: 8px; margin-left: 2px; opacity: 0.6; }
        .citation-expanded { margin-top: 4px; margin-left: 8px; padding: 10px 12px; background: #f8faff; border: 1px solid #dbeafe; border-radius: 8px; font-size: 12px; line-height: 1.6; max-width: 480px; animation: fadeUp 0.15s ease; }
        .citation-meta { font-weight: 600; color: #1d4ed8; margin-bottom: 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
        .citation-text { color: #444; white-space: pre-wrap; }
        .typing-indicator { display: flex; gap: 4px; padding: 12px 16px; background: #f7f7f7; border: 1px solid #efefef; border-radius: 12px; border-bottom-left-radius: 4px; width: fit-content; }
        .typing-indicator span { width: 6px; height: 6px; background: #bbb; border-radius: 50%; animation: bounce 1.2s infinite; }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-5px); } }
        .chat-input-area { padding: 12px 16px; border-top: 1px solid #f0f0f0; display: flex; gap: 8px; align-items: flex-end; background: #fff; }
        .chat-input { flex: 1; padding: 10px 14px; border: 1px solid #e0e0e0; border-radius: 10px; font-size: 14px; outline: none; resize: none; font-family: inherit; line-height: 1.5; transition: border-color 0.15s; background: #fafafa; color: #111; }
        .chat-input:focus { border-color: #111; background: #fff; }
        .chat-input::placeholder { color: #bbb; }
        .send-btn { padding: 10px 18px; background: #111; color: #fff; border: none; border-radius: 10px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; white-space: nowrap; letter-spacing: -0.01em; }
        .send-btn:hover:not(:disabled) { background: #333; }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .error-banner { margin: 0 16px 8px; padding: 8px 12px; background: #fff5f5; border: 1px solid #fecaca; border-radius: 8px; font-size: 12px; color: #c0392b; display: flex; justify-content: space-between; align-items: center; }
        .error-banner button { background: none; border: none; color: #c0392b; cursor: pointer; font-size: 14px; padding: 0; line-height: 1; }
      `}</style>

      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-header-dot" />
          <span className="chat-header-title">Policy Assistant</span>
          <span className="chat-header-sub">{messages.filter(m => m.role === 'user').length} questions asked</span>
        </div>

        <div className="chat-messages">
          {isEmpty ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">💬</div>
              <div className="chat-empty-text">Ask anything about company policy or products</div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`message-row ${m.role}`}>
                <div className="message-label">{m.role === 'user' ? 'You' : 'Assistant'}</div>
                <div className={`message-bubble ${m.error ? 'error' : ''}`}>{m.content}</div>
                {m.role === 'assistant' && m.citations && m.citations.length > 0 && (
                  <div className="citations-area">
                    {m.citations.map((c, idx) => (
                      <CitationChip
                        key={idx}
                        citation={c}
                        chunk={m.chunks?.[idx]}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="message-row assistant">
              <div className="message-label">Assistant</div>
              <TypingIndicator />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className="chat-input-area">
          <input
            ref={inputRef}
            className="chat-input"
            placeholder="Ask about returns, shipping, warranty..."
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
            aria-label="Chat input"
          />
          <button
            className="send-btn"
            onClick={send}
            disabled={loading || !q.trim()}
            aria-label="Send message"
          >
            {loading ? 'Thinking…' : 'Send →'}
          </button>
        </div>
      </div>
    </>
  );
}
