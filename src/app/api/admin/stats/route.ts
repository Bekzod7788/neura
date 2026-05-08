import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET() {
  const client = await clerkClient();
  const totalUsers = await client.users.getCount();
  const allUsers = await client.users.getUserList({ limit: 1000 });
  let patients = 0, doctors = 0;
  allUsers.data.forEach(user => {
    const role = user.publicMetadata?.role;
    if (role === 'patient') patients++;
    else if (role === 'doctor') doctors++;
  });
  return NextResponse.json({ totalUsers, patients, doctors });
}
