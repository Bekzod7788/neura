import { auth } from '@clerk/nextjs/server';
import { ScanUpload } from '@/components/ScanUpload';
import { Chat } from '@/components/Chat';
import { PrescriptionHistory } from '@/components/PrescriptionHistory';
import { DiagnosisHistory } from '@/components/DiagnosisHistory';
import { MedicationReminder } from '@/components/MedicationReminder';

export default async function PatientDashboard() {
  const { userId } = await auth();
  if (!userId) return <p>Iltimos, tizimga kiring.</p>;
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{textAlign:'center', marginBottom:'2rem', fontSize:'2.2rem'}}>Bemor Dashboard</h1>
      <div className="glass" style={{ marginBottom: '2rem' }}>
        <ScanUpload />
      </div>
      <Chat />
      <PrescriptionHistory />
      <DiagnosisHistory />
      <MedicationReminder />
    </div>
  );
}
