import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');
  
  const client = await clerkClient();
  const users = await client.users.getUserList({ limit: 100 });
  
  const filtered = users.data
    .filter(user => {
      if (!role) return true;
      return user.publicMetadata?.role === role;
    })
    .map(user => ({
      id: user.id,
      name: user.fullName || user.emailAddresses[0]?.emailAddress || 'Nomaʼlum',
      email: user.emailAddresses[0]?.emailAddress || '',
      role: user.publicMetadata?.role || 'patient',
    }));

  return NextResponse.json(filtered);
}
