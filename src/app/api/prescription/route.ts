import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'prescriptions.json');
const DATA_DIR = path.join(process.cwd(), 'data');

function readDB() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) { fs.writeFileSync(DB_PATH, '[]', 'utf-8'); return []; }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}
function writeDB(data: any) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

const SYSTEM_PROMPT = "Siz tajribali farmatsevt-shifokorsiz. Sizga dori nomi, miqdori va qabul vaqtlari beriladi. Siz faqat quyidagi 3 qatorli formatda javob berasiz. Boshqa hech qanday izoh, salom yoki qo'shimcha matn yozmaysiz.\nFormat:\nRp.: [Dori nomi] [doza]\nD.t.d. N [soni] in [shakl]\nS.: Kuniga [necha mahal] ([vaqtlari]) [ovqatdan oldin/keyin]\n\nMisol:\nRp.: Analgini 100 mg tab.\nD.t.d. N 20 in tab.\nS.: Kuniga 2 mahal (ertalab, kechqurun) ovqatdan keyin.";

export async function POST(req: NextRequest) {
  const { patientId, doctorId, doctorName, institution, drugs } = await req.json();
  if (!patientId || !drugs) return NextResponse.json({ error: 'patientId va drugs kerak' }, { status: 400 });

  const prompt = drugs.map((d: any) =>
    `${d.name} ${d.dosage}, ${d.quantity} dona, ${d.form}, ${d.times.join(', ')}`
  ).join('\n');

  let aiText = '';
  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.0,
        max_tokens: 300
      })
    });
    if (groqRes.ok) {
      const groqData = await groqRes.json();
      aiText = groqData.choices?.[0]?.message?.content || '';
    }
  } catch (e) { console.error(e); }

  if (!aiText || !aiText.startsWith('Rp.:')) {
    aiText = drugs.map(d =>
      `Rp.: ${d.name} ${d.dosage} ${d.form}\nD.t.d. N ${d.quantity} in ${d.form}\nS.: ${d.times.join(', ')}`
    ).join('\n\n');
  }

  const newPrescription = {
    id: Date.now().toString(),
    patientId, doctorId, doctorName, institution,
    drugs,
    aiGeneratedText: aiText,
    createdAt: new Date().toISOString()
  };

  const db = readDB(); db.push(newPrescription); writeDB(db);
  return NextResponse.json(newPrescription);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId');
  const doctorId = searchParams.get('doctorId');
  let db = readDB();
  if (patientId) db = db.filter(p => p.patientId === patientId);
  if (doctorId) db = db.filter(p => p.doctorId === doctorId);
  db.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json(db);
}