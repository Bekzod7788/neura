import { ScanUpload } from '@/components/ScanUpload';
import { PrescriptionForm } from '@/components/PrescriptionForm';
import { Chat } from '@/components/Chat';
import { PrescriptionHistory } from '@/components/PrescriptionHistory';
import { DiagnosisHistory } from '@/components/DiagnosisHistory';

export default function DoctorDashboard() {
  return (
    <div style={{maxWidth:'1200px', margin:'0 auto'}}>
      <h1>Shifokor Dashboard</h1>
      <div className="glass" style={{marginBottom:'2rem'}}>
        <ScanUpload />
      </div>
      <div className="glass" style={{marginBottom:'2rem'}}>
        <PrescriptionForm />
      </div>
      <Chat />
      <PrescriptionHistory />
      <DiagnosisHistory />
    </div>
  );
}