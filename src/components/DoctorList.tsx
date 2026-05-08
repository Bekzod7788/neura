'use client';
import { useEffect, useState } from 'react';

interface Doctor {
  id: string;
  name: string;
  email: string;
  specialty?: string;
}

export function DoctorList({ onSelect }: { onSelect: (doctor: Doctor) => void }) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/users?role=doctor')
      .then(res => res.json())
      .then(data => setDoctors(data))
      .catch(console.error);
  }, []);

  const filtered = doctors.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="glass" style={{ padding: '1rem' }}>
      <h3>👨‍⚕️ Shifokor tanlang</h3>
      <input
        className="glass-input"
        placeholder="Ism yoki email orqali qidiring..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: '0.5rem' }}
      />
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <p>Shifokor topilmadi</p>
        ) : (
          filtered.map(d => (
            <div
              key={d.id}
              className="glass-light"
              style={{ padding: '0.5rem', marginBottom: '0.25rem', cursor: 'pointer' }}
              onClick={() => onSelect(d)}
            >
              <div style={{ fontWeight: 'bold' }}>{d.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{d.email}{d.specialty ? ` • ${d.specialty}` : ''}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
