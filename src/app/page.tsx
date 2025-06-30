"use client";

import { useState, useRef, useEffect } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import StudentForm from '@/components/student-form';
import StudentList from '@/components/student-list';
import StudentDetailModal from '@/components/student-detail-modal';
import { db, auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Student } from '@/types/student';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut } from 'lucide-react';


export default function Home() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

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
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
  }

  const handleDelete = async (studentId: string) => {
    if (!selectedStudent) return;
    try {
      const studentRef = doc(db, "siswa", studentId);
      await deleteDoc(studentRef);
      toast({
        title: "Sukses!",
        description: "Data siswa berhasil dihapus.",
      });
      setSelectedStudent(null);
    } catch (error) {
       console.error("Error deleting document: ", error);
       toast({
        variant: "destructive",
        title: "Gagal!",
        description: "Terjadi kesalahan saat menghapus data.",
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
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // or a redirect component, but useEffect handles it
  }

  return (
    <main className="min-h-screen bg-secondary p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-10">
            <div className='text-left'>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground">Manajemen Data Siswa</h1>
                <p className="text-muted-foreground mt-3 max-w-2xl">Platform terpusat untuk mengelola informasi siswa secara efisien, modern, dan aman.</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
        </header>
        <div ref={formRef}>
          <StudentForm 
            studentToEdit={editingStudent} 
            onSuccess={handleSuccess}
            onCancel={handleCancelEdit}
          />
        </div>
        <StudentList onStudentClick={handleStudentClick} />
      </div>
       <StudentDetailModal
        student={selectedStudent}
        isOpen={!!selectedStudent}
        onClose={handleCloseModal}
        onEdit={handleStartEdit}
        onDelete={handleDelete}
      />
    </main>
  );
}
