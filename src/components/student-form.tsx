"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { db, logAndReportError } from "@/lib/firebase";
import type { Student } from "@/types/student";
import { useAcademicYear } from "@/context/academic-year-context";

interface StudentFormProps {
  studentToEdit: Student | null;
  onSuccess: (student?: Student) => void;
  onCancel: () => void;
}

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Nama lengkap wajib diisi." }),
  gender: z.string({ required_error: "Jenis kelamin wajib dipilih." }),
  nisn: z.string().min(1, { message: "NISN wajib diisi." }).regex(/^[0-9]+$/, { message: "NISN hanya boleh berisi angka." }),
  kelas: z.string().optional(),
  birthPlace: z.string().optional(),
  birthDate: z.date().optional(),
  nik: z.string().regex(/^[0-9]*$/, { message: "NIK hanya boleh berisi angka." }).optional().or(z.literal('')),
  religion: z.string({ required_error: "Agama wajib dipilih." }),
  address: z.string().optional(),
  rt: z.string().regex(/^[0-9]*$/, { message: "RT hanya boleh berisi angka." }).optional().or(z.literal('')),
  rw: z.string().regex(/^[0-9]*$/, { message: "RW hanya boleh berisi angka." }).optional().or(z.literal('')),
  dusun: z.string().optional(),
  kelurahan: z.string().optional(),
  kecamatan: z.string().optional(),
  postalCode: z.string().regex(/^[0-9]*$/, { message: "Kode Pos hanya boleh berisi angka." }).optional().or(z.literal('')),
  residenceType: z.string({ required_error: "Jenis tinggal wajib dipilih." }),
  transportMode: z.string({ required_error: "Alat transportasi wajib dipilih." }),
  phone: z.string().regex(/^[0-9]*$/, { message: "Telepon hanya boleh berisi angka." }).optional().or(z.literal('')),
  mobilePhone: z.string().min(1, { message: "Nomor HP wajib diisi." }).regex(/^[0-9]+$/, { message: "Nomor HP hanya boleh berisi angka." }),

  fatherName: z.string().min(1, { message: "Nama Ayah wajib diisi." }),
  fatherBirthYear: z.string().regex(/^[0-9]*$/, { message: "Tahun Lahir Ayah hanya boleh berisi angka." }).optional().or(z.literal('')),
  fatherEducation: z.string().optional(),
  fatherOccupation: z.string().optional(),
  fatherIncome: z.string().optional(),
  fatherNik: z.string().regex(/^[0-9]*$/, { message: "NIK Ayah hanya boleh berisi angka." }).optional().or(z.literal('')),

  motherName: z.string().min(1, { message: "Nama Ibu wajib diisi." }),
  motherBirthYear: z.string().regex(/^[0-9]*$/, { message: "Tahun Lahir Ibu hanya boleh berisi angka." }).optional().or(z.literal('')),
  motherEducation: z.string().optional(),
  motherOccupation: z.string().optional(),
  motherIncome: z.string().optional(),
  motherNik: z.string().regex(/^[0-9]*$/, { message: "NIK Ibu hanya boleh berisi angka." }).optional().or(z.literal('')),

  guardianName: z.string().optional(),
  guardianBirthYear: z.string().regex(/^[0-9]*$/, { message: "Tahun Lahir Wali hanya boleh berisi angka." }).optional().or(z.literal('')),
  guardianEducation: z.string().optional(),
  guardianOccupation: z.string().optional(),
  guardianIncome: z.string().optional(),
  guardianNik: z.string().regex(/^[0-9]*$/, { message: "NIK Wali hanya boleh berisi angka." }).optional().or(z.literal('')),

  kipNumber: z.string().optional(),
  kipName: z.string().optional(),
  kksPkhNumber: z.string().optional(),
  birthCertificateRegNo: z.string().optional(),
  previousSchool: z.string().optional(),
  childOrder: z.string().regex(/^[0-9]*$/, { message: "Anak ke-berapa hanya boleh berisi angka." }).optional().or(z.literal('')),
  kkNumber: z.string().regex(/^[0-9]*$/, { message: "No KK hanya boleh berisi angka." }).optional().or(z.literal('')),
  weight: z.string().regex(/^[0-9.]*$/, { message: "Berat Badan hanya boleh berisi angka." }).optional().or(z.literal('')),
  height: z.string().regex(/^[0-9.]*$/, { message: "Tinggi Badan hanya boleh berisi angka." }).optional().or(z.literal('')),
  headCircumference: z.string().regex(/^[0-9.]*$/, { message: "Lingkar Kepala hanya boleh berisi angka." }).optional().or(z.literal('')),
  siblingsCount: z.string().regex(/^[0-9]*$/, { message: "Jumlah Saudara Kandung hanya boleh berisi angka." }).optional().or(z.literal('')),
});

