'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

export function PrescriptionHistory() {
  const { user } = useUser();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const role = (user?.publicMetadata as any)?.role || 'patient';

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams();
    if (role === 'patient') {
      params.set('patientId', user.id);
    } else {
      params.set('doctorId', user.id);
    }

    fetch('/api/prescription?' + params.toString())
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(data => setPrescriptions(data))
      .catch(err => {
        console.error('Retseptlar tarixi yuklanmadi:', err);
        setPrescriptions([]);
      });
  }, [user, role]);

  return (
    <div className="glass" style={{ marginTop: '1.5rem' }}>
      <h3>📋 Retseptlar tarixi</h3>
      {prescriptions.length === 0 ? (
        <p style={{color:'#94a3b8'}}>Hozircha retseptlar yo‘q.</p>
      ) : (
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                <th style={{padding:'0.5rem', textAlign:'left'}}>Sana</th>
                <th style={{padding:'0.5rem', textAlign:'left'}}>Shifokor</th>
                <th style={{padding:'0.5rem', textAlign:'left'}}>Muassasa</th>
                <th style={{padding:'0.5rem', textAlign:'left'}}>Retsept</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map(p => (
                <tr key={p.id} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  <td style={{padding:'0.5rem'}}>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td style={{padding:'0.5rem'}}>{p.doctorName}</td>
                  <td style={{padding:'0.5rem'}}>{p.institution}</td>
                  <td style={{padding:'0.5rem', maxWidth:'300px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.aiGeneratedText}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}