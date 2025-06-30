"use client";

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
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

    // 1. Define logical column headers
    const headers = [
      // Data Pribadi
      "Nama Lengkap", "Jenis Kelamin", "NISN", "Kelas", "Tempat Lahir", "Tanggal Lahir", "NIK", "Agama",
      // Alamat
      "Alamat", "RT", "RW", "Dusun", "Kelurahan", "Kecamatan", "Kode Pos",
      // Kontak & Lainnya
      "Jenis Tinggal", "Alat Transportasi", "Telepon", "No. HP",
      // Data Ayah
      "Nama Ayah", "Tahun Lahir Ayah", "Pendidikan Ayah", "Pekerjaan Ayah", "Penghasilan Ayah", "NIK Ayah",
      // Data Ibu
      "Nama Ibu", "Tahun Lahir Ibu", "Pendidikan Ibu", "Pekerjaan Ibu", "Penghasilan Ibu", "NIK Ibu",
      // Data Wali
      "Nama Wali", "Tahun Lahir Wali", "Pendidikan Wali", "Pekerjaan Wali", "Penghasilan Wali", "NIK Wali",
      // Data Tambahan
      "No. KK", "Anak ke-", "Jml Saudara Kandung", "Sekolah Asal", "No. Registrasi Akta Lahir", "Nomor KIP", "Nama di KIP", "Nomor KKS/PKH", "Berat Badan (kg)", "Tinggi Badan (cm)", "Lingkar Kepala (cm)",
      // Meta Data
      "Tanggal Dibuat"
    ];

    // 2. Map student data to match the header order
    const dataToExport = students.map(s => ([
      s.fullName, s.gender, s.nisn ?? '', s.kelas ?? '', s.birthPlace ?? '', s.birthDate ? format(new Date(s.birthDate), 'dd-MM-yyyy') : '', s.nik ?? '', s.religion,
      s.address ?? '', s.rt ?? '', s.rw ?? '', s.dusun ?? '', s.kelurahan ?? '', s.kecamatan ?? '', s.postalCode ?? '',
      s.residenceType, s.transportMode, s.phone ?? '', s.mobilePhone,
      s.fatherName, s.fatherBirthYear ?? '', s.fatherEducation ?? '', s.fatherOccupation ?? '', s.fatherIncome ?? '', s.fatherNik ?? '',
      s.motherName, s.motherBirthYear ?? '', s.motherEducation ?? '', s.motherOccupation ?? '', s.motherIncome ?? '', s.motherNik ?? '',
      s.guardianName ?? '', s.guardianBirthYear ?? '', s.guardianEducation ?? '', s.guardianOccupation ?? '', s.guardianIncome ?? '', s.guardianNik ?? '',
      s.kkNumber ?? '', s.childOrder ?? '', s.siblingsCount ?? '', s.previousSchool ?? '', s.birthCertificateRegNo ?? '', s.kipNumber ?? '', s.kipName ?? '', s.kksPkhNumber ?? '', s.weight ?? '', s.height ?? '', s.headCircumference ?? '',
      s.createdAt ? format(new Date(s.createdAt), 'dd-MM-yyyy HH:mm:ss') : ''
    ]));
    
    // 3. Create worksheet with title, date, and data
    const workbook = XLSX.utils.book_new();
    const finalData = [
      ["Laporan Data Siswa - Student Data Entry"],
      [`Tanggal Ekspor: ${format(new Date(), "dd MMMM yyyy HH:mm", { locale: id })}`],
      [], // Blank row for spacing
      headers,
      ...dataToExport
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(finalData);

    // 4. Set column widths and formatting
    const colWidths = headers.map(header => ({ wch: header.length > 20 ? 30 : header.length + 5 }));
    worksheet['!cols'] = colWidths;
    
    // Merge title cell
    worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
    worksheet['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } });
    
    // Ensure number-like fields are treated as text by iterating through cells
    for (let R = 4; R < finalData.length; ++R) {
        // NISN, NIK, Phone numbers etc.
        const textFormatCells = [2, 6, 9, 10, 14, 17, 18, 24, 29, 35, 36, 37, 40, 41, 42, 43, 44];
        textFormatCells.forEach(C => {
            const cellAddress = XLSX.utils.encode_cell({r:R, c:C});
            if (worksheet[cellAddress]) {
                worksheet[cellAddress].t = 's'; // 's' forces the cell type to string
            }
        });
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, "DataSiswa");
    
    // 5. Trigger download
    XLSX.writeFile(workbook, "Data_Siswa_Lengkap.xlsx", { bookType: 'xlsx', type: 'buffer' });
    
    toast({
        title: "Ekspor Berhasil",
        description: "Data siswa telah berhasil diekspor ke file Excel.",
    });
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
