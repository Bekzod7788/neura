import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET() {
  const client = await clerkClient();
  const users = await client.users.getUserList({ limit: 100 });
  const list = users.data.map(user => ({
    id: user.id,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Nomsiz',
    role: user.publicMetadata?.role || 'patient',
  }));
  return NextResponse.json(list);
}
