'use client';
import { useEffect, useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

export function Chat() {
  const { user } = useUser();
  const [contacts, setContacts] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePartner, setActivePartner] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const myRole = (user?.publicMetadata as any)?.role || 'patient';

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch('/api/users/list')
      .then(r => r.json())
      .then(users => {
        const filtered = users.filter((u: any) => u.role !== myRole && u.id !== user.id);
        setContacts(filtered);
        setFilteredContacts(filtered);
      });
  }, [user, myRole]);

  useEffect(() => {
    if (!searchQuery.trim()) { setFilteredContacts(contacts); return; }
    const q = searchQuery.toLowerCase();
    setFilteredContacts(contacts.filter(c => c.name?.toLowerCase().includes(q)));
  }, [searchQuery, contacts]);

  const openChat = async (partner: any) => {
    setActivePartner(partner);
    const patientId = myRole === 'patient' ? user.id : partner.id;
    const doctorId = myRole === 'doctor' ? user.id : partner.id;
    const res = await fetch(`/api/chat?patientId=${patientId}&doctorId=${doctorId}`);
    const data = await res.json();
    setMessages(data);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }, 100);
  };

  const send = async () => {
    if (!input.trim() || !activePartner) return;
    const patientId = myRole === 'patient' ? user.id : activePartner.id;
    const doctorId = myRole === 'doctor' ? user.id : activePartner.id;
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId,
        doctorId,
        senderId: user.id,
        senderName: user.fullName || 'Anonim',
        text: input.trim(),
      }),
    });
    setInput('');
    openChat(activePartner);
  };

  const KontaktlarPanel = () => (
    <div style={{ overflowY: 'auto', flex: isMobile ? '1' : '0 0 280px', borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ padding: '0.75rem' }}>
        <input className="glass-input" placeholder="Ism yoki telefon..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%' }} />
      </div>
      <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <strong>{myRole === 'patient' ? 'Shifokorlar' : 'Bemorlar'}</strong>
      </div>
      {filteredContacts.map(c => (
        <div key={c.id} onClick={() => openChat(c)} style={{ padding: '0.75rem 1rem', cursor: 'pointer', background: activePartner?.id === c.id ? 'rgba(255,255,255,0.1)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontWeight: 600 }}>{c.name}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.role === 'doctor' ? '👨‍⚕️ Shifokor' : '🩺 Bemor'}</div>
        </div>
      ))}
    </div>
  );

  const SuhbatOynasi = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{activePartner?.name}</span>
        {isMobile && <button className="btn" onClick={() => setActivePartner(null)}>← Orqaga</button>}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {messages.map(m => (
          <div key={m.id} style={{ marginBottom: '0.75rem', textAlign: m.senderId === user?.id ? 'right' : 'left' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.2rem' }}>{m.senderName}</div>
            <div style={{ display: 'inline-block', maxWidth: '80%', padding: '0.5rem 1rem', borderRadius: '1rem', background: m.senderId === user?.id ? '#2563eb' : '#1e293b', color: '#fff', wordBreak: 'break-word' }}>{m.text}</div>
            <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.2rem' }}>{new Date(m.time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '0.5rem' }}>
        <input
          ref={inputRef}
          className="glass-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Xabar yozing..."
          style={{ flex: 1 }}
        />
        <button className="btn" onClick={send}>📤</button>
      </div>
    </div>
  );

  if (isMobile) {
    if (activePartner) {
      return (
        <div className="overlay" onClick={() => setActivePartner(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ height: '90vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <SuhbatOynasi />
          </div>
        </div>
      );
    }
    return (
      <div className="glass" style={{ height: '600px' }}>
        <KontaktlarPanel />
      </div>
    );
  }

  return (
    <div className="glass" style={{ display: 'flex', height: '600px', overflow: 'hidden' }}>
      <KontaktlarPanel />
      {activePartner ? <SuhbatOynasi /> : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          👈 Chapdan suhbatdoshni tanlang
        </div>
      )}
    </div>
  );
}