const religionOptions = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu", "Lainnya"];
const residenceOptions = ["Bersama Orang Tua", "Wali", "Kos", "Asrama", "Panti Asuhan", "Lainnya"];
const transportOptions = ["Jalan Kaki", "Sepeda", "Sepeda Motor", "Mobil Pribadi", "Angkutan Umum", "Lainnya"];
const educationOptions = ["Tidak Sekolah", "SD", "SMP", "SMA", "D1", "D2", "D3", "D4", "S1", "S2", "S3"];
const occupationOptions = ["Tidak Bekerja", "Petani", "Buruh", "PNS", "Wiraswasta", "Lainnya"];
const incomeOptions = ["< 500rb", "500rb-1jt", "1jt-2jt", "2jt-5jt", "> 5jt", "Tidak Berpenghasilan"];

const defaultFormValues = {
    fullName: "",
    gender: undefined,
    nisn: "",
    kelas: "",
    birthPlace: "",
    birthDate: undefined,
    nik: "",
    religion: undefined,
    address: "",
    rt: "",
    rw: "",
    dusun: "",
    kelurahan: "",
    kecamatan: "",
    postalCode: "",
    residenceType: undefined,
    transportMode: undefined,
    phone: "",
    mobilePhone: "",
    fatherName: "",
    fatherBirthYear: "",
    fatherEducation: undefined,
    fatherOccupation: undefined,
    fatherIncome: undefined,
    fatherNik: "",
    motherName: "",
    motherBirthYear: "",
    motherEducation: undefined,
    motherOccupation: undefined,
    motherIncome: undefined,
    motherNik: "",
    guardianName: "",
    guardianBirthYear: "",
    guardianEducation: undefined,
    guardianOccupation: undefined,
    guardianIncome: undefined,
    guardianNik: "",
    kipNumber: "",
    kipName: "",
    kksPkhNumber: "",
    birthCertificateRegNo: "",
    previousSchool: "",
    childOrder: "",
    kkNumber: "",
    weight: "",
    height: "",
    headCircumference: "",
    siblingsCount: "",
};


