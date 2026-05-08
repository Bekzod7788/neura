import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'chats.json');

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, '{}', 'utf-8');
    return {};
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDB(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId');
  const doctorId = searchParams.get('doctorId');
  if (!patientId || !doctorId) {
    return NextResponse.json({ error: 'patientId va doctorId kerak' }, { status: 400 });
  }
  const roomId = [patientId, doctorId].sort().join('_');
  const db = readDB();
  return NextResponse.json(db[roomId] || []);
}

export async function POST(req: NextRequest) {
  const { patientId, doctorId, senderId, senderName, text } = await req.json();
  if (!patientId || !doctorId || !text) {
    return NextResponse.json({ error: 'Maʼlumot yetarli emas' }, { status: 400 });
  }
  const roomId = [patientId, doctorId].sort().join('_');
  const msg = {
    id: Date.now().toString(),
    senderId,
    senderName,
    text,
    time: new Date().toISOString(),
  };
  const db = readDB();
  if (!db[roomId]) db[roomId] = [];
  db[roomId].push(msg);
  writeDB(db);
  return NextResponse.json({ success: true });
}
