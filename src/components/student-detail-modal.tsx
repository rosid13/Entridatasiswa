"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { id } from 'date-fns/locale';
import type { Student } from '@/types/student';

interface StudentDetailModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
}

const DetailItem = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="grid grid-cols-2 gap-2 text-sm">
    <p className="text-muted-foreground">{label}</p>
    <p className="font-medium break-words">{value || "-"}</p>
  </div>
);

export default function StudentDetailModal({ student, isOpen, onClose, onEdit, onDelete }: StudentDetailModalProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  if (!student) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: id });
    } catch (error) {
      return "-";
    }
  };

  const handleDeleteConfirm = () => {
    onDelete(student.id);
    setIsAlertOpen(false);
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detail Siswa: {student.fullName}</DialogTitle>
            <DialogDescription>
              Informasi lengkap mengenai siswa yang terdaftar.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-6">
            <div className="space-y-6 py-4">
              
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Informasi Pribadi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 border-t pt-4">
                  <DetailItem label="Nama Lengkap" value={student.fullName} />
                  <DetailItem label="Jenis Kelamin" value={student.gender} />
                  <DetailItem label="NISN" value={student.nisn} />
                  <DetailItem label="Kelas" value={student.kelas} />
                  <DetailItem label="NIK" value={student.nik} />
                  <DetailItem label="Tempat Lahir" value={student.birthPlace} />
                  <DetailItem label="Tanggal Lahir" value={formatDate(student.birthDate)} />
                  <DetailItem label="Agama" value={student.religion} />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Alamat Lengkap</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 border-t pt-4">
                  <DetailItem label="Alamat" value={student.address} />
                  <DetailItem label="RT" value={student.rt} />
                  <DetailItem label="RW" value={student.rw} />
                  <DetailItem label="Dusun" value={student.dusun} />
                  <DetailItem label="Kelurahan" value={student.kelurahan} />
                  <DetailItem label="Kecamatan" value={student.kecamatan} />
                  <DetailItem label="Kode Pos" value={student.postalCode} />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Informasi Kontak & Lainnya</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 border-t pt-4">
                  <DetailItem label="Jenis Tinggal" value={student.residenceType} />
                  <DetailItem label="Alat Transportasi" value={student.transportMode} />
                  <DetailItem label="Telepon" value={student.phone} />
                  <DetailItem label="No. HP" value={student.mobilePhone} />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Data Keluarga</h3>
                <div className="border-t pt-4">
                  <Tabs defaultValue="father" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="father">Data Ayah</TabsTrigger>
                      <TabsTrigger value="mother">Data Ibu</TabsTrigger>
                      <TabsTrigger value="guardian">Data Wali</TabsTrigger>
                    </TabsList>
                    <TabsContent value="father" className="mt-4 space-y-2 p-1">
                      <DetailItem label="Nama Ayah" value={student.fatherName} />
                      <DetailItem label="Tahun Lahir" value={student.fatherBirthYear} />
                      <DetailItem label="Pendidikan" value={student.fatherEducation} />
                      <DetailItem label="Pekerjaan" value={student.fatherOccupation} />
                      <DetailItem label="Penghasilan" value={student.fatherIncome} />
                      <DetailItem label="NIK Ayah" value={student.fatherNik} />
                    </TabsContent>
                    <TabsContent value="mother" className="mt-4 space-y-2 p-1">
                      <DetailItem label="Nama Ibu" value={student.motherName} />
                      <DetailItem label="Tahun Lahir" value={student.motherBirthYear} />
                      <DetailItem label="Pendidikan" value={student.motherEducation} />
                      <DetailItem label="Pekerjaan" value={student.motherOccupation} />
                      <DetailItem label="Penghasilan" value={student.motherIncome} />
                      <DetailItem label="NIK Ibu" value={student.motherNik} />
                    </TabsContent>
                    <TabsContent value="guardian" className="mt-4 space-y-2 p-1">
                      <DetailItem label="Nama Wali" value={student.guardianName} />
                      <DetailItem label="Tahun Lahir" value={student.guardianBirthYear} />
                      <DetailItem label="Pendidikan" value={student.guardianEducation} />
                      <DetailItem label="Pekerjaan" value={student.guardianOccupation} />
                      <DetailItem label="Penghasilan" value={student.guardianIncome} />
                      <DetailItem label="NIK Wali" value={student.guardianNik} />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Data Tambahan Siswa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 border-t pt-4">
                  <DetailItem label="No. KK" value={student.kkNumber} />
                  <DetailItem label="Anak ke-" value={student.childOrder} />
                  <DetailItem label="Jml Saudara Kandung" value={student.siblingsCount} />
                  <DetailItem label="Sekolah Asal" value={student.previousSchool} />
                  <DetailItem label="No. Registrasi Akta Lahir" value={student.birthCertificateRegNo} />
                  <DetailItem label="Nomor KIP" value={student.kipNumber} />
                  <DetailItem label="Nama di KIP" value={student.kipName} />
                  <DetailItem label="Nomor KKS/PKH" value={student.kksPkhNumber} />
                  <DetailItem label="Berat Badan (kg)" value={student.weight} />
                  <DetailItem label="Tinggi Badan (cm)" value={student.height} />
                  <DetailItem label="Lingkar Kepala (cm)" value={student.headCircumference} />
                </div>
              </div>

            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 sm:justify-between">
              <div>
                <Button variant="destructive" onClick={() => setIsAlertOpen(true)}>
                    Hapus Data
                </Button>
              </div>
              <Button variant="outline" onClick={() => onEdit(student)}>
                  Edit Data
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus Data</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data siswa ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
