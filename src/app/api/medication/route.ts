import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'medications.json');

function readDB() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) { fs.writeFileSync(DB_PATH, '[]', 'utf-8'); return []; }
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return raw.trim() ? JSON.parse(raw) : [];
}
function writeDB(data: any) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// GET – bemorning barcha eslatmalari
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId kerak' }, { status: 400 });
  return NextResponse.json(readDB().filter((m: any) => m.userId === userId));
}

// POST – yangi eslatma qo‘shish
export async function POST(req: NextRequest) {
  const { userId, drugName, dosage, time, enabled } = await req.json();
  if (!userId || !drugName || !time) return NextResponse.json({ error: 'userId, drugName, time kerak' }, { status: 400 });
  const db = readDB();
  db.push({
    id: Date.now().toString() + Math.random().toString(36).substring(2),
    userId, drugName, dosage: dosage || '',
    time,
    enabled: enabled !== false,
    createdAt: new Date().toISOString()
  });
  writeDB(db);
  return NextResponse.json({ success: true });
}

// PATCH – eslatmani yoqish/o‘chirish
export async function PATCH(req: NextRequest) {
  const { id, enabled } = await req.json();
  if (!id) return NextResponse.json({ error: 'id kerak' }, { status: 400 });
  const db = readDB();
  const item = db.find((m: any) => m.id === id);
  if (item) { item.enabled = enabled; writeDB(db); }
  return NextResponse.json({ success: true });
}

// DELETE – eslatmani butunlay o‘chirish
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id kerak' }, { status: 400 });
  writeDB(readDB().filter((m: any) => m.id !== id));
  return NextResponse.json({ success: true });
}
