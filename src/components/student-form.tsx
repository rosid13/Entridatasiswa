"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { addDoc, collection } from "firebase/firestore";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { db } from "@/lib/firebase";

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Nama lengkap wajib diisi." }),
  gender: z.string({ required_error: "Jenis kelamin wajib dipilih." }),
  nisn: z.string().optional(),
  birthPlace: z.string().optional(),
  birthDate: z.date().optional(),
  nik: z.string().optional(),
  religion: z.string({ required_error: "Agama wajib dipilih." }),
  address: z.string().optional(),
  rt: z.string().optional(),
  rw: z.string().optional(),
  dusun: z.string().optional(),
  kelurahan: z.string().optional(),
  kecamatan: z.string().optional(),
  postalCode: z.string().optional(),
  residenceType: z.string({ required_error: "Jenis tinggal wajib dipilih." }),
  transportMode: z.string({ required_error: "Alat transportasi wajib dipilih." }),
  phone: z.string().optional(),
  mobilePhone: z.string().min(1, { message: "Nomor HP wajib diisi." }),

  // Data Ayah
  fatherName: z.string().min(1, { message: "Nama Ayah wajib diisi." }),
  fatherBirthYear: z.string().optional(),
  fatherEducation: z.string().optional(),
  fatherOccupation: z.string().optional(),
  fatherIncome: z.string().optional(),
  fatherNik: z.string().optional(),

  // Data Ibu
  motherName: z.string().min(1, { message: "Nama Ibu wajib diisi." }),
  motherBirthYear: z.string().optional(),
  motherEducation: z.string().optional(),
  motherOccupation: z.string().optional(),
  motherIncome: z.string().optional(),
  motherNik: z.string().optional(),

  // Data Wali
  guardianName: z.string().optional(),
  guardianBirthYear: z.string().optional(),
  guardianEducation: z.string().optional(),
  guardianOccupation: z.string().optional(),
  guardianIncome: z.string().optional(),
  guardianNik: z.string().optional(),

  // Data Tambahan Siswa
  kipNumber: z.string().optional(),
  kipName: z.string().optional(),
  kksPkhNumber: z.string().optional(),
  birthCertificateRegNo: z.string().optional(),
  previousSchool: z.string().optional(),
  childOrder: z.string().optional(),
  kkNumber: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  headCircumference: z.string().optional(),
  siblingsCount: z.string().optional(),
});

const religionOptions = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu", "Lainnya"];
const residenceOptions = ["Bersama Orang Tua", "Wali", "Kos", "Asrama", "Panti Asuhan", "Lainnya"];
const transportOptions = ["Jalan Kaki", "Sepeda", "Sepeda Motor", "Mobil Pribadi", "Angkutan Umum", "Lainnya"];
const educationOptions = ["Tidak Sekolah", "SD", "SMP", "SMA", "D1", "D2", "D3", "D4", "S1", "S2", "S3"];
const occupationOptions = ["Tidak Bekerja", "Petani", "Buruh", "PNS", "Wiraswasta", "Lainnya"];
const incomeOptions = ["< 500rb", "500rb-1jt", "1jt-2jt", "2jt-5jt", "> 5jt", "Tidak Berpenghasilan"];

export default function StudentForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      nisn: "",
      birthPlace: "",
      nik: "",
      address: "",
      rt: "",
      rw: "",
      dusun: "",
      kelurahan: "",
      kecamatan: "",
      postalCode: "",
      phone: "",
      mobilePhone: "",
      fatherName: "",
      fatherBirthYear: "",
      fatherNik: "",
      motherName: "",
      motherBirthYear: "",
      motherNik: "",
      guardianName: "",
      guardianBirthYear: "",
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
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const dataToSave = {
        ...values,
        birthDate: values.birthDate ? values.birthDate.toISOString() : null,
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, "students"), dataToSave);
      toast({
        title: "Sukses!",
        description: "Data siswa berhasil disimpan.",
      });
      form.reset();
    } catch (e) {
      console.error("Error adding document: ", e);
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
            <CardTitle>Informasi Pribadi</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <FormField
                control={form.control}
                name="rt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RT</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="001" {...field} />
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
                      <Input type="number" placeholder="001" {...field} />
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
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="residenceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Tinggal</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="father" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="father">Data Ayah</TabsTrigger>
                <TabsTrigger value="mother">Data Ibu</TabsTrigger>
                <TabsTrigger value="guardian">Data Wali</TabsTrigger>
              </TabsList>
              <TabsContent value="father" className="mt-6 space-y-6">
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
                            <Input type="number" placeholder="Contoh: 1970" {...field} />
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <TabsContent value="mother" className="mt-6 space-y-6">
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
                            <Input type="number" placeholder="Contoh: 1972" {...field} />
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <TabsContent value="guardian" className="mt-6 space-y-6">
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
                            <Input type="number" placeholder="Contoh: 1965" {...field} />
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <Input type="number" placeholder="Contoh: 1" {...field} />
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
                    <Input type="number" placeholder="Contoh: 2" {...field} />
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
                    <Input type="number" placeholder="Contoh: 45" {...field} />
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
                    <Input type="number" placeholder="Contoh: 160" {...field} />
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
                    <Input type="number" placeholder="Contoh: 55" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>


        <div className="flex justify-end">
            <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Data"
              )}
            </Button>
        </div>
      </form>
    </Form>
  );
}
