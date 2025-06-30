"use client";

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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

interface StudentListProps {
  onStudentClick: (student: Student) => void;
}

export default function StudentList({ onStudentClick }: StudentListProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "siswa"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const studentsData: Student[] = [];
      querySnapshot.forEach((doc) => {
        studentsData.push({
          id: doc.id,
          ...doc.data(),
        } as Student);
      });
      setStudents(studentsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching students: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <Card className="mt-12">
        <CardHeader>
          <CardTitle>Data Siswa Terdaftar</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
             </div>
          ) : students.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>NISN</TableHead>
                    <TableHead>Jenis Kelamin</TableHead>
                    <TableHead>No. HP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id} onClick={() => onStudentClick(student)} className="cursor-pointer">
                      <TableCell className="font-medium">{student.fullName}</TableCell>
                      <TableCell>{student.nisn || '-'}</TableCell>
                      <TableCell>{student.gender}</TableCell>
                      <TableCell>{student.mobilePhone}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Belum ada data siswa yang terdaftar.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
