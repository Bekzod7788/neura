'use client';
import { useState, useRef, useEffect } from 'react';

interface PatientSelectProps { onSelect: (patientId: string, patientName: string) => void; }

export function PatientSelect({ onSelect }: PatientSelectProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const delay = setTimeout(async () => {
      const res = await fetch('/api/users/search?q=' + encodeURIComponent(query));
      const data = await res.json();
      setResults(data.filter((u: any) => u.role === 'patient'));
    }, 400);
    return () => clearTimeout(delay);
  }, [query]);

  const selectPatient = (id: string, name: string) => {
    setSelected({ id, name });
    setQuery(name);
    setShowResults(false);
    onSelect(id, name);
  };

  return (
    <div ref={containerRef} style={{ marginBottom: '1rem', position: 'relative' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem' }}>Bemorni qidiring</label>
      <input className="glass-input" placeholder="Ism yoki telefon raqami..." value={query} onChange={e => { setQuery(e.target.value); setShowResults(true); setSelected(null); }} onFocus={() => setShowResults(true)} />
      {showResults && results.length > 0 && (
        <div className="glass-light" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, maxHeight: '200px', overflowY: 'auto', marginTop: '0.25rem' }}>
          {results.map(u => (
            <div key={u.id} onClick={() => selectPatient(u.id, u.name)} style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <strong style={{color:'#f1f5f9'}}>{u.name}</strong>
              {u.phone ? <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}> 📞 {u.phone}</span> : null}
            </div>
          ))}
        </div>
      )}
      {selected && <p style={{ color: '#86efac', marginTop: '0.5rem' }}>✅ Bemor tanlandi: {selected.name}</p>}
    </div>
  );
}