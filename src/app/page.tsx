
"use client";

import { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import Link from 'next/link';
import { doc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import StudentForm from '@/components/student-form';
import StudentList from '@/components/student-list';
const StudentDetailModal = lazy(() => import('@/components/student-detail-modal'));
import { db, auth, logAndReportError } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Student } from '@/types/student';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut, LayoutDashboard, Calendar } from 'lucide-react';
import Footer from '@/components/footer';
import { useAcademicYear } from '@/context/academic-year-context';

export interface AppSession {
  user: User;
  role: string;
}

export default function Home() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [listKey, setListKey] = useState(0); 
  const formRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [session, setSession] = useState<AppSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { activeYear, isLoading: isYearLoading } = useAcademicYear();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRoleRef = doc(db, "userRoles", currentUser.uid);
        const docSnap = await getDoc(userRoleRef);

        let userRole = 'user';
        if (docSnap.exists() && docSnap.data().role) {
          userRole = docSnap.data().role;
        } else if (!docSnap.exists()) {
          try {
            await setDoc(userRoleRef, { role: 'user', email: currentUser.email });
          } catch (error) {
            logAndReportError(error, "Failed to create user role");
            toast({
              variant: "destructive",
              title: "Gagal Menginisialisasi Akun",
              description: "Tidak dapat mengatur peran pengguna. Coba muat ulang halaman.",
            });
          }
        }
        
        setSession({ user: currentUser, role: userRole });

      } else {
        router.push('/login');
        setSession(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, toast]);

  useEffect(() => {
    if (!isYearLoading && !activeYear) {
      router.push('/select-year');
    }
  }, [activeYear, isYearLoading, router]);

  const handleStudentClick = useCallback((student: Student) => {
    setSelectedStudent(student);
    setEditingStudent(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedStudent(null);
  }, []);

  const handleStartEdit = useCallback((student: Student) => {
    setSelectedStudent(null);
    setEditingStudent(student);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  const handleSuccess = useCallback((updatedStudent?: Student) => {
    if (updatedStudent) {
      setSelectedStudent(updatedStudent);
    }
    setEditingStudent(null);
    setListKey(prev => prev + 1); 
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingStudent(null);
  }, []);

  const handleDelete = useCallback(async (studentId: string) => {
    if (!selectedStudent || session?.role !== 'admin') return;
    try {
      const studentRef = doc(db, "siswa", studentId);
      await deleteDoc(studentRef);
      toast({
        title: "Data Dihapus!",
        description: "Data siswa berhasil dihapus.",
      });
      setSelectedStudent(null);
      setListKey(prev => prev + 1); 
    } catch (error) {
       logAndReportError(error, "Error deleting document");
       toast({
        variant: "destructive",
        title: "Gagal Menghapus Data",
        description: "Terjadi kesalahan. Periksa koneksi atau hak akses Anda.",
      });
    }
  }, [selectedStudent, session?.role, toast]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logout Berhasil",
        description: "Anda telah keluar dari sesi.",
      });
      router.push('/login');
    } catch (error) {
      logAndReportError(error, "Logout failed");
      toast({
        variant: "destructive",
        title: "Gagal Logout!",
        description: "Terjadi kesalahan saat keluar.",
      });
    }
  }, [router, toast]);

  if (loading || isYearLoading || !activeYear) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return null; 
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <header className="bg-card/70 backdrop-blur-md border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 sm:p-6">
              <div className='text-left'>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-primary via-fuchsia-500 to-secondary bg-clip-text text-transparent drop-shadow-sm">Manajemen Data Siswa</h1>
                  <p className="text-muted-foreground mt-3 max-w-2xl">Platform terpusat untuk mengelola informasi siswa secara efisien, modern, dan aman.</p>
              </div>
              <div className="flex items-center flex-wrap gap-2 justify-start sm:justify-end">
                  <Button variant="outline" onClick={() => router.push('/select-year')}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Ubah Tahun Ajaran
                  </Button>
                  {session.role === 'admin' && (
                    <Link href="/admin/dashboard" passHref>
                        <Button variant="outline">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Dashboard
                        </Button>
                    </Link>
                  )}
                  <Button variant="outline" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                  </Button>
              </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
          <div ref={formRef}>
            <StudentForm 
              studentToEdit={editingStudent} 
              onSuccess={handleSuccess}
              onCancel={handleCancelEdit}
            />
          </div>
          <StudentList onStudentClick={handleStudentClick} key={listKey} activeYear={activeYear} />
        </div>
        <Suspense fallback={null}>
         <StudentDetailModal
          student={selectedStudent}
          isOpen={!!selectedStudent}
          onClose={handleCloseModal}
          onEdit={handleStartEdit}
          onDelete={handleDelete}
          userSession={session}
        />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
