
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, logAndReportError } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { format } from "date-fns";
import { id } from 'date-fns/locale';

import type { CorrectionRequest } from '@/types/correction-request';
import type { AppSession } from '@/app/page';
import { useAcademicYear } from '@/context/academic-year-context';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import Footer from '@/components/footer';

export default function RequestsPage() {
    const [requests, setRequests] = useState<CorrectionRequest[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [session, setSession] = useState<AppSession | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<CorrectionRequest | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const { activeYear, isLoading: isYearLoading } = useAcademicYear();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userRoleRef = doc(db, "userRoles", currentUser.uid);
                const docSnap = await getDoc(userRoleRef);
                const userRole = docSnap.exists() ? docSnap.data().role : 'user';

                if (userRole !== 'admin') {
                    toast({
                        variant: "destructive",
                        title: "Akses Ditolak",
                        description: "Halaman ini hanya untuk admin.",
                    });
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

     useEffect(() => {
        if (!isYearLoading && !activeYear) {
          router.push('/select-year');
        }
    }, [activeYear, isYearLoading, router]);

    useEffect(() => {
        if (session?.role !== 'admin') return;
        
        const q = query(collection(db, "correctionRequests"), where("status", "==", "pending"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requestsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as CorrectionRequest));
            requestsData.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
            setRequests(requestsData);
            setPageLoading(false);
        }, (error) => {
            logAndReportError(error, "Error fetching requests");
            toast({ 
                variant: "destructive", 
                title: "Gagal Memuat Permintaan",
                description: "Tidak dapat mengambil daftar permintaan perbaikan. Periksa koneksi Anda.",
            });
            setPageLoading(false);
        });
        
        return () => unsubscribe();
    }, [session, toast]);

    const handleAction = async (action: 'approve' | 'reject') => {
        if (!selectedRequest || !session?.user) return;
        
        setIsSubmitting(true);
        try {
            const batch = writeBatch(db);

            const requestRef = doc(db, "correctionRequests", selectedRequest.id);
            const updateData = {
                status: action === 'approve' ? 'approved' : 'rejected',
                approvedByUserId: session.user.uid,
                approvalDate: new Date().toISOString(),
            };
            batch.update(requestRef, updateData);

            if (action === 'approve') {
                const studentRef = doc(db, "siswa", selectedRequest.studentId);
                const fieldToUpdate = { [selectedRequest.fieldToCorrect]: selectedRequest.newValue };
                batch.update(studentRef, fieldToUpdate);
            }

            await batch.commit();

            toast({
                title: `Permintaan ${action === 'approve' ? 'Disetujui' : 'Ditolak'}`,
                description: `Permintaan perbaikan telah berhasil ${action === 'approve' ? 'disetujui dan data siswa diperbarui' : 'ditolak'}.`,
            });
            setSelectedRequest(null);
        } catch (error) {
            logAndReportError(error, `Error ${action}ing request`);
            toast({
                variant: "destructive",
                title: "Gagal Memproses Permintaan",
                description: "Terjadi kesalahan saat memproses permintaan. Coba lagi.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const formatDate = (dateString?: string) => {
      if (!dateString) return "-";
      try {
        return format(new Date(dateString), "dd MMMM yyyy, HH:mm", { locale: id });
      } catch (error) {
        return dateString;
      }
    };

    if (pageLoading || isYearLoading || !activeYear) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <main className="flex-grow p-4 sm:p-6 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <header className="flex items-center gap-4 mb-10">
                        <Link href="/admin/dashboard" passHref>
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-foreground">Permintaan Perbaikan</h1>
                            <p className="text-muted-foreground mt-2">Tinjau dan kelola permintaan perbaikan data dari pengguna.</p>
                        </div>
                    </header>
                    <Card>
                        <CardHeader>
                            <CardTitle>Daftar Permintaan Tertunda</CardTitle>
                            <CardDescription>
                                Berikut adalah daftar permintaan perbaikan data yang memerlukan tinjauan Anda.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {requests.length > 0 ? (
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nama Siswa</TableHead>
                                                <TableHead>Bidang</TableHead>
                                                <TableHead>Diajukan Oleh</TableHead>
                                                <TableHead>Tanggal</TableHead>
                                                <TableHead className="text-right">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {requests.map((req) => (
                                                <TableRow key={req.id}>
                                                    <TableCell className="font-medium">{req.studentName}</TableCell>
                                                    <TableCell><Badge variant="secondary">{req.fieldToCorrect}</Badge></TableCell>
                                                    <TableCell>{req.requestedByUserName}</TableCell>
                                                    <TableCell>{formatDate(req.requestDate)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="outline" size="sm" onClick={() => setSelectedRequest(req)}>
                                                            Lihat Detail
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">
                                    Tidak ada permintaan perbaikan yang tertunda.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {selectedRequest && (
                    <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Detail Permintaan Perbaikan</DialogTitle>
                                <DialogDescription>
                                    Tinjau detail permintaan untuk siswa <strong>{selectedRequest.studentName}</strong>.
                                </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="max-h-[60vh] pr-4">
                                <div className="space-y-4 py-4 text-sm">
                                    <div className="grid grid-cols-[150px_1fr] items-start gap-4">
                                        <span className="text-muted-foreground">Nama Siswa</span>
                                        <span className="font-medium">{selectedRequest.studentName}</span>

                                        <span className="text-muted-foreground">Diajukan Oleh</span>
                                        <span className="font-medium">{selectedRequest.requestedByUserName}</span>

                                        <span className="text-muted-foreground">Tanggal</span>
                                        <span className="font-medium">{formatDate(selectedRequest.requestDate)}</span>

                                        <span className="text-muted-foreground">Bidang Data</span>
                                        <span className="font-medium"><Badge variant="outline">{selectedRequest.fieldToCorrect}</Badge></span>
                                        
                                        <span className="text-muted-foreground">Nilai Lama</span>
                                        <div className="font-mono p-2 bg-muted rounded-md break-all">{String(selectedRequest.oldValue ?? 'Kosong')}</div>
                                        
                                        <span className="text-muted-foreground">Nilai Baru</span>
                                        <div className="font-mono p-2 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-md break-all">{String(selectedRequest.newValue ?? 'Kosong')}</div>
                                        
                                        <span className="text-muted-foreground">Alasan</span>
                                        <p className="p-2 bg-muted rounded-md break-words whitespace-pre-wrap">{selectedRequest.notes}</p>
                                    </div>
                                </div>
                            </ScrollArea>
                            <DialogFooter className="border-t pt-4 sm:justify-between">
                                <DialogClose asChild>
                                    <Button variant="outline" disabled={isSubmitting}>Batal</Button>
                                </DialogClose>
                                <div className='flex gap-2'>
                                    <Button variant="destructive" onClick={() => handleAction('reject')} disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                                        Tolak
                                    </Button>
                                    <Button onClick={() => handleAction('approve')} disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                        Setujui
                                    </Button>
                                </div>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </main>
            <Footer />
        </div>
    );
}
