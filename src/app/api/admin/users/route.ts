import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET() {
  const client = await clerkClient();
  const users = await client.users.getUserList({ limit: 100 });
  return NextResponse.json(users.data.map(user => ({
    id: user.id,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Nomsiz',
    email: user.emailAddresses[0]?.emailAddress || '',
    role: user.publicMetadata?.role || 'patient',
    createdAt: user.createdAt,
  })));
}

export async function PATCH(req: NextRequest) {
  const { userId, role } = await req.json();
  if (!userId || !role) return NextResponse.json({ error: 'userId va role kerak' }, { status: 400 });
  const client = await clerkClient();
  await client.users.updateUser(userId, { publicMetadata: { role } });
  return NextResponse.json({ success: true });
}
