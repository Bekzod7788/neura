'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

export function MedicationReminder() {
  const { user } = useUser();
  const [reminders, setReminders] = useState<any[]>([]);
  const [permission, setPermission] = useState<string>('default');

  const fetchReminders = async () => {
    if (!user) return;
    const res = await fetch(`/api/medication?userId=${user.id}`);
    const data = await res.json();
    if (Array.isArray(data)) setReminders(data);
  };

  useEffect(() => {
    if (!user) return;
    fetchReminders();
    if (typeof Notification !== 'undefined') setPermission(Notification.permission);
  }, [user]);

  useEffect(() => {
    if (permission !== 'granted' || reminders.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();

      reminders.forEach(r => {
        if (!r.enabled) return;

        let targetHour: number | null = null;
        switch (r.time) {
          case 'Ertalab': targetHour = 8; break;
          case 'Tushlikda': targetHour = 13; break;
          case 'Kechqurun': targetHour = 18; break;
          case 'Yotishdan oldin': targetHour = 22; break;
        }

        if (targetHour === currentHour && now.getMinutes() === 0) {
          new Notification('💊 Dori vaqtingiz bo‘ldi!', {
            body: `${r.drugName} (${r.dosage || 'belgilanmagan'}) ichish vaqti.`,
            icon: '/logo.svg',
          });
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [reminders, permission]);

  const requestPermission = () => {
    if (typeof Notification !== 'undefined') Notification.requestPermission().then(p => setPermission(p));
  };

  const toggleEnabled = async (id: string, current: boolean) => {
    await fetch('/api/medication', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, enabled: !current }),
    });
    fetchReminders();
  };

  const deleteReminder = async (id: string) => {
    await fetch('/api/medication', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchReminders();
  };

  return (
    <div className="glass" style={{ marginTop: '1.5rem' }}>
      <h3>⏰ Dori eslatmalari</h3>

      {permission !== 'granted' && (
        <button className="btn" onClick={requestPermission} style={{ marginBottom: '1rem' }}>
          🔔 Bildirishnomalarga ruxsat berish
        </button>
      )}

      {reminders.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>Hozircha eslatmalar yo‘q.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {reminders.map(r => (
            <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ flex: 1 }}>
                <strong>{r.drugName}</strong>
                {r.dosage && <span style={{ marginLeft: '0.5rem' }}>({r.dosage})</span>}
                <span style={{ color: '#94a3b8', marginLeft: '0.5rem' }}>— {r.time}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  className="btn"
                  onClick={() => toggleEnabled(r.id, r.enabled)}
                  style={{ padding: '0.2rem 0.8rem', fontSize: '0.8rem', background: r.enabled ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)' }}
                >
                  {r.enabled ? '✅ Yoqilgan' : '❌ O‘chirilgan'}
                </button>
                <button
                  className="btn"
                  onClick={() => deleteReminder(r.id)}
                  style={{ padding: '0.2rem 0.8rem', fontSize: '0.8rem', background: 'rgba(239,68,68,0.3)' }}
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
