import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Neura – Medical AI Diagnostics',
  description: 'Miya diagnostikasi uchun sun\'iy intellekt platformasi',
  icons: { icon: '/logo.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="uz">
        <body>
          <Navbar />
          <main style={{ paddingTop: '6rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', minHeight: '80vh' }}>
            {children}
          </main>
          <footer className="glass-light" style={{ margin: '2rem 1rem', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
            © 2025 Neura. All rights reserved. | Kuyliyev Bekzod
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}