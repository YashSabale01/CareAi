import { useState, useRef, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { formatDateTime } from '../../utils/formatters';

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'bot', text: 'Hello! I\'m CareAI Assistant. How can I help you today?', time: new Date() }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', text: input, time: new Date() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/chatbot/message', { message: input });
      setMessages(m => [...m, { role: 'bot', text: data.response, time: new Date(), isEmergency: data.isEmergency }]);
    } catch {
      setMessages(m => [...m, { role: 'bot', text: 'Sorry, I\'m unavailable right now.', time: new Date() }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 w-80 rounded-xl border border-[#2d3748] flex flex-col overflow-hidden shadow-2xl" style={{ background: 'var(--color-bg-card)', height: 420 }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d3748]" style={{ background: 'var(--color-bg-elevated)' }}>
            <span className="font-semibold text-sm text-[#00d4ff]">⚕ CareAI Assistant</span>
            <button onClick={() => setOpen(false)} className="text-[#94a3b8] hover:text-white">&times;</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${m.role === 'user' ? 'bg-[#6366f1] text-white' : m.isEmergency ? 'bg-[#ef444422] border border-[#ef4444] text-[#ef4444]' : 'bg-[#1f2d3d] text-[#f1f5f9]'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="bg-[#1f2d3d] px-3 py-2 rounded-xl text-sm text-[#94a3b8]">Typing...</div></div>}
            <div ref={bottomRef} />
          </div>
          <div className="flex gap-2 p-3 border-t border-[#2d3748]">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about your health..." className="input-field text-sm flex-1" />
            <button onClick={send} disabled={loading} className="btn-primary text-sm px-3">Send</button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(o => !o)}
        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg transition-transform hover:scale-110"
        style={{ background: 'var(--color-accent-primary)', color: '#0a0f1e' }}>
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}
