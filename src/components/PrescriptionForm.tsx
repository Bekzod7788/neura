'use client';
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { PatientSelect } from './PatientSelect';

interface Drug { name: string; dosage: string; quantity: string; form: string; times: string[]; }
const DRUG_FORMS = ['tab.', 'caps.', 'sol.', 'ung.', 'supp.', 'gtt.'];
const TIME_OPTIONS = ['Ertalab', 'Tushlikda', 'Kechqurun', 'Yotishdan oldin'];

export function PrescriptionForm() {
  const { user } = useUser();
  const [drugs, setDrugs] = useState<Drug[]>([{ name: '', dosage: '', quantity: '', form: 'tab.', times: [] }]);
  const [institution, setInstitution] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [aiComment, setAiComment] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string } | null>(null);

  const addDrug = () => setDrugs([...drugs, { name: '', dosage: '', quantity: '', form: 'tab.', times: [] }]);
  const updateDrug = (i: number, field: keyof Drug, value: any) => {
    const newDrugs = [...drugs];
    (newDrugs[i] as any)[field] = value;
    setDrugs(newDrugs);
  };

  const generate = async () => {
    if (!drugs[0].name) return alert('Dori nomini kiriting');
    setLoading(true);
    const res = await fetch('/api/prescription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: selectedPatient?.id || 'unknown',
        doctorId: user?.id,
        doctorName: user?.fullName,
        institution,
        drugs: drugs.filter(d => d.name),
      }),
    });
    const data = await res.json();
    setResult(data);
    try {
      const aiRes = await fetch('/api/medgemma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Dorilar: ' + (data.aiGeneratedText||'') + '. Qisqacha taʼsir mexanizmi.' }),
      });
      const aiData = await aiRes.json();
      setAiComment(aiData.result || '');
    } catch {}
    setLoading(false);
  };

  const downloadPDF = async () => {
    if (!result) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    // -------- BINA FONLI PLAST --------
    doc.setFillColor(108, 99, 255);   // #6C63FF
    doc.rect(0, 0, 210, 32, 'F');

    // -------- NEURA LOGO (oddiy tekst) --------
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Neura', 20, 18);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('MEDICAL INTELLIGENCE', 20, 24);

    // -------- MA'LUMOTLAR --------
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Sana: ' + new Date(result.createdAt).toLocaleDateString(), 150, 38);
    doc.text('Muassasa: ' + (institution || 'Koʻrsatilmagan'), 20, 44);
    doc.text('Shifokor: ' + (user?.fullName || 'Nomaʼlum'), 20, 50);
    if (selectedPatient) doc.text('Bemor: ' + selectedPatient.name, 20, 56);

    // -------- RESEPT BLOKI --------
    let y = 66;
    doc.setFontSize(14);
    doc.setTextColor(108, 99, 255);
    doc.text('RESEPT (Rp.)', 20, y);
    y += 10;

    const lines = (result.aiGeneratedText || '').split('\n');
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    let isFirstRp = true;
    for (const line of lines) {
      if (line.trim() === '') { y += 2; continue; }
      if (line.trim().startsWith('Rp.:')) {
        if (!isFirstRp) {
          doc.setDrawColor(108, 99, 255);
          doc.setLineWidth(0.2);
          doc.line(20, y - 2, 190, y - 2);
          y += 4;
        }
        isFirstRp = false;
        doc.setFontSize(12);
        doc.setTextColor(0, 212, 170);
        doc.text(line, 20, y);
        doc.setFontSize(11);
        doc.setTextColor(51, 65, 85);
      } else {
        doc.text('    ' + line, 20, y);
      }
      y += 6;
    }

    // -------- AI SHARHI --------
    if (aiComment) {
      y += 6;
      doc.setDrawColor(108, 99, 255);
      doc.setLineWidth(0.5);
      doc.line(20, y, 190, y);
      y += 6;
      doc.setFontSize(12);
      doc.setTextColor(108, 99, 255);
      doc.text('AI SHARHI:', 20, y);
      y += 6;
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      const commentLines = doc.splitTextToSize(aiComment, 170);
      for (const line of commentLines) {
        doc.text(line, 20, y);
        y += 5;
      }
    }

    // -------- IMZO --------
    y += 8;
    doc.setDrawColor(108, 99, 255);
    doc.setLineWidth(0.2);
    doc.line(20, y, 190, y);
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Shifokor imzosi: _________________________', 20, y);
    doc.text('Raqamli verifikatsiya: NEURA AI', 20, y + 6);

    doc.save('retsept_' + result.id + '.pdf');
  };

  const resetForm = () => {
    setDrugs([{ name: '', dosage: '', quantity: '', form: 'tab.', times: [] }]);
    setResult(null);
    setSelectedPatient(null);
  };

  return (
    <div style={{display:'flex', flexDirection:'column', gap:'1.25rem'}}>
      <h3 className="glass-light" style={{margin:0}}>✍️ Retsept yozish</h3>
      <PatientSelect onSelect={(id,name) => setSelectedPatient({id,name})} />
      {selectedPatient && <p>✅ Bemor: {selectedPatient.name}</p>}
      <input className="glass-input" placeholder="Muassasa" value={institution} onChange={e => setInstitution(e.target.value)} />
      {drugs.map((drug,i) => (
        <div key={i} className="glass-light" style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
          <input className="glass-input" placeholder="Dori nomi" value={drug.name} onChange={e => updateDrug(i,'name',e.target.value)} />
          <div style={{display:'flex', gap:'0.75rem'}}>
            <input className="glass-input" placeholder="Dozasi (500 mg)" value={drug.dosage} onChange={e => updateDrug(i,'dosage',e.target.value)} style={{flex:2}} />
            <input className="glass-input" type="number" placeholder="Miqdori" value={drug.quantity} onChange={e => updateDrug(i,'quantity',e.target.value)} style={{flex:1}} />
          </div>
          <select className="glass-select" value={drug.form} onChange={e => updateDrug(i,'form',e.target.value)}>
            {DRUG_FORMS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap'}}>
            {TIME_OPTIONS.map(t => (
              <button key={t} className="btn" style={drug.times.includes(t) ? {background:'#6C63FF', borderColor:'#6C63FF'} : {}}
                onClick={() => {
                  const newTimes = drug.times.includes(t) ? drug.times.filter(x => x!==t) : [...drug.times, t];
                  updateDrug(i, 'times', newTimes);
                }}>{t}</button>
            ))}
          </div>
        </div>
      ))}
      <div style={{display:'flex', gap:'1rem', flexWrap:'wrap'}}>
        <button className="btn" onClick={addDrug}>➕ Yana dori qoʻshish</button>
        <button className="btn" onClick={generate} disabled={loading}>{loading ? 'Yozilmoqda...' : '📝 Retsept yozish'}</button>
        <button className="btn" onClick={resetForm}>🆕 Yangi retsept</button>
      </div>
      {result?.aiGeneratedText && (
        <div className="glass-light">
          <pre style={{whiteSpace:'pre-wrap'}}>{result.aiGeneratedText}</pre>
          {aiComment && <p style={{marginTop:'0.5rem'}}><strong>📘 AI sharhi:</strong> {aiComment}</p>}
          <button className="btn" onClick={downloadPDF} style={{marginTop:'0.5rem'}}>📥 PDF yuklab olish</button>
        </div>
      )}
    </div>
  );
}