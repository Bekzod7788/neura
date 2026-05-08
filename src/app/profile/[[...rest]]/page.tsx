'use client';
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserProfile } from '@clerk/nextjs';

export default function ProfilePage() {
  const { user } = useUser();
  const [phone, setPhone] = useState((user?.publicMetadata as any)?.phone || '');
  const [saved, setSaved] = useState(false);
  const [showClerkProfile, setShowClerkProfile] = useState(false);

  const savePhone = async () => {
    await fetch('/api/users/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user?.id, phone }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (showClerkProfile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
        <UserProfile routing="path" path="/profile" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
      <div className="glass" style={{ maxWidth: '600px', width: '100%' }}>
        <h2>👤 Profil sozlamalari</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label>Ism</label>
            <input className="glass-input" value={user?.firstName || ''} disabled />
          </div>
          <div>
            <label>Familiya</label>
            <input className="glass-input" value={user?.lastName || ''} disabled />
          </div>
          <div>
            <label>Telefon raqami (ixtiyoriy)</label>
            <input className="glass-input" placeholder="+998 90 123 45 67" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <button className="btn" onClick={savePhone}>
            {saved ? '✅ Saqlandi' : 'Saqlash'}
          </button>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: '1rem' }}>
            <p style={{ marginBottom: '0.5rem' }}>Parolni o‘zgartirish yoki boshqa xavfsizlik sozlamalari:</p>
            <button className="btn" onClick={() => setShowClerkProfile(true)}>
              🔒 Xavfsizlik sozlamalari
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}