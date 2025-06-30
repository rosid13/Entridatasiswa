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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Student } from '@/types/student';


interface StudentListProps {
  onStudentClick: (student: Student) => void;
}

export default function StudentList({ onStudentClick }: StudentListProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('__all__');
  const [uniqueClasses, setUniqueClasses] = useState<string[]>([]);

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
      const classes = [...new Set(studentsData.map(s => s.kelas).filter(Boolean) as string[])];
      setUniqueClasses(classes.sort());
      setLoading(false);
    }, (error) => {
      console.error("Error fetching students: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredStudents = students.filter(student => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      student.fullName.toLowerCase().includes(searchLower) ||
      (student.nisn && student.nisn.toLowerCase().includes(searchLower));

    const matchesClass = selectedClass === '__all__' ? true : student.kelas === selectedClass;

    return matchesSearch && matchesClass;
  });

  return (
    <Card className="mt-12">
      <CardHeader>
        <CardTitle>Data Siswa Terdaftar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            placeholder="Cari Nama atau NISN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow"
          />
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="sm:w-[200px]">
              <SelectValue placeholder="Filter Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Semua Kelas</SelectItem>
              {uniqueClasses.map(cls => (
                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {loading ? (
           <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
           </div>
        ) : filteredStudents.length > 0 ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>NISN</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Jenis Kelamin</TableHead>
                  <TableHead>No. HP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id} onClick={() => onStudentClick(student)} className="cursor-pointer">
                    <TableCell className="font-medium">{student.fullName}</TableCell>
                    <TableCell>{student.nisn || '-'}</TableCell>
                    <TableCell>{student.kelas || '-'}</TableCell>
                    <TableCell>{student.gender}</TableCell>
                    <TableCell>{student.mobilePhone}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            {students.length > 0 ? 'Tidak ada siswa yang cocok dengan kriteria pencarian.' : 'Belum ada data siswa yang terdaftar.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
