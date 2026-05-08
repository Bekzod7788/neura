'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const role = (user?.publicMetadata as any)?.role;
  const isAdmin = role === 'admin';

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.replace('/sign-in');
      return;
    }
    if (!isAdmin) {
      router.replace('/patient');
      return;
    }
    fetchStats();
    fetchUsers();
  }, [user, isLoaded, isAdmin]);

  const changeRole = async (userId: string, newRole: string) => {
    setLoading(true);
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    });
    await fetchUsers();
    await fetchStats();
    setLoading(false);
  };

  if (!isLoaded || !user) {
    return <div style={{maxWidth:'1200px', margin:'0 auto', padding:'2rem', textAlign:'center'}}>Yuklanmoqda...</div>;
  }

  if (!isAdmin) {
    return <div style={{maxWidth:'1200px', margin:'0 auto', padding:'2rem', textAlign:'center'}}>Ruxsat yo‘q. Yo‘naltirilmoqda...</div>;
  }

  return (
    <div style={{maxWidth:'1200px', margin:'0 auto'}}>
      <h1 style={{textAlign:'center', marginBottom:'2rem'}}>Admin Panel</h1>

      {stats && (
        <div style={{display:'grid', gap:'1.5rem', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', marginBottom:'2rem'}}>
          <div className="glass">
            <h2>👥 Jami foydalanuvchilar</h2>
            <p style={{fontSize:'2.5rem', margin:0}}>{stats.totalUsers}</p>
          </div>
          <div className="glass">
            <h2>🩺 Bemorlar</h2>
            <p style={{fontSize:'2.5rem', margin:0}}>{stats.patients}</p>
          </div>
          <div className="glass">
            <h2>👨‍⚕️ Shifokorlar</h2>
            <p style={{fontSize:'2.5rem', margin:0}}>{stats.doctors}</p>
          </div>
        </div>
      )}

      <div className="glass">
        <h2>📋 Foydalanuvchilar ro‘yxati</h2>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                <th style={{padding:'0.5rem', textAlign:'left'}}>Ism</th>
                <th style={{padding:'0.5rem', textAlign:'left'}}>Email</th>
                <th style={{padding:'0.5rem', textAlign:'left'}}>Rol</th>
                <th style={{padding:'0.5rem', textAlign:'left'}}>Sana</th>
                <th style={{padding:'0.5rem', textAlign:'left'}}>Amal</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  <td style={{padding:'0.5rem'}}>{u.name}</td>
                  <td style={{padding:'0.5rem'}}>{u.email}</td>
                  <td style={{padding:'0.5rem'}}>
                    <span style={{color: u.role === 'doctor' ? '#93c5fd' : u.role === 'admin' ? '#fdba74' : '#86efac'}}>
                      {u.role === 'doctor' ? 'Shifokor' : u.role === 'admin' ? 'Admin' : 'Bemor'}
                    </span>
                  </td>
                  <td style={{padding:'0.5rem'}}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td style={{padding:'0.5rem'}}>
                    {u.role !== 'admin' && (
                      <button
                        className="btn"
                        onClick={() => changeRole(u.id, u.role === 'patient' ? 'doctor' : 'patient')}
                        disabled={loading}
                        style={{padding:'0.2rem 0.8rem', fontSize:'0.8rem'}}
                      >
                        {u.role === 'patient' ? '👨‍⚕️ Shifokor qilish' : '🩺 Bemor qilish'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}