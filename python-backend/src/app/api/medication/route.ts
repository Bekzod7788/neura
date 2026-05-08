import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'medications.json');

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId kerak' }, { status: 400 });
  const db = readDB();
  const userMeds = db.filter((m: any) => m.userId === userId);
  return NextResponse.json(userMeds);
}

export async function POST(req: NextRequest) {
  const { userId, drugName, dosage, times, frequency } = await req.json();
  if (!userId || !drugName || !times || !frequency) {
    return NextResponse.json({ error: 'Maʼlumot toʻliq emas' }, { status: 400 });
  }
  const db = readDB();
  times.forEach((time: string) => {
    db.push({
      id: Date.now().toString() + Math.random(),
      userId,
      drugName,
      dosage,
      time,          // "Ertalab", "Kechqurun"
      createdAt: new Date().toISOString(),
    });
  });
  writeDB(db);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id kerak' }, { status: 400 });
  const db = readDB();
  const filtered = db.filter((m: any) => m.id !== id);
  writeDB(filtered);
  return NextResponse.json({ success: true });
}
