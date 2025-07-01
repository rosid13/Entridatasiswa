
"use client";

import { useState, useEffect, useCallback } from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, getDocs, doc, setDoc, getDoc, orderBy, addDoc, where, deleteDoc } from 'firebase/firestore';

import { db, auth, logAndReportError } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { AppSession } from '@/app/page';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ArrowLeft, PlusCircle, Trash2 } from 'lucide-react';
import Footer from '@/components/footer';

interface AcademicYear {
    id: string;
    year: string;
}

const academicYearSchema = z.object({
  year: z.string()
    .min(1, { message: "Tahun ajaran tidak boleh kosong." })
    .regex(/^\d{4}\/\d{4}$/, { message: "Format harus 'YYYY/YYYY', contoh: 2024/2025" }),
});

export default function AcademicYearsManagementPage() {
    const [pageLoading, setPageLoading] = useState(true);
    const [session, setSession] = useState<AppSession | null>(null);
    const [years, setYears] = useState<AcademicYear[]>([]);
    const [yearsLoading, setYearsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [yearToDelete, setYearToDelete] = useState<AcademicYear | null>(null);

    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof academicYearSchema>>({
        resolver: zodResolver(academicYearSchema),
        defaultValues: { year: "" },
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userRoleRef = doc(db, "userRoles", currentUser.uid);
                const docSnap = await getDoc(userRoleRef);
                const userRole = docSnap.exists() ? docSnap.data().role : 'user';

                if (userRole !== 'admin') {
                    toast({ variant: "destructive", title: "Akses Ditolak", description: "Halaman ini hanya untuk admin." });
                    router.push('/');
                    return;
                }
                setSession({ user: currentUser, role: userRole });
            } else {
                router.push('/login');
            }
            setPageLoading(false);
        });
        return () => unsubscribe();
    }, [router, toast]);

    const fetchYears = useCallback(async () => {
        setYearsLoading(true);
        try {
            const q = query(collection(db, "availableAcademicYears"), orderBy("year", "desc"));
            const querySnapshot = await getDocs(q);
            const yearsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                year: doc.data().year
            } as AcademicYear));
            setYears(yearsData);
        } catch (error) {
            logAndReportError(error, "Error fetching academic years");
            toast({ variant: "destructive", title: "Gagal Memuat Data", description: "Tidak dapat mengambil daftar tahun ajaran." });
        } finally {
            setYearsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (session) {
            fetchYears();
        }
    }, [session, fetchYears]);

    async function onAddSubmit(values: z.infer<typeof academicYearSchema>) {
        setIsSubmitting(true);
        try {
            const q = query(collection(db, "availableAcademicYears"), where("year", "==", values.year));
            const existing = await getDocs(q);
            if (!existing.empty) {
                toast({ variant: "destructive", title: "Gagal Menambah", description: "Tahun ajaran tersebut sudah ada." });
                return;
            }

            await addDoc(collection(db, "availableAcademicYears"), { year: values.year });
            toast({ title: "Berhasil", description: `Tahun ajaran ${values.year} telah ditambahkan.` });
            form.reset();
            fetchYears();
        } catch (error) {
            logAndReportError(error, "Error adding academic year");
            toast({ variant: "destructive", title: "Gagal Menambah", description: "Terjadi kesalahan saat menyimpan data." });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleDelete = async () => {
        if (!yearToDelete) return;
        setIsSubmitting(true);
        try {
            await deleteDoc(doc(db, "availableAcademicYears", yearToDelete.id));
            toast({ title: "Berhasil Dihapus", description: `Tahun ajaran ${yearToDelete.year} telah dihapus.` });
            setYearToDelete(null);
            fetchYears();
        } catch (error) {
            logAndReportError(error, "Error deleting academic year");
            toast({ variant: "destructive", title: "Gagal Menghapus", description: "Terjadi kesalahan saat menghapus data." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (pageLoading) {
        return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }
    
    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-grow">
                <header className="bg-card/70 backdrop-blur-md border-b sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto flex items-center gap-4 p-4 sm:p-6">
                        <Link href="/admin/dashboard" passHref><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">Manajemen Tahun Ajaran</h1>
                            <p className="text-white/80 mt-2">Tambah atau hapus tahun ajaran yang tersedia di aplikasi.</p>
                        </div>
                    </div>
                </header>
                
                <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6 md:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <Card>
                                 <CardHeader>
                                    <CardTitle>Tambah Tahun Ajaran</CardTitle>
                                    <CardDescription>Masukkan tahun ajaran baru.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-6">
                                            <FormField
                                                control={form.control}
                                                name="year"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Tahun Ajaran</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Contoh: 2024/2025" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menambah...</> : <><PlusCircle className="mr-2 h-4 w-4" /> Tambah</>}
                                            </Button>
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Daftar Tahun Ajaran</CardTitle>
                                    <CardDescription>Daftar semua tahun ajaran yang tersedia.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {yearsLoading ? (
                                        <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                                    ) : years.length > 0 ? (
                                        <div className="border rounded-md">
                                            <Table>
                                                <TableHeader><TableRow><TableHead>Tahun Ajaran</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                                                <TableBody>
                                                    {years.map((y) => (
                                                        <TableRow key={y.id}>
                                                            <TableCell className="font-medium">{y.year}</TableCell>
                                                            <TableCell className="text-right">
                                                                <Button variant="destructive" size="icon" onClick={() => setYearToDelete(y)} disabled={isSubmitting}><Trash2 className="h-4 w-4" /></Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <p className="text-center text-muted-foreground py-8">Belum ada tahun ajaran yang ditambahkan.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            <AlertDialog open={!!yearToDelete} onOpenChange={(open) => !open && setYearToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus tahun ajaran <strong>{yearToDelete?.year}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menghapus...</> : "Ya, Hapus"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
