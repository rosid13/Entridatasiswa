
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
      toast({
        variant: "destructive",
        title: "Gagal Memuat Data",
        description: "Tidak dapat mengambil daftar siswa. Periksa koneksi Anda dan muat ulang halaman.",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleExport = () => {
    if (students.length === 0) {
      toast({
        variant: "destructive",
        title: "Gagal Mengekspor",
        description: "Tidak ada data siswa untuk diekspor.",
      });
      return;
    }

    try {
      // 1. Define styles
      const thinBorder = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      const titleStyle = { font: { sz: 18, bold: true }, alignment: { horizontal: 'center', vertical: 'center' } };
      const subtitleStyle = { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' } };
      const headerStyle = { font: { sz: 14, bold: true }, border: thinBorder, alignment: { horizontal: 'center', vertical: 'center' } };
      const cellLeftStyle = { border: thinBorder, alignment: { horizontal: 'left', vertical: 'center' } };
      const cellCenterStyle = { border: thinBorder, alignment: { horizontal: 'center', vertical: 'center' } };

      // 2. Define logical column headers
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

      // 3. Map student data
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
      
      // 4. Create worksheet with all data
      const finalData = [
        ["Laporan Data Siswa - Student Data Entry"],
        [`Tanggal Ekspor: ${format(new Date(), "dd MMMM yyyy HH:mm", { locale: id })}`],
        [],
        headers,
        ...dataToExport
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet(finalData);

      // 5. Apply styling, formatting, and auto-fit columns
      if(worksheet['A1']) worksheet['A1'].s = titleStyle;
      if(worksheet['A2']) worksheet['A2'].s = subtitleStyle;

      const headerRowIndex = 3; 
      const dataStartIndex = headerRowIndex + 1;
      const dataEndIndex = dataStartIndex + dataToExport.length - 1;

      const textFormatColumnIndices = [2, 6, 9, 10, 14, 17, 18, 20, 24, 26, 30, 32, 36, 37, 38, 39, 41, 42, 44, 45, 46, 47];
      const centeredColumnIndices = [1, 2, 5, 6, 9, 10, 14, 20, 24, 26, 30, 32, 36, 37, 38, 39, 45, 46, 47, 48];

      for (let R = headerRowIndex; R <= dataEndIndex; ++R) {
          for (let C = 0; C < headers.length; ++C) {
              const cellAddress = XLSX.utils.encode_cell({r: R, c: C});
              if (!worksheet[cellAddress]) continue;

              if (R === headerRowIndex) {
                  worksheet[cellAddress].s = headerStyle;
              } else {
                  worksheet[cellAddress].s = centeredColumnIndices.includes(C) ? cellCenterStyle : cellLeftStyle;
                  if (textFormatColumnIndices.includes(C)) {
                      worksheet[cellAddress].t = 's';
                  }
              }
          }
      }
      
      const colWidths = headers.map((header, i) => {
        const dataForCol = [header, ...dataToExport.map(row => row[i])];
        const maxLength = dataForCol.reduce((max, cell) => {
            const cellLength = cell ? String(cell).length : 0;
            return Math.max(max, cellLength);
        }, 0);
        if (i === 0) return { wch: Math.max(maxLength, 25) + 2 }; 
        return { wch: maxLength + 2 };
      });
      worksheet['!cols'] = colWidths;

      // 6. Merge title and subtitle cells
      worksheet['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
          { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } }
      ];
      
      // 7. Add AutoFilter to the header row
      const filterRange = { s: { r: headerRowIndex, c: 0 }, e: { r: dataEndIndex, c: headers.length - 1 } };
      worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(filterRange) };

      // 8. Create workbook and trigger download
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "DataSiswa");
      XLSX.writeFile(workbook, "Data_Siswa_Lengkap.xlsx", { bookType: 'xlsx', type: 'buffer' });
      
      toast({
          title: "Ekspor Berhasil",
          description: "Data siswa telah berhasil diekspor ke file Excel.",
      });
    } catch (error) {
        console.error("Failed to export data to Excel:", error);
        toast({
            variant: "destructive",
            title: "Gagal Mengekspor",
            description: "Terjadi kesalahan saat membuat file Excel.",
        });
    }
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
