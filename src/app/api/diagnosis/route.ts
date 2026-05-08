import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'diagnoses.json');

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, '[]', 'utf-8');
    return [];
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDB(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// GET – tashxislar ro‘yxati
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId');
  const doctorId = searchParams.get('doctorId');

  const db = readDB();
  let filtered = db;

  if (patientId) {
    filtered = filtered.filter((d: any) => d.patientId === patientId);
  }
  if (doctorId) {
    filtered = filtered.filter((d: any) => d.doctorId === doctorId);
  }

  // Eng yangi tashxislar birinchi bo‘lib chiqishi uchun saralash
  filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(filtered);
}

// POST – yangi tashxis qo‘shish (ScanUpload komponentidan chaqiriladi)
export async function POST(req: NextRequest) {
  const { patientId, doctorId, modelName, result, fileUrl } = await req.json();
  if (!patientId || !modelName || !result) {
    return NextResponse.json({ error: 'patientId, modelName va result kerak' }, { status: 400 });
  }

  const newDiagnosis = {
    id: Date.now().toString(),
    patientId,
    doctorId: doctorId || null,
    modelName,
    result,               // { class_name, probabilities, summary, findings, ... }
    fileUrl: fileUrl || null,
    createdAt: new Date().toISOString(),
  };

  const db = readDB();
  db.push(newDiagnosis);
  writeDB(db);

  return NextResponse.json(newDiagnosis);
}
