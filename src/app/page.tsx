"use client";

import { useState, useRef } from 'react';
import StudentForm from '@/components/student-form';
import StudentList from '@/components/student-list';
import StudentDetailModal from '@/components/student-detail-modal';

interface Student {
    id: string;
    createdAt: string;
    fullName: string;
    gender: string;
    nisn?: string;
    birthPlace?: string;
    birthDate?: string; 
    nik?: string;
    religion: string;
    address?: string;
    rt?: string;
    rw?: string;
    dusun?: string;
    kelurahan?: string;
    kecamatan?: string;
    postalCode?: string;
    residenceType: string;
    transportMode: string;
    phone?: string;
    mobilePhone: string;
    fatherName: string;
    fatherBirthYear?: string;
    fatherEducation?: string;
    fatherOccupation?: string;
    fatherIncome?: string;
    fatherNik?: string;
    motherName: string;
    motherBirthYear?: string;
    motherEducation?: string;
    motherOccupation?: string;
    motherIncome?: string;
    motherNik?: string;
    guardianName?: string;
    guardianBirthYear?: string;
    guardianEducation?: string;
    guardianOccupation?: string;
    guardianIncome?: string;
    guardianNik?: string;
    kipNumber?: string;
    kipName?: string;
    kksPkhNumber?: string;
    birthCertificateRegNo?: string;
    previousSchool?: string;
    childOrder?: string;
    kkNumber?: string;
    weight?: string;
    height?: string;
    headCircumference?: string;
    siblingsCount?: string;
}

export default function Home() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

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

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground font-headline">Formulir Entri Data Siswa</h1>
          <p className="text-muted-foreground mt-2">Silakan isi data siswa dengan lengkap dan benar.</p>
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
      />
    </main>
  );
}
