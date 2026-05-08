import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const { userId, sessionClaims } = await auth();

  // Agar tizimga kirmagan bo‘lsa, login sahifasiga
  if (!userId) {
    redirect('/sign-in');
  }

  const role = (sessionClaims?.publicMetadata as any)?.role || 'patient';

  // Rolga qarab yo‘naltirish
  if (role === 'doctor') {
    redirect('/doctor');
  } else if (role === 'admin') {
    redirect('/admin');
  } else {
    redirect('/patient');
  }
}
