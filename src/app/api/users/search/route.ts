import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  if (!query) return NextResponse.json([]);

  const client = await clerkClient();
  const users = await client.users.getUserList({ limit: 50 });
  
  const results = users.data.filter(user => {
    const name = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const email = user.emailAddresses[0]?.emailAddress || '';
    const phone = (user.publicMetadata as any)?.phone || '';
    const q = query.toLowerCase();
    return name.includes(q) || email.includes(q) || phone.includes(q);
  }).map(user => ({
    id: user.id,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Nomsiz',
    role: user.publicMetadata?.role || 'patient',
    phone: (user.publicMetadata as any)?.phone || '',
  }));

  return NextResponse.json(results);
}
