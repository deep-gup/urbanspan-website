import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, Lock, ShieldCheck } from 'lucide-react';
import { io } from 'socket.io-client';
import { getStoredConfig } from '../services/headlessApi';

export default function LiveChatWidget({ customerUser, onOpenAuthModal, isFullScreen }) {
  const [isOpen, setIsOpen] = useState(isFullScreen || false);
  const [channelId, setChannelId] = useState(null);
  const [messages, setMessages] = useState([
    { id: 'm0', sender: 'Urbanspan Sales Bot', content: 'Welcome to Urbanspan Infrastructure! Verified steel buyers can chat directly with our commercial sales engineers in real time.', created_at: new Date().toISOString() }
  ]);
  const [inputText, setInputText] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    const token = localStorage.getItem('urbanspan_customer_token');
    if (!token || !customerUser) {
      setSocketConnected(false);
      return;
    }

    const config = getStoredConfig();
    
    // Fetch initial chat history
    fetch(`${config.apiBaseUrl}/api/external/customers/me/chat`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-org-code': config.orgCode
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.data) {
        setChannelId(data.data.channel.id);
        const history = data.data.messages.map(m => ({
          id: m.id,
          sender: m.sender_name || (m.customer_id ? customerUser.name : 'Urbanspan Support'),
          content: m.content,
          created_at: m.created_at,
          isCustomer: !!m.customer_id
        }));
        setMessages([
          { id: 'm0', sender: 'Urbanspan Sales Bot', content: 'Welcome to Urbanspan Infrastructure! Verified steel buyers can chat directly with our commercial sales engineers in real time.', created_at: new Date().toISOString() },
          ...history
        ]);
        
        // Connect Socket once we have channelId
        const socket = io(config.apiBaseUrl, {
          auth: { token },
          transports: ['websocket', 'polling']
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('Urbanspan Client Connected to Distro WS Server:', socket.id);
          setSocketConnected(true);
          // Join specific channel room
          socket.emit('join_channel', data.data.channel.id);
        });

        socket.on('new_message', (msg) => {
          setMessages((prev) => [...prev, {
            id: msg.id || Date.now(),
            sender: msg.sender_name || (msg.customer_id ? customerUser.name : 'Urbanspan Support'),
            content: msg.content,
            created_at: msg.created_at || new Date().toISOString(),
            isCustomer: !!msg.customer_id
          }]);
        });

        socket.on('connect_error', (err) => {
          console.warn('Socket Auth/Connection Notice:', err.message);
          setSocketConnected(false);
        });
      } else if (data.success === false && data.message && (data.message.includes('Access denied') || data.message.includes('Invalid token'))) {
        localStorage.removeItem('urbanspan_customer_token');
        localStorage.removeItem('urbanspan_customer_user');
        setSocketConnected(false);
        window.location.reload();
      }
    })
    .catch(err => console.error('Error fetching chat:', err));

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [customerUser]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const token = localStorage.getItem('urbanspan_customer_token');
    const config = getStoredConfig();

    try {
      const res = await fetch(`${config.apiBaseUrl}/api/external/customers/me/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-org-code': config.orgCode
        },
        body: JSON.stringify({ content: inputText })
      });
      const data = await res.json();
      
      if (data.success) {
        // Optimistically add to UI if we don't have socket connected
        if (!socketConnected) {
          setMessages(prev => [...prev, {
             id: data.data.id,
             sender: customerUser.name,
             content: data.data.content,
             created_at: data.data.created_at,
             isCustomer: true
          }]);
        } else if (socketRef.current && channelId) {
          // Broadcast the real message object through socket
          socketRef.current.emit('send_message', {
            message: data.data,
            channel_id: channelId
          });
        }
        setInputText('');
      } else {
        console.error('Failed to send message:', data.error || data.message);
        if (data.error && (data.error.includes('Access denied') || data.error.includes('Invalid token') || data.error.includes('Customer not found'))) {
           localStorage.removeItem('urbanspan_customer_token');
           localStorage.removeItem('urbanspan_customer_user');
           window.location.reload();
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (isFullScreen) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50">
        {/* Header */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-steel flex items-center justify-center text-slate-900 font-black shadow-sm">
              <MessageSquare className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 leading-tight">Sales Support</h4>
              <span className="text-[11px] text-emerald-500 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {socketConnected ? 'Connected to ERP Socket' : 'Sales Desk Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Auth Notice if unauthenticated */}
        {!customerUser && (
          <div className="p-3 bg-brand-steel/10 border-b border-brand-steel/20 text-xs text-blue-700 flex items-center justify-between font-medium">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Log in for verified sales chat
            </span>
            <button
              onClick={onOpenAuthModal}
              className="px-3 py-1.5 rounded bg-brand-steel hover:bg-brand-steel-light text-slate-900 font-bold text-xs"
            >
              Log In
            </button>
          </div>
        )}

        {/* Message History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isCustomer ? 'items-end' : 'items-start'}`}
            >
              <span className="text-[10px] text-slate-500 mb-1 font-semibold px-1">{msg.sender}</span>
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.isCustomer
                    ? 'bg-brand-steel text-slate-900 font-medium rounded-br-none shadow-md'
                    : 'bg-white text-slate-700 border border-slate-200 shadow-sm rounded-bl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2 pb-safe">
          <input
            type="text"
            placeholder={customerUser ? 'Type message...' : 'Sign in to chat...'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder-slate-500 focus:outline-none focus:border-brand-steel"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-brand-steel active:bg-brand-steel-light disabled:opacity-50 text-slate-900 font-bold transition-all shadow-md shadow-brand-steel/20"
          >
            <Send className="w-5 h-5 stroke-[2.5]" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 lg:bottom-6 right-6 z-50">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-primary text-slate-900 flex items-center justify-center shadow-2xl shadow-brand-steel/30 hover:scale-110 transition-all duration-300 relative group"
        >
          <MessageSquare className="w-6 h-6 stroke-[2.5]" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse"></span>
        </button>
      )}

      {/* Chat Drawer Window */}
      {isOpen && (
        <div className="w-[380px] h-[520px] bg-white shadow-lg border border-slate-200 rounded-3xl border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden animate-scale-up">
          
          {/* Header */}
          <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-steel flex items-center justify-center text-slate-900 font-black">
                <MessageSquare className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 leading-tight">Urbanspan Sales Support</h4>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {socketConnected ? 'Connected to ERP Socket' : 'Sales Desk Active'}
                </span>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white-light transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Customer Auth Notice if unauthenticated */}
          {!customerUser && (
            <div className="p-3 bg-brand-steel/10 border-b border-brand-steel/20 text-xs text-blue-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Log in for verified sales chat
              </span>
              <button
                onClick={onOpenAuthModal}
                className="px-2.5 py-1 rounded bg-brand-steel hover:bg-brand-steel-light text-slate-900 font-bold text-[11px]"
              >
                Log In
              </button>
            </div>
          )}

          {/* Message History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.isCustomer ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-slate-500 mb-1 font-medium px-1">{msg.sender}</span>
                <div
                  className={`max-w-[82%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                    msg.isCustomer
                      ? 'bg-brand-steel text-slate-900 font-medium rounded-br-none shadow-md'
                      : 'bg-white text-slate-700 border border-slate-200 shadow-sm rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
            <input
              type="text"
              placeholder={customerUser ? 'Type message to sales engineer...' : 'Sign in to chat in real-time...'}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-500 focus:outline-none focus:border-brand-steel"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-brand-steel hover:bg-brand-steel-light disabled:opacity-50 text-slate-900 font-bold transition-all shadow-md shadow-brand-steel/20"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
