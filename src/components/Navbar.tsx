'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isLoaded } = useUser();
  const pathname = usePathname();

  // Tashqi bosishda menyuni yopish
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.nav-container') && open) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  // Yo'l o'zgarganda menyuni avtomatik yopish
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <nav className="glass-light nav-container" style={{ position: 'fixed', top: '1rem', left: '1rem', right: '1rem', zIndex: 50 }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
        <Image src="/logo.svg" alt="Neura" width={140} height={40} priority />
      </Link>
      <button className="burger" onClick={() => setOpen(!open)}>☰</button>
      <div className={open ? 'nav-links open' : 'nav-links'}>
        <Link href="/about">Biz haqimizda</Link>
        <Link href="/patient">Bemor</Link>
        <Link href="/doctor">Shifokor</Link>
        <Link href="/admin">Admin</Link>
        <Link href="/profile">Profil</Link>
        {!isLoaded ? null : user ? (
          <UserButton afterSignOutUrl="/" />
        ) : (
          <Link href="/sign-in">Kirish</Link>
        )}
      </div>
    </nav>
  );
}