
"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { doc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import StudentForm from '@/components/student-form';
import StudentList from '@/components/student-list';
import StudentDetailModal from '@/components/student-detail-modal';
import { db, auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Student } from '@/types/student';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut, LayoutDashboard } from 'lucide-react';
import Footer from '@/components/footer';

export interface AppSession {
  user: User;
  role: string;
}

export default function Home() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [listKey, setListKey] = useState(0); // Key to force re-render of the list
  const formRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [session, setSession] = useState<AppSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRoleRef = doc(db, "userRoles", currentUser.uid);
        const docSnap = await getDoc(userRoleRef);

        let userRole = 'user'; // Peran default
        if (docSnap.exists() && docSnap.data().role) {
          userRole = docSnap.data().role;
        } else if (!docSnap.exists()) {
          // Buat dokumen peran untuk pengguna baru
          try {
            await setDoc(userRoleRef, { role: 'user', email: currentUser.email });
          } catch (error) {
            console.error("Failed to create user role:", error);
            toast({
              variant: "destructive",
              title: "Gagal Menginisialisasi Akun",
              description: "Tidak dapat mengatur peran pengguna. Coba muat ulang halaman.",
            });
          }
        }
        
        // Admins should start at the dashboard, users at the student list
        if (userRole === 'admin' && window.location.pathname !== '/admin/dashboard' && window.location.pathname === '/login') {
            router.push('/admin/dashboard');
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

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setEditingStudent(null);
  };

  const handleCloseModal = () => {
    setSelectedStudent(null);
  };

  const handleStartEdit = (student: Student) => {
    setSelectedStudent(null);
    setEditingStudent(student);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSuccess = (updatedStudent?: Student) => {
    if (updatedStudent) {
      setSelectedStudent(updatedStudent);
    }
    setEditingStudent(null);
    setListKey(prev => prev + 1); // Force a refresh of the student list
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
  }

  const handleDelete = async (studentId: string) => {
    if (!selectedStudent || session?.role !== 'admin') return;
    try {
      const studentRef = doc(db, "siswa", studentId);
      await deleteDoc(studentRef);
      toast({
        title: "Data Dihapus!",
        description: "Data siswa berhasil dihapus.",
      });
      setSelectedStudent(null);
      setListKey(prev => prev + 1); // Force a refresh of the student list
    } catch (error) {
       console.error("Error deleting document: ", error);
       toast({
        variant: "destructive",
        title: "Gagal Menghapus Data",
        description: "Terjadi kesalahan. Periksa koneksi atau hak akses Anda.",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logout Berhasil",
        description: "Anda telah keluar dari sesi.",
      });
      router.push('/login');
    } catch (error) {
      console.error("Logout failed: ", error);
      toast({
        variant: "destructive",
        title: "Gagal Logout!",
        description: "Terjadi kesalahan saat keluar.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return null; // or a redirect component, but useEffect handles it
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-grow p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="flex justify-between items-center mb-10">
              <div className='text-left'>
                  <h1 className="text-4xl md:text-5xl font-bold text-foreground">Manajemen Data Siswa</h1>
                  <p className="text-muted-foreground mt-3 max-w-2xl">Platform terpusat untuk mengelola informasi siswa secara efisien, modern, dan aman.</p>
              </div>
              <div className="flex items-center gap-2">
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
          </header>
          <div ref={formRef}>
            <StudentForm 
              studentToEdit={editingStudent} 
              onSuccess={handleSuccess}
              onCancel={handleCancelEdit}
            />
          </div>
          <StudentList onStudentClick={handleStudentClick} key={listKey} />
        </div>
         <StudentDetailModal
          student={selectedStudent}
          isOpen={!!selectedStudent}
          onClose={handleCloseModal}
          onEdit={handleStartEdit}
          onDelete={handleDelete}
          userSession={session}
        />
      </main>
      <Footer />
    </div>
  );
}
