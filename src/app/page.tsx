import StudentForm from '@/components/student-form';

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground font-headline">Formulir Entri Data Siswa</h1>
          <p className="text-muted-foreground mt-2">Silakan isi data siswa dengan lengkap dan benar.</p>
        </header>
        <StudentForm />
      </div>
    </main>
  );
}
