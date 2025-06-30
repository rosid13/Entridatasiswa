"use client";

import { useState, useRef } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import StudentForm from '@/components/student-form';
import StudentList from '@/components/student-list';
import StudentDetailModal from '@/components/student-detail-modal';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Student } from '@/types/student';


export default function Home() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

  return (
    <main className="min-h-screen bg-secondary p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">Manajemen Data Siswa</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">Platform terpusat untuk mengelola informasi siswa secara efisien, modern, dan aman.</p>
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
