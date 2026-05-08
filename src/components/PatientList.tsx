'use client';
import { useEffect, useState } from 'react';

interface Patient {
  id: string;
  name: string;
  email: string;
}

export function PatientList({ onSelect }: { onSelect: (patient: Patient) => void }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/users?role=patient')
      .then(res => res.json())
      .then(data => setPatients(data))
      .catch(console.error);
  }, []);

  const filtered = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="glass" style={{ padding: '1rem' }}>
      <h3>🩺 Bemor tanlang</h3>
      <input
        className="glass-input"
        placeholder="Ism yoki email orqali qidiring..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: '0.5rem' }}
      />
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <p>Bemor topilmadi</p>
        ) : (
          filtered.map(p => (
            <div
              key={p.id}
              className="glass-light"
              style={{ padding: '0.5rem', marginBottom: '0.25rem', cursor: 'pointer' }}
              onClick={() => onSelect(p)}
            >
              <div style={{ fontWeight: 'bold' }}>{p.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{p.email}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
