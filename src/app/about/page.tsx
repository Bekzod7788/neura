import Link from 'next/link';

export default function AboutPage() {
  return (
    <div style={{maxWidth:'800px', margin:'0 auto', paddingTop:'2rem'}}>
      <div className="glass">
        <h1>Loyiha haqida</h1>
        <p style={{fontSize:'1.1rem', marginBottom:'1.5rem'}}>
          MedicAI — sun’iy intellekt yordamida nevrologik kasalliklarni erta aniqlash va davolash jarayonini qo‘llab-quvvatlashga qaratilgan platforma.
        </p>
        <div style={{marginBottom:'1.5rem'}}>
          <h3>Ishlab chiquvchi</h3>
          <p><strong>Kuyliyev Bekzod Bobonazarovich</strong></p>
          <p>Samarqand davlat tibbiyot universiteti talabasi.</p>
          <p>Sun’iy intellekt, tibbiy tasvirlar tahlili va dasturiy ta’minotga ixtisoslashgan.</p>
          <p>📧 <a href="mailto:bek70507030@gmail.com" style={{color:'#93c5fd'}}>bek70507030@gmail.com</a></p>
        </div>
        <div style={{marginBottom:'1.5rem'}}>
          <h3>Texnologiyalar</h3>
          <ul style={{listStyle:'none', padding:0, display:'flex', flexWrap:'wrap', gap:'0.8rem'}}>
            {['Next.js','FastAPI','PyTorch','nnU-Net','MONAI','EfficientNet','MedGemma','PostgreSQL','Prisma'].map(t => (
              <li key={t} className="glass-light" style={{padding:'0.3rem 1rem', whiteSpace:'nowrap'}}>{t}</li>
            ))}
          </ul>
        </div>
        <p style={{color:'#94a3b8', fontSize:'0.9rem'}}>
          MedicAI — doimiy rivojlanishda. Taklif va hamkorlik uchun murojaat qiling.
        </p>
      </div>
    </div>
  );
}
