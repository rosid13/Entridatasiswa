"use client";

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Student } from '@/types/student';
import { Search, Download } from 'lucide-react';
import { Badge } from './ui/badge';

interface StudentListProps {
  onStudentClick: (student: Student) => void;
}

export default function StudentList({ onStudentClick }: StudentListProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

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

  const handleExport = () => {
    if (students.length === 0) {
      toast({
        variant: "destructive",
        title: "Gagal Mengekspor",
        description: "Tidak ada data siswa untuk diekspor.",
      });
      return;
    }

    const dataToExport = students.map(s => ({
      "Nama Lengkap": s.fullName,
      "Jenis Kelamin": s.gender,
      "NISN": s.nisn ?? '',
      "Kelas": s.kelas ?? '',
      "Tempat Lahir": s.birthPlace ?? '',
      "Tanggal Lahir": s.birthDate ? format(new Date(s.birthDate), 'dd-MM-yyyy') : '',
      "NIK": s.nik ?? '',
      "Agama": s.religion,
      "Alamat": s.address ?? '',
      "RT": s.rt ?? '',
      "RW": s.rw ?? '',
      "Dusun": s.dusun ?? '',
      "Kelurahan": s.kelurahan ?? '',
      "Kecamatan": s.kecamatan ?? '',
      "Kode Pos": s.postalCode ?? '',
      "Jenis Tinggal": s.residenceType,
      "Alat Transportasi": s.transportMode,
      "Telepon": s.phone ?? '',
      "No. HP": s.mobilePhone,
      "Nama Ayah": s.fatherName,
      "Tahun Lahir Ayah": s.fatherBirthYear ?? '',
      "Pendidikan Ayah": s.fatherEducation ?? '',
      "Pekerjaan Ayah": s.fatherOccupation ?? '',
      "Penghasilan Ayah": s.fatherIncome ?? '',
      "NIK Ayah": s.fatherNik ?? '',
      "Nama Ibu": s.motherName,
      "Tahun Lahir Ibu": s.motherBirthYear ?? '',
      "Pendidikan Ibu": s.motherEducation ?? '',
      "Pekerjaan Ibu": s.motherOccupation ?? '',
      "Penghasilan Ibu": s.motherIncome ?? '',
      "NIK Ibu": s.motherNik ?? '',
      "Nama Wali": s.guardianName ?? '',
      "Tahun Lahir Wali": s.guardianBirthYear ?? '',
      "Pendidikan Wali": s.guardianEducation ?? '',
      "Pekerjaan Wali": s.guardianOccupation ?? '',
      "Penghasilan Wali": s.guardianIncome ?? '',
      "NIK Wali": s.guardianNik ?? '',
      "Nomor KIP": s.kipNumber ?? '',
      "Nama di KIP": s.kipName ?? '',
      "Nomor KKS/PKH": s.kksPkhNumber ?? '',
      "No. Registrasi Akta Lahir": s.birthCertificateRegNo ?? '',
      "Sekolah Asal": s.previousSchool ?? '',
      "Anak ke-": s.childOrder ?? '',
      "No. KK": s.kkNumber ?? '',
      "Berat Badan (kg)": s.weight ?? '',
      "Tinggi Badan (cm)": s.height ?? '',
      "Lingkar Kepala (cm)": s.headCircumference ?? '',
      "Jml Saudara Kandung": s.siblingsCount ?? '',
      "Tanggal Dibuat": s.createdAt ? format(new Date(s.createdAt), 'dd-MM-yyyy HH:mm:ss') : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DataSiswa");
    
    XLSX.writeFile(workbook, "Data_Siswa.xlsx", { bookType: 'xlsx', type: 'buffer' });
  };


  const filteredStudents = students.filter(student => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      student.fullName.toLowerCase().includes(searchLower) ||
      (student.nisn && student.nisn.toLowerCase().includes(searchLower));

    return matchesSearch;
  });

  return (
    <Card className="mt-12">
      <CardHeader>
        <CardTitle>Data Siswa Terdaftar</CardTitle>
        <CardDescription>Cari dan kelola data siswa yang sudah terdaftar dalam sistem.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan Nama atau NISN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10"
            />
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Ekspor Data
          </Button>
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
                    <TableCell><Badge variant="outline">{student.kelas || '-'}</Badge></TableCell>
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
