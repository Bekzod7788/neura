'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

export function DiagnosisHistory() {
  const { user } = useUser();
  const [diagnoses, setDiagnoses] = useState<any[]>([]);

  const fetchDiagnoses = async () => {
    if (!user) return;
    const params = new URLSearchParams();
    // Bemor yoki shifokor bo‘lishiga qarab filtr
    const role = (user.publicMetadata as any)?.role || 'patient';
    if (role === 'patient') {
      params.set('patientId', user.id);
    } else {
      params.set('doctorId', user.id);
    }
    const res = await fetch(`/api/diagnosis?${params.toString()}`);
    const data = await res.json();
    setDiagnoses(data);
  };

  useEffect(() => {
    fetchDiagnoses();
  }, [user]);

  return (
    <div className="glass" style={{ marginTop: '1.5rem' }}>
      <h3>📋 Tahlillar tarixi</h3>
      {diagnoses.length === 0 ? (
        <p style={{color:'#94a3b8'}}>Hozircha tahlillar tarixi bo‘sh.</p>
      ) : (
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                <th style={{padding:'0.5rem', textAlign:'left'}}>Sana</th>
                <th style={{padding:'0.5rem', textAlign:'left'}}>Model</th>
                <th style={{padding:'0.5rem', textAlign:'left'}}>Natija</th>
                <th style={{padding:'0.5rem', textAlign:'left'}}>Fayl</th>
              </tr>
            </thead>
            <tbody>
              {diagnoses.map(d => (
                <tr key={d.id} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  <td style={{padding:'0.5rem'}}>{new Date(d.createdAt).toLocaleString('uz-UZ')}</td>
                  <td style={{padding:'0.5rem'}}>{d.modelName}</td>
                  <td style={{padding:'0.5rem'}}>
                    {d.result?.class_name || d.result?.summary || JSON.stringify(d.result).substring(0, 50)}
                  </td>
                  <td style={{padding:'0.5rem'}}>
                    {d.fileUrl ? <a href={d.fileUrl} style={{color:'#93c5fd'}}>Yuklab olish</a> : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
