import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function PATCH(req: NextRequest) {
  const { userId, firstName, lastName, phone, institution } = await req.json();
  if (!userId) return NextResponse.json({ error: 'userId kerak' }, { status: 400 });

  const client = await clerkClient();
  const metadata: any = { phone };
  if (institution) metadata.institution = institution;

  await client.users.updateUser(userId, {
    firstName,
    lastName,
    publicMetadata: metadata,
  });

  return NextResponse.json({ success: true });
}
