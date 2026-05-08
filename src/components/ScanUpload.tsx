'use client';
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

export function ScanUpload() {
  const { user } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [model, setModel] = useState('alzheimer_2d');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiComment, setAiComment] = useState('');
  const myRole = (user?.publicMetadata as any)?.role || 'patient';

  const handleUpload = async () => {
    if (!file) { setError('Iltimos, fayl tanlang'); return; }
    setError('');
    setAiComment('');
    setLoading(true);
    const formData = new FormData();
    formData.set('file', file);
    try {
      const res = await fetch('http://localhost:8000/predict/' + model, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Server xatosi');
      const data = await res.json();
      setResult(data);

      // AI izoh
      const prompt = data.class_name
        ? 'Bemorga tashxis: ' + data.class_name + '. Ehtimolliklar: ' + JSON.stringify(data.probabilities) + '. Bemor uchun oddiy tilda izoh bering va qo\'shimcha tekshiruv tavsiya qiling.'
        : 'Segmentatsiya natijasi: ' + JSON.stringify(data) + '. Bemor uchun oddiy tilda izoh bering.';
      try {
        const aiRes = await fetch('/api/medgemma', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        const aiData = await aiRes.json();
        setAiComment(aiData.result || '');
      } catch {}

      // Tarixga saqlash
      if (user?.id) {
        await fetch('/api/diagnosis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: myRole === 'patient' ? user.id : undefined,
            doctorId: myRole === 'doctor' ? user.id : undefined,
            modelName: model,
            result: data,
            fileUrl: data.file_url || null,
          }),
        });
      }
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div className="glass-light" style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
      <h3 style={{margin:0}}>Tibbiy tasvirni tahlil qilish</h3>
      <div style={{display:'flex', gap:'1rem', flexWrap:'wrap'}}>
        <select className="glass-select" value={model} onChange={(e:any) => setModel(e.target.value)} style={{flex:'1 1 200px'}}>
          <option value="alzheimer_2d">Alzheimer 2D</option>
          <option value="alzheimer_3d">Alzheimer 3D</option>
          <option value="ich_3d">ICH 3D (Qon quyilishi)</option>
          <option value="brain_tumor_3d">Miya o‘smasi 3D</option>
        </select>
        <div className="file-drop" style={{flex:'1 1 200px'}} onClick={() => document.getElementById('scan-file')?.click()}>
          <input id="scan-file" type="file" style={{display:'none'}} onChange={(e:any) => setFile(e.target.files?.[0] || null)} />
          <p style={{margin:0}}>{file ? file.name : 'Fayl tanlang yoki bu yerga sudrab keling'}</p>
        </div>
      </div>
      <button className="btn" onClick={handleUpload} disabled={loading} style={{alignSelf:'flex-start'}}>
        {loading ? 'Tahlil qilinmoqda...' : 'Tahlil boshlash'}
      </button>
      {error && <p style={{color:'#f87171'}}>{error}</p>}

      {result && (
        <div className="glass-light">
          {result.class_name ? (
            <div>
              <h4>Natija: <span style={{color:'#86efac'}}>{result.class_name}</span></h4>
              <p>Ishonch: {(result.probabilities[result.class_id] * 100).toFixed(1)}%</p>
              <details style={{marginTop:'0.5rem'}}>
                <summary style={{cursor:'pointer', color:'#A5B4FC'}}>Barcha sinflar va ehtimolliklar</summary>
                <ul style={{listStyle:'none', padding:0, marginTop:'0.5rem'}}>
                  {result.probabilities.map((prob: number, idx: number) => (
                    <li key={idx} style={{display:'flex', justifyContent:'space-between', padding:'0.25rem 0', borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                      <span>{result.class_names?.[idx] || 'Sinf ' + (idx+1)}</span>
                      <span style={{fontWeight:600}}>{(prob*100).toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ) : result.file_url && result.mask_url ? (
            <div>
              <p>Segmentatsiya niqobi tayyor. Yuklab oling:</p>
              <a href={result.file_url} className="btn" style={{textDecoration:'none', display:'inline-block', marginRight:'1rem'}}>Input fayl</a>
              <a href={result.mask_url} className="btn" style={{textDecoration:'none', display:'inline-block'}}>Niqob fayl</a>
              {result.findings && (
                <ul style={{marginTop:'0.5rem'}}>
                  {result.findings.map((f: string) => <li key={f}>{f}</li>)}
                </ul>
              )}
            </div>
          ) : (
            <pre style={{color:'#e2e8f0'}}>{JSON.stringify(result, null, 2)}</pre>
          )}
        </div>
      )}

      {aiComment && (
        <div className="glass-light">
          <h4>🤖 AI izohi</h4>
          <p>{aiComment}</p>
        </div>
      )}
    </div>
  );
}