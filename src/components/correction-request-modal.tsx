"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addDoc, collection } from "firebase/firestore";
import { type User } from "firebase/auth";
import { Loader2 } from "lucide-react";

import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@/types/student";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// List of fields that users can request corrections for.
const correctableFields: { value: keyof Student; label: string }[] = [
    { value: 'fullName', label: 'Nama Lengkap' },
    { value: 'gender', label: 'Jenis Kelamin' },
    { value: 'nisn', label: 'NISN' },
    { value: 'kelas', label: 'Kelas' },
    { value: 'birthPlace', label: 'Tempat Lahir' },
    { value: 'birthDate', label: 'Tanggal Lahir' },
    { value: 'nik', label: 'NIK' },
    { value: 'religion', label: 'Agama' },
    { value: 'address', label: 'Alamat' },
    { value: 'rt', label: 'RT' },
    { value: 'rw', label: 'RW' },
    { value: 'dusun', label: 'Dusun' },
    { value: 'kelurahan', label: 'Kelurahan' },
    { value: 'kecamatan', label: 'Kecamatan' },
    { value: 'postalCode', label: 'Kode Pos' },
    { value: 'residenceType', label: 'Jenis Tinggal' },
    { value: 'transportMode', label: 'Alat Transportasi' },
    { value: 'phone', label: 'Telepon' },
    { value: 'mobilePhone', label: 'No. HP' },
    { value: 'fatherName', label: 'Nama Ayah' },
    { value: 'fatherBirthYear', label: 'Tahun Lahir Ayah' },
    { value: 'fatherEducation', label: 'Pendidikan Ayah' },
    { value: 'fatherOccupation', label: 'Pekerjaan Ayah' },
    { value: 'fatherIncome', label: 'Penghasilan Ayah' },
    { value: 'fatherNik', label: 'NIK Ayah' },
    { value: 'motherName', label: 'Nama Ibu' },
    { value: 'motherBirthYear', label: 'Tahun Lahir Ibu' },
    { value: 'motherEducation', label: 'Pendidikan Ibu' },
    { value: 'motherOccupation', label: 'Pekerjaan Ibu' },
    { value: 'motherIncome', label: 'Penghasilan Ibu' },
    { value: 'motherNik', label: 'NIK Ibu' },
    { value: 'guardianName', label: 'Nama Wali' },
    { value: 'guardianBirthYear', label: 'Tahun Lahir Wali' },
    { value: 'guardianEducation', label: 'Pendidikan Wali' },
    { value: 'guardianOccupation', label: 'Pekerjaan Wali' },
    { value: 'guardianIncome', label: 'Penghasilan Wali' },
    { value: 'guardianNik', label: 'NIK Wali' },
    { value: 'kkNumber', label: 'No. KK' },
    { value: 'childOrder', label: 'Anak ke-' },
    { value: 'siblingsCount', label: 'Jml Saudara Kandung' },
    { value: 'previousSchool', label: 'Sekolah Asal' },
    { value: 'birthCertificateRegNo', label: 'No. Registrasi Akta Lahir' },
    { value: 'kipNumber', label: 'Nomor KIP' },
    { value: 'kipName', label: 'Nama di KIP' },
    { value: 'kksPkhNumber', label: 'Nomor KKS/PKH' },
    { value: 'weight', label: 'Berat Badan (kg)' },
    { value: 'height', label: 'Tinggi Badan (cm)' },
    { value: 'headCircumference', label: 'Lingkar Kepala (cm)' },
];

const formSchema = z.object({
  fieldToCorrect: z.string({
    required_error: "Pilih bidang yang ingin diperbaiki.",
  }),
  newValue: z.string().min(1, { message: "Nilai baru tidak boleh kosong." }),
  notes: z.string().min(10, { message: "Catatan/alasan harus diisi, minimal 10 karakter." }),
});

interface CorrectionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  user: User | null;
}

export default function CorrectionRequestModal({
  isOpen,
  onClose,
  student,
  user,
}: CorrectionRequestModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        fieldToCorrect: undefined,
        newValue: "",
        notes: "",
    }
  });

  const selectedField = form.watch("fieldToCorrect");
  const currentValue = selectedField ? student[selectedField as keyof Student] : "Data tidak ada";

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!student || !user) {
      toast({
        variant: "destructive",
        title: "Gagal!",
        description: "Informasi siswa atau pengguna tidak ditemukan.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const oldValue = student[values.fieldToCorrect as keyof Student];

      await addDoc(collection(db, "correctionRequests"), {
        studentId: student.id,
        studentName: student.fullName,
        requestedByUserId: user.uid,
        requestedByUserName: user.email || user.displayName || "Unknown User",
        fieldToCorrect: values.fieldToCorrect,
        oldValue: oldValue ?? null,
        newValue: values.newValue,
        notes: values.notes,
        status: "pending",
        requestDate: new Date().toISOString(),
      });

      toast({
        title: "Pengajuan Terkirim!",
        description: "Permintaan perbaikan Anda telah dikirim untuk ditinjau.",
      });
      form.reset();
      onClose();
    } catch (error) {
      console.error("Error submitting correction request:", error);
      toast({
        variant: "destructive",
        title: "Gagal!",
        description: "Terjadi kesalahan saat mengirim pengajuan.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleClose = () => {
    form.reset();
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajukan Perbaikan Data Siswa</DialogTitle>
          <DialogDescription>
            Ajukan perbaikan untuk data siswa "{student.fullName}". Admin akan meninjau permintaan Anda.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="fieldToCorrect"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bidang yang Ingin Diperbaiki</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih bidang data" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {correctableFields.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedField && (
              <div className="text-sm p-3 bg-muted rounded-md">
                <span className="text-muted-foreground">Nilai Saat Ini: </span>
                <span className="font-medium">{String(currentValue ?? "Data tidak ada")}</span>
              </div>
            )}

            <FormField
              control={form.control}
              name="newValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nilai Baru yang Diusulkan</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan data yang benar" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan / Alasan Perbaikan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contoh: Perubahan alamat sesuai Kartu Keluarga terbaru."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  "Kirim Pengajuan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