export default function StudentForm({ studentToEdit, onSuccess, onCancel }: StudentFormProps) {
  const { toast } = useToast();
  const { activeYear } = useAcademicYear();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEditMode = !!studentToEdit;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });

  React.useEffect(() => {
    if (isEditMode && studentToEdit) {
      const studentDataForForm: { [key: string]: any } = { ...studentToEdit };

      Object.keys(studentDataForForm).forEach(key => {
        if (studentDataForForm[key] === null) {
          studentDataForForm[key] = '';
        }
      });
      
      const finalDataForForm = {
        ...studentDataForForm,
        birthDate: studentToEdit.birthDate ? new Date(studentToEdit.birthDate) : undefined,
      };

      form.reset(finalDataForForm);
    } else {
      form.reset(defaultFormValues);
    }
  }, [studentToEdit, form, isEditMode]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    const tahunAjaranUntukSimpan = isEditMode ? studentToEdit.tahunAjaran : activeYear;

    if (!tahunAjaranUntukSimpan) {
        toast({
            variant: "destructive",
            title: "Tahun Ajaran Tidak Valid",
            description: "Silakan pilih kembali tahun ajaran dan coba lagi.",
        });
        setIsSubmitting(false);
        return;
    }

    try {
      const dataToSave: { [key: string]: any } = {};
      Object.entries(values).forEach(([key, value]) => {
        dataToSave[key] = value === undefined || value === "" ? null : value;
      });
      
      dataToSave.birthDate = values.birthDate ? values.birthDate.toISOString() : null;
      dataToSave.tahunAjaran = tahunAjaranUntukSimpan;

      if (isEditMode && studentToEdit) {
        const studentRef = doc(db, "siswa", studentToEdit.id);
        await updateDoc(studentRef, dataToSave);
        toast({
          title: "Perubahan Disimpan!",
          description: "Data siswa telah berhasil diperbarui.",
        });
        const updatedStudent: Student = {
          id: studentToEdit.id,
          createdAt: studentToEdit.createdAt,
          ...dataToSave,
        } as Student;
        onSuccess(updatedStudent);
      } else {
        const docRef = await addDoc(collection(db, "siswa"), {
          ...dataToSave,
          createdAt: new Date().toISOString(),
        });
        toast({
          title: "Siswa Ditambahkan!",
          description: "Data siswa baru telah berhasil disimpan.",
        });
        form.reset(defaultFormValues);
        onSuccess();
      }
    } catch (e) {
      logAndReportError(e, "Error processing student document");
      toast({
        variant: "destructive",
        title: "Gagal!",
        description: "Terjadi kesalahan saat menyimpan data.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? "Edit Data Siswa" : "Formulir Pendaftaran Siswa Baru"}</CardTitle>
            <CardDescription>
                {`Semua data akan disimpan untuk Tahun Ajaran ${isEditMode ? studentToEdit.tahunAjaran : activeYear}. Pastikan semua data diisi dengan benar.`}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pribadi</CardTitle>
            <CardDescription>Detail identitas dasar siswa.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Kelamin</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis kelamin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                      <SelectItem value="Perempuan">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="nisn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NISN</FormLabel>
                  <FormControl>
                    <Input placeholder="Nomor Induk Siswa Nasional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="kelas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kelas</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: 10A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nik"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIK</FormLabel>
                  <FormControl>
                    <Input placeholder="Nomor Induk Kependudukan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="birthPlace"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempat Lahir</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Jakarta" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal Lahir</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pilih tanggal</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1950-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="religion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agama</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih agama" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {religionOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alamat Lengkap</CardTitle>
            <CardDescription>Informasi tempat tinggal siswa sesuai domisili.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nama jalan, nomor rumah, dll."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <FormField
                control={form.control}
                name="rt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RT</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rw"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RW</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dusun"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dusun</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Krajan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kelurahan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kelurahan</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Cempaka Putih" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kecamatan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kecamatan</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Menteng" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kode Pos</FormLabel>
                    <FormControl>
                      <Input placeholder="10310" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Kontak & Lainnya</CardTitle>
            <CardDescription>Data pendukung untuk keperluan komunikasi dan administratif.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="residenceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Tinggal</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis tinggal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                       {residenceOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="transportMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alat Transportasi</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih alat transportasi" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {transportOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telepon</FormLabel>
                  <FormControl>
                    <Input placeholder="Nomor telepon rumah" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mobilePhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>HP</FormLabel>
                  <FormControl>
                    <Input placeholder="Nomor HP aktif" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Keluarga</CardTitle>
            <CardDescription>Informasi mengenai orang tua atau wali siswa.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="father" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="father">Data Ayah</TabsTrigger>
                <TabsTrigger value="mother">Data Ibu</TabsTrigger>
                <TabsTrigger value="guardian">Data Wali</TabsTrigger>
              </TabsList>
              <TabsContent value="father" className="mt-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="fatherName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Ayah</FormLabel>
                          <FormControl>
                            <Input placeholder="Nama lengkap ayah" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fatherBirthYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tahun Lahir Ayah</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="Contoh: 1970" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fatherEducation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pendidikan Ayah</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih jenjang pendidikan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {educationOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fatherOccupation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pekerjaan Ayah</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih pekerjaan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {occupationOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fatherIncome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Penghasilan Ayah</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih rentang penghasilan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {incomeOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fatherNik"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NIK Ayah</FormLabel>
                          <FormControl>
                            <Input placeholder="NIK ayah" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                 </div>
              </TabsContent>
              <TabsContent value="mother" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="motherName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Ibu</FormLabel>
                          <FormControl>
                            <Input placeholder="Nama lengkap ibu" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="motherBirthYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tahun Lahir Ibu</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="Contoh: 1972" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="motherEducation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pendidikan Ibu</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih jenjang pendidikan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {educationOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="motherOccupation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pekerjaan Ibu</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih pekerjaan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {occupationOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="motherIncome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Penghasilan Ibu</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih rentang penghasilan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {incomeOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="motherNik"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NIK Ibu</FormLabel>
                          <FormControl>
                            <Input placeholder="NIK ibu" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                 </div>
              </TabsContent>
              <TabsContent value="guardian" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="guardianName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Wali</FormLabel>
                          <FormControl>
                            <Input placeholder="Nama lengkap wali" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="guardianBirthYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tahun Lahir Wali</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="Contoh: 1965" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="guardianEducation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pendidikan Wali</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih jenjang pendidikan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {educationOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="guardianOccupation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pekerjaan Wali</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih pekerjaan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {occupationOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="guardianIncome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Penghasilan Wali</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih rentang penghasilan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {incomeOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="guardianNik"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NIK Wali</FormLabel>
                          <FormControl>
                            <Input placeholder="NIK wali" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                 </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Tambahan Siswa</CardTitle>
            <CardDescription>Informasi pelengkap untuk keperluan administratif dan program bantuan.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="kipNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor KIP</FormLabel>
                  <FormControl>
                    <Input placeholder="Nomor Kartu Indonesia Pintar" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="kipName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama di KIP</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama sesuai di KIP" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="kksPkhNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor KKS/PKH</FormLabel>
                  <FormControl>
                    <Input placeholder="Nomor KKS/PKH" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="birthCertificateRegNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No Registrasi Akta Lahir</FormLabel>
                  <FormControl>
                    <Input placeholder="No registrasi akta lahir" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="previousSchool"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sekolah Asal</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama sekolah sebelumnya" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="kkNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No KK</FormLabel>
                  <FormControl>
                    <Input placeholder="Nomor Kartu Keluarga" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="childOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anak ke-berapa</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Contoh: 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="siblingsCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah Saudara Kandung</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Contoh: 2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Berat Badan (kg)</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Contoh: 45.5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tinggi Badan (cm)</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Contoh: 160.5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="headCircumference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lingkar Kepala (cm)</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Contoh: 55.5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          {isEditMode && (
              <Button type="button" variant="outline" size="lg" onClick={onCancel} disabled={isSubmitting}>
                Batal
              </Button>
            )}
            <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                isEditMode ? "Simpan Perubahan" : "Simpan Data Siswa"
              )}
            </Button>
        </div>
      </form>
    </Form>
  );
}